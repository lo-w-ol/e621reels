import {
  normalizePage,
  sanitizeTags,
  sanitizeRating,
  sanitizeRatioFilter,
  sanitizeAutocompleteQuery,
  json,
} from './utils.js';

const E621_API = 'https://e621.net/posts.json';
const E621_TAG_AUTOCOMPLETE_API = 'https://e621.net/tags/autocomplete.json';
const USER_AGENT = 'FurryReel/1.0 (contact: support@furryreel.com)';
const PAGE_SIZE = 24;
const BASE_TAGS = ['animated'];
const VIDEO_MEDIA = new Set(['webm', 'mp4', 'gif']);
const IMAGE_MEDIA = new Set(['jpg', 'jpeg', 'png', 'webp']);
const SUPPORTED_MEDIA = new Set([...VIDEO_MEDIA, ...IMAGE_MEDIA]);
const TAG_AUTOCOMPLETE_LIMIT = 8;
const UPSTREAM_COOLDOWN_MS = 1100;
const DEBUG_LOGS = false;
const RATIO_FILTER_TAGS = {
  vertical: 'ratio:<1',
  landscape: 'ratio:>1',
};
let lastUpstreamRequestAt = 0;

export { handlePosts, handleTagAutocomplete };

function publicApiError(message, status, request) {
  return json({ error: message, status }, status, request);
}

function buildSafeLogMeta(request, extra = {}) {
  return {
    ray: request.headers.get('cf-ray') || null,
    colo: request.cf?.colo || null,
    ...extra,
  };
}

async function handlePosts(request, url) {
  if (request.method !== 'GET') {
    return publicApiError('Method not allowed', 405, request);
  }

  const mode = url.searchParams.get('mode') === 'score' ? 'score' : 'trending';
  const page = normalizePage(url.searchParams.get('page'));
  const rawTags = sanitizeTags(url.searchParams.get('tags') || '');
  const requestedRating = sanitizeRating(url.searchParams.get('rating'));
  const requestedRatio = sanitizeRatioFilter(url.searchParams.get('ratio'));
  const mediaMode = url.searchParams.get('media') === 'image' ? 'image' : 'reel';
  const apiTags = [
    mode === 'score' ? 'order:score' : 'order:rank',
    ...(mediaMode === 'reel' ? BASE_TAGS : []),
    ...rawTags,
    ...(requestedRating ? ['rating:' + requestedRating] : []),
    ...(requestedRatio ? [RATIO_FILTER_TAGS[requestedRatio]] : []),
  ].join(' ');

  try {
    const posts = [];
    const upstream = new URL(E621_API);
    upstream.searchParams.set('limit', String(PAGE_SIZE));
    upstream.searchParams.set('page', String(page));
    upstream.searchParams.set('tags', apiTags);
    upstream.searchParams.set('_client', USER_AGENT);

    await waitForUpstreamSlot();

    const response = await fetch(upstream, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      cf: {
        cacheTtl: 120,
        cacheEverything: false,
      },
    });

    if (!response.ok) {
      console.error('e621 upstream returned non-OK response', buildSafeLogMeta(request, {
        endpoint: 'posts',
        page,
        mediaMode,
        upstreamStatus: response.status,
        upstreamStatusText: response.statusText,
      }));
      return publicApiError('Upstream content request failed', 502, request);
    }

    const data = await response.json();
    const pagePosts = Array.isArray(data.posts)
      ? data.posts
          .filter((post) => {
            const ext = String(post?.file?.ext || '').toLowerCase();
            const hasRenderableMedia = Boolean(post?.file?.url || post?.sample?.url || post?.preview?.url);
            if (!hasRenderableMedia || !SUPPORTED_MEDIA.has(ext)) return false;
            return mediaMode === 'image' ? IMAGE_MEDIA.has(ext) : VIDEO_MEDIA.has(ext);
          })
          .map((post) => mapPost(post))
      : [];
    posts.push(...pagePosts);

    return json({
      mode,
      page,
      tags: rawTags,
      rating: requestedRating,
      ratio: requestedRatio,
      posts: posts.slice(0, PAGE_SIZE),
      source: 'worker',
    }, 200, request);
  } catch (error) {
    const logMeta = buildSafeLogMeta(request, {
      endpoint: 'posts',
      page,
      mediaMode,
      message: error instanceof Error ? error.message : String(error),
    });
    if (DEBUG_LOGS && error instanceof Error) {
      logMeta.stack = error.stack;
    }
    console.error('e621 upstream fetch threw exception', logMeta);
    return publicApiError('Upstream content request failed', 502, request);
  }
}

async function handleTagAutocomplete(request, url) {
  if (request.method !== 'GET') {
    return publicApiError('Method not allowed', 405, request);
  }

  const query = sanitizeAutocompleteQuery(String(url.searchParams.get('q') || ''));
  if (!query) {
    return json({ query: '', tags: [] }, 200, request);
  }

  const upstream = new URL(E621_TAG_AUTOCOMPLETE_API);
  upstream.searchParams.set('search[name_matches]', query + '*');

  try {
    const response = await fetch(upstream, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      cf: {
        cacheTtl: 180,
        cacheEverything: false,
      },
    });

    if (!response.ok) {
      console.error('e621 tag autocomplete returned non-OK response', buildSafeLogMeta(request, {
        endpoint: 'tags-autocomplete',
        upstreamStatus: response.status,
        upstreamStatusText: response.statusText,
      }));
      return publicApiError('Upstream autocomplete request failed', 502, request);
    }

    const data = await response.json();
    const tags = Array.isArray(data)
      ? data
          .filter((tag) => tag && typeof tag.name === 'string')
          .slice(0, TAG_AUTOCOMPLETE_LIMIT)
          .map((tag) => ({
            id: tag.id || null,
            name: tag.name,
            category: Number.isFinite(tag.category) ? tag.category : null,
            postCount: Number.isFinite(tag.post_count) ? tag.post_count : 0,
            antecedentName: tag.antecedent_name || null,
          }))
      : [];

    return json({ query, tags, source: 'worker' }, 200, request);
  } catch (error) {
    const logMeta = buildSafeLogMeta(request, {
      endpoint: 'tags-autocomplete',
      message: error instanceof Error ? error.message : String(error),
    });
    if (DEBUG_LOGS && error instanceof Error) {
      logMeta.stack = error.stack;
    }
    console.error('e621 tag autocomplete threw exception', logMeta);
    return publicApiError('Upstream autocomplete request failed', 502, request);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForUpstreamSlot() {
  const now = Date.now();
  const waitMs = Math.max(0, lastUpstreamRequestAt + UPSTREAM_COOLDOWN_MS - now);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastUpstreamRequestAt = Date.now();
}

function mapPost(post) {
  const ext = String(post.file.ext || '').toLowerCase();
  const width = post.file?.width || post.sample?.width || 0;
  const height = post.file?.height || post.sample?.height || 0;
  const artist = Array.isArray(post.tags?.artist) ? post.tags.artist.filter(Boolean) : [];
  const species = Array.isArray(post.tags?.species) ? post.tags.species.filter(Boolean) : [];
  const general = Array.isArray(post.tags?.general) ? post.tags.general.filter(Boolean).slice(0, 12) : [];

  return {
    id: post.id,
    ext,
    type: VIDEO_MEDIA.has(ext) ? 'video' : 'image',
    score: post.score?.total || 0,
    rating: post.rating || 'u',
    width,
    height,
    createdAt: post.created_at,
    mediaUrl: post.file.url || post.sample?.url || post.preview?.url || '',
    previewUrl: post.preview?.url || post.sample?.url || post.file.url || '',
    sourceUrl: 'https://e621.net/posts/' + post.id,
    description: [
      artist.length ? 'Artist: ' + artist.join(', ') : 'Artist unknown',
      species.length ? 'Species: ' + species.slice(0, 3).join(', ') : null,
    ]
      .filter(Boolean)
      .join(' • '),
    tags: [...artist.map((tag) => 'artist:' + tag), ...general],
  };
}
