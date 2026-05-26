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
const UPSTREAM_ERROR_PREVIEW_LIMIT = 400;
const TAG_AUTOCOMPLETE_LIMIT = 8;
const UPSTREAM_COOLDOWN_MS = 1100;
const RATIO_FILTER_TAGS = {
  vertical: 'ratio:<1',
  landscape: 'ratio:>1',
};
let lastUpstreamRequestAt = 0;

export { handlePosts, handleTagAutocomplete };
async function handlePosts(request, url) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
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

  const requestMeta = {
    mode,
    page,
    tags: rawTags,
    rating: requestedRating,
    ratio: requestedRatio,
    upstream: E621_API,
    ray: request.headers.get('cf-ray') || null,
    colo: request.cf?.colo || null,
  };

  try {
    const pagesToTry = 1;
    const posts = [];
    for (let pageOffset = 0; pageOffset < pagesToTry; pageOffset++) {
      const upstream = new URL(E621_API);
      upstream.searchParams.set('limit', String(PAGE_SIZE));
      upstream.searchParams.set('page', String(page + pageOffset));
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
        const upstreamBody = trimForLog(await response.text());
        console.error('e621 upstream returned a non-OK response', {
          ...requestMeta,
          upstream: upstream.toString(),
          upstreamStatus: response.status,
          upstreamStatusText: response.statusText,
          upstreamBody,
        });

        return json(
          {
            error: 'Failed to fetch from e621',
            status: response.status,
            upstreamStatusText: response.statusText,
            details: upstreamBody,
            requestMeta,
          },
          502,
        );
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
      if (posts.length >= PAGE_SIZE || mediaMode !== 'image') break;
    }

    return json({
      mode,
      page,
      tags: rawTags,
      rating: requestedRating,
      ratio: requestedRatio,
      posts: posts.slice(0, PAGE_SIZE),
      source: 'worker',
    });
  } catch (error) {
    console.error('e621 upstream fetch threw an exception', {
      ...requestMeta,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });

    return json(
      {
        error: 'Failed to fetch from e621',
        status: 0,
        details: error instanceof Error ? error.message : String(error),
        requestMeta,
      },
      502,
    );
  }
}

async function handleTagAutocomplete(request, url) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rawQuery = String(url.searchParams.get('q') || '');
  const query = sanitizeAutocompleteQuery(rawQuery);

  if (!query) {
    return json({ query: '', tags: [] });
  }

  const upstream = new URL(E621_TAG_AUTOCOMPLETE_API);
  upstream.searchParams.set('search[name_matches]', query + '*');

  const requestMeta = {
    query,
    upstream: upstream.toString(),
    ray: request.headers.get('cf-ray') || null,
    colo: request.cf?.colo || null,
  };

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
      const upstreamBody = trimForLog(await response.text());
      console.error('e621 tag autocomplete returned a non-OK response', {
        ...requestMeta,
        upstreamStatus: response.status,
        upstreamStatusText: response.statusText,
        upstreamBody,
      });

      return json(
        {
          error: 'Failed to fetch tag autocomplete',
          status: response.status,
          upstreamStatusText: response.statusText,
          details: upstreamBody,
          requestMeta,
        },
        502,
      );
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

    return json({ query, tags, source: 'worker' });
  } catch (error) {
    console.error('e621 tag autocomplete threw an exception', {
      ...requestMeta,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });

    return json(
      {
        error: 'Failed to fetch tag autocomplete',
        status: 0,
        details: error instanceof Error ? error.message : String(error),
        requestMeta,
      },
      502,
    );
  }
}

function trimForLog(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, UPSTREAM_ERROR_PREVIEW_LIMIT);
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

