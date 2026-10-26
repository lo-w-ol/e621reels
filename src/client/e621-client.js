// Shared browser client for every e621 API call made by FurryReel pages.
//
// One module owns rate limiting, de-duplication, caching, timeouts, retries and timing logs, so the
// reels, photos and settings pages cannot drift apart or exceed e621's limit (2 requests/second hard,
// 1/second recommended; going over returns 503). It is served to browsers by the Worker at
// /assets/<version>/e621-client.js and imported directly by the Node unit tests in test/.
// Everything that touches the environment (fetch, clock, timers, storage, locks) is injectable.

export const E621_ORIGIN = 'https://e621.net';
// Browsers cannot set User-Agent, so e621 asks browser clients to identify themselves with `_client`.
export const CLIENT_NAME = 'FurryReel/1.0 (contact: support@furryreel.com)';
export const MIN_REQUEST_INTERVAL_MS = 1000;
// e621 answers 400 for autocomplete queries shorter than this, so they are never sent.
export const AUTOCOMPLETE_MIN_LENGTH = 3;
export const AUTOCOMPLETE_LIMIT = 8;

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const THROTTLE_STATUS = new Set([429, 503]);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const REEL_EXTS = new Set(['webm', 'mp4', 'gif']);
const SLOT_STORAGE_KEY = 'fr_api_next_slot';
const LOCK_NAME = 'fr-e621-api';

export class ApiError extends Error {
  constructor(message, { kind, status = 0, retryable = false, throttled = false } = {}) {
    super(message);
    this.name = 'ApiError';
    // kind: 'timeout' | 'network' | 'http' | 'bad_json' | 'aborted'
    this.kind = kind;
    this.status = status;
    this.retryable = retryable;
    this.throttled = throttled;
  }
}

function abortError() {
  return new ApiError('Request aborted', { kind: 'aborted' });
}

export function isAbortError(error) {
  return Boolean(error) && (error.kind === 'aborted' || error.name === 'AbortError');
}

export function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, Math.max(0, ms));
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

// "Equal jitter" exponential backoff: 50–100% of base * 2^(attempt-1), capped at maxMs.
export function backoffDelay(attempt, { backoffBaseMs = 1000, backoffMaxMs = 8000 } = {}, random = Math.random) {
  const step = Math.min(backoffMaxMs, backoffBaseMs * 2 ** Math.max(0, attempt - 1));
  return Math.round(step / 2 + (random() * step) / 2);
}

// Hands out request start slots at least `intervalMs` apart. `sharedStore` and `lock` extend the
// spacing across tabs (localStorage + Web Locks in the browser), because e621 limits per IP, not per tab.
export function createRateLimiter({
  intervalMs = MIN_REQUEST_INTERVAL_MS,
  now = () => Date.now(),
  sleep = abortableSleep,
  sharedStore = null,
  lock = null,
  maxPenaltyMs = 30000,
} = {}) {
  let nextSlotAt = 0;
  let chain = Promise.resolve();
  const runExclusive = lock || ((fn) => fn());

  function sharedNextSlot() {
    if (!sharedStore) return 0;
    const value = Number(sharedStore.read()) || 0;
    // Ignore far-future values (clock change, corrupt storage) so one tab can never stall the rest.
    return value > now() + maxPenaltyMs + intervalMs ? 0 : value;
  }

  function reserve(at) {
    nextSlotAt = at;
    if (sharedStore) sharedStore.write(at);
  }

  function acquire(signal) {
    const turn = chain.then(() => runExclusive(async () => {
      if (signal && signal.aborted) throw abortError();
      const waitMs = Math.max(nextSlotAt, sharedNextSlot()) - now();
      if (waitMs > 0) await sleep(waitMs, signal);
      if (signal && signal.aborted) throw abortError();
      reserve(now() + intervalMs);
      return Math.max(0, waitMs);
    }, signal));
    chain = turn.catch(() => {});
    return turn;
  }

  // Pushes every caller (in every tab) back after a throttling response, not just the one retrying.
  function penalize(ms) {
    const until = now() + Math.min(Math.max(0, ms), maxPenaltyMs);
    if (until > Math.max(nextSlotAt, sharedNextSlot())) reserve(until);
  }

  return { acquire, penalize };
}

// Memory + optional Storage (sessionStorage in the browser) cache with fresh and stale lifetimes.
// Stale entries are only used as a fallback when e621 cannot be reached.
export function createResponseCache({ storage = null, prefix = 'fr_api_v1:', maxEntries = 40, now = () => Date.now() } = {}) {
  const memory = new Map();

  function readStored(key) {
    if (!storage) return null;
    try {
      const raw = storage.getItem(prefix + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function remove(key) {
    memory.delete(key);
    if (!storage) return;
    try {
      storage.removeItem(prefix + key);
    } catch {
      // Storage unavailable (private mode, blocked site data): memory cache still works.
    }
  }

  // Drops the oldest stored entries beyond `limit`. Entries are only parsed when over the limit.
  function trimStorage(limit) {
    const keys = [];
    for (let i = 0; i < storage.length; i += 1) {
      const fullKey = storage.key(i);
      if (fullKey && fullKey.startsWith(prefix)) keys.push(fullKey.slice(prefix.length));
    }
    if (keys.length <= limit) return;
    keys
      .map((key) => ({ key, storedAt: (readStored(key) || { storedAt: 0 }).storedAt }))
      .sort((a, b) => a.storedAt - b.storedAt)
      .slice(0, keys.length - limit)
      .forEach((item) => remove(item.key));
  }

  function persist(key, entry) {
    const raw = JSON.stringify(entry);
    try {
      storage.setItem(prefix + key, raw);
      trimStorage(maxEntries);
    } catch {
      try {
        trimStorage(Math.floor(maxEntries / 2));
        storage.setItem(prefix + key, raw);
      } catch {
        // Quota exceeded or storage blocked: keep the in-memory copy only.
      }
    }
  }

  function read(key) {
    let entry = memory.get(key);
    if (!entry) {
      entry = readStored(key);
      if (entry) memory.set(key, entry);
    }
    if (!entry) return null;
    const t = now();
    if (t > entry.staleUntil) {
      remove(key);
      return null;
    }
    return { value: entry.value, storedAt: entry.storedAt, fresh: t <= entry.freshUntil };
  }

  function write(key, value, { ttlMs, staleTtlMs = ttlMs }) {
    const t = now();
    const entry = { value, storedAt: t, freshUntil: t + ttlMs, staleUntil: t + Math.max(ttlMs, staleTtlMs) };
    memory.delete(key);
    memory.set(key, entry);
    while (memory.size > maxEntries) memory.delete(memory.keys().next().value);
    if (storage) persist(key, entry);
  }

  return { read, write, remove };
}

// Small ring buffer of request outcomes for diagnosing slowdowns. Holds no tags or URLs, only labels.
export function createRequestLog({ limit = 100, now = () => Date.now(), sink = null } = {}) {
  const entries = [];

  function record(event) {
    const entry = { at: now(), ...event };
    entries.push(entry);
    if (entries.length > limit) entries.shift();
    if (sink) sink(entry);
  }

  function summary() {
    const count = (outcome) => entries.filter((entry) => entry.outcome === outcome).length;
    const okTimes = entries.filter((entry) => entry.outcome === 'ok').map((entry) => entry.ms).sort((a, b) => a - b);
    const pick = (q) => (okTimes.length ? okTimes[Math.min(okTimes.length - 1, Math.floor(q * okTimes.length))] : null);
    const failures = entries.filter((entry) => entry.outcome === 'failed');
    return {
      networkRequests: entries.filter((entry) => entry.attempt).length,
      ok: okTimes.length,
      cacheHits: count('cache-hit'),
      deduplicated: count('dedup'),
      retries: count('retry'),
      failures: failures.length,
      staleFallbacks: count('stale-fallback'),
      p50Ms: pick(0.5),
      p95Ms: pick(0.95),
      maxMs: okTimes.length ? okTimes[okTimes.length - 1] : null,
      lastFailure: failures.length ? failures[failures.length - 1] : null,
    };
  }

  return { record, summary, entries: () => entries.slice() };
}

export function createApiClient({
  fetchImpl,
  limiter,
  cache = null,
  logger = null,
  now = () => Date.now(),
  sleep = abortableSleep,
  random = Math.random,
  defaults = {},
} = {}) {
  const settings = {
    timeoutMs: 10000,
    maxAttempts: 3,
    backoffBaseMs: 1000,
    backoffMaxMs: 8000,
    ttlMs: 0,
    staleTtlMs: 0,
    ...defaults,
  };
  const inflight = new Map();
  const log = (event) => {
    if (logger) logger.record(event);
  };

  function emit(entry, status) {
    entry.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch {
        // A broken status listener must not break the request.
      }
    });
  }

  // Once sent, a request is bounded only by its timeout: callers that lose interest do not cancel it,
  // because its rate-limit slot is already spent and the result is still worth caching.
  async function attemptFetch(url, opts) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeoutMs);
    const failure = () => {
      if (timedOut) return new ApiError('Request timed out', { kind: 'timeout', retryable: true });
      // Includes throttling responses Cloudflare sends without CORS headers, which surface as TypeError.
      return new ApiError('Network error', { kind: 'network', retryable: true, throttled: true });
    };
    try {
      let response;
      let text;
      try {
        // Only CORS-safelisted headers, so no preflight request; credentials are never needed.
        response = await fetchImpl(url, { headers: { Accept: 'application/json' }, credentials: 'omit', signal: controller.signal });
        text = await response.text();
      } catch {
        throw failure();
      }
      if (!response.ok) {
        throw new ApiError('HTTP ' + response.status, {
          kind: 'http',
          status: response.status,
          retryable: RETRYABLE_STATUS.has(response.status),
          throttled: THROTTLE_STATUS.has(response.status),
        });
      }
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new ApiError('Response was not valid JSON', { kind: 'bad_json', status: response.status, retryable: true });
      }
      if (opts.validate && !opts.validate(payload)) {
        throw new ApiError('Unexpected response shape', { kind: 'bad_json', status: response.status, retryable: true });
      }
      return opts.transform ? opts.transform(payload) : payload;
    } finally {
      clearTimeout(timer);
    }
  }

  function freshFromCache(key, opts) {
    if (!cache || !(opts.ttlMs > 0) || opts.bypassCache) return null;
    const hit = cache.read(key);
    return hit && hit.fresh ? hit : null;
  }

  // `entry.controller` is aborted once no caller is waiting; that cancels slot and backoff waits only.
  async function run(entry, url, key, opts) {
    const signal = entry.controller.signal;
    const startedAt = now();
    let lastError = null;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt += 1) {
      emit(entry, { phase: 'waiting', attempt, maxAttempts: opts.maxAttempts });
      const queuedMs = await limiter.acquire(signal);
      // Another request may have stored this while we waited for a slot.
      const hit = freshFromCache(key, opts);
      if (hit) {
        log({ label: opts.label, outcome: 'cache-hit' });
        return { data: hit.value, source: 'cache', storedAt: hit.storedAt };
      }
      emit(entry, { phase: 'requesting', attempt, maxAttempts: opts.maxAttempts });
      const attemptStartedAt = now();
      try {
        const data = await attemptFetch(url, opts);
        if (cache && opts.ttlMs > 0) cache.write(key, data, { ttlMs: opts.ttlMs, staleTtlMs: opts.staleTtlMs });
        log({ label: opts.label, outcome: 'ok', attempt, ms: now() - attemptStartedAt, totalMs: now() - startedAt, queuedMs });
        return { data, source: 'network', storedAt: now() };
      } catch (error) {
        lastError = error;
        const ms = now() - attemptStartedAt;
        if (signal.aborted) throw abortError();
        if (!error.retryable || attempt === opts.maxAttempts) {
          log({ label: opts.label, outcome: 'failed', kind: error.kind, status: error.status, attempt, ms, totalMs: now() - startedAt });
          break;
        }
        const delayMs = backoffDelay(attempt, opts, random);
        if (error.throttled) limiter.penalize(delayMs);
        log({ label: opts.label, outcome: 'retry', kind: error.kind, status: error.status, attempt, ms, delayMs });
        emit(entry, { phase: 'retrying', attempt, nextAttempt: attempt + 1, maxAttempts: opts.maxAttempts, delayMs, error });
        await sleep(delayMs, signal);
      }
    }
    if (cache && opts.ttlMs > 0) {
      const stale = cache.read(key);
      if (stale) {
        log({ label: opts.label, outcome: 'stale-fallback', kind: lastError.kind, status: lastError.status });
        return { data: stale.value, source: 'stale', storedAt: stale.storedAt, error: lastError };
      }
    }
    throw lastError;
  }

  // Each caller gets its own promise. Once every caller has aborted (callers without a signal never do),
  // the shared request stops waiting for slots/retries and leaves the de-duplication map, so a later
  // caller for the same URL starts fresh instead of joining a cancelled request.
  function subscribe(entry, key, signal, onStatus) {
    entry.refs += 1;
    if (onStatus) entry.listeners.add(onStatus);
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = () => {
        settled = true;
        if (onStatus) entry.listeners.delete(onStatus);
        if (signal) signal.removeEventListener('abort', onAbort);
      };
      const onAbort = () => {
        if (settled) return;
        finish();
        entry.refs -= 1;
        if (entry.refs === 0) {
          entry.controller.abort();
          if (inflight.get(key) === entry) inflight.delete(key);
        }
        reject(abortError());
      };
      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }
      entry.promise.then(
        (value) => {
          if (settled) return;
          finish();
          resolve(value);
        },
        (error) => {
          if (settled) return;
          finish();
          reject(error);
        },
      );
    });
  }

  // Resolves to { data, source: 'cache' | 'network' | 'stale', storedAt, error? }.
  function getJson(url, options = {}) {
    const opts = { ...settings, ...options };
    const key = opts.cacheKey || url;
    const hit = freshFromCache(key, opts);
    if (hit) {
      log({ label: opts.label, outcome: 'cache-hit' });
      return Promise.resolve({ data: hit.value, source: 'cache', storedAt: hit.storedAt });
    }
    let entry = inflight.get(key);
    if (entry) {
      log({ label: opts.label, outcome: 'dedup' });
    } else {
      entry = { controller: new AbortController(), listeners: new Set(), refs: 0, promise: null };
      inflight.set(key, entry);
      entry.promise = run(entry, url, key, opts).finally(() => {
        if (inflight.get(key) === entry) inflight.delete(key);
      });
      // The shared promise is observed through subscribe(); this keeps an all-callers-aborted
      // rejection from surfacing as an unhandled rejection.
      entry.promise.catch(() => {});
    }
    return subscribe(entry, key, opts.signal, opts.onStatus);
  }

  // Cached value only (fresh or stale), never a network request. Used to restore pages on back/reload.
  function peek(key) {
    return cache ? cache.read(key) : null;
  }

  return { getJson, peek };
}

export function buildPostsUrl({ tags, page = 1, limit = 24 }) {
  const url = new URL('/posts.json', E621_ORIGIN);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('page', String(page));
  url.searchParams.set('tags', tags);
  url.searchParams.set('_client', CLIENT_NAME);
  return url.toString();
}

export function buildAutocompleteUrl(query) {
  const url = new URL('/tags/autocomplete.json', E621_ORIGIN);
  url.searchParams.set('search[name_matches]', query + '*');
  url.searchParams.set('_client', CLIENT_NAME);
  return url.toString();
}

export function hasPostsArray(payload) {
  return Boolean(payload) && Array.isArray(payload.posts);
}

export function sanitizeAutocompleteQuery(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_:()'-]/g, '')
    .slice(0, 64);
}

function artistsOf(post) {
  return post.tags && Array.isArray(post.tags.artist) ? post.tags.artist.filter(Boolean) : [];
}

// Photo grid post. Returns null when e621 gives no viewable image (it hides file, sample and preview
// URLs of some posts from logged-out visitors).
export function mapPhotoPost(post) {
  if (!post || !post.file) return null;
  const ext = String(post.file.ext || '').toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return null;
  const fileUrl = post.file.url || '';
  const sampleUrl = (post.sample && post.sample.has && post.sample.url) || '';
  const previewUrl = (post.preview && post.preview.url) || '';
  if (!fileUrl && !sampleUrl && !previewUrl) return null;
  const artists = artistsOf(post);
  return {
    id: post.id,
    ext,
    previewUrl,
    sampleUrl,
    fileUrl,
    width: post.file.width || 0,
    height: post.file.height || 0,
    sampleWidth: (sampleUrl && post.sample.width) || 0,
    sourceUrl: E621_ORIGIN + '/posts/' + post.id,
    artistText: artists.length ? artists.join(', ') : 'Unknown artist',
  };
}

export function mapReelPost(post) {
  if (!post || !post.file || !post.file.url) return null;
  const ext = String(post.file.ext || '').toLowerCase();
  if (!REEL_EXTS.has(ext)) return null;
  const artist = artistsOf(post);
  const species = post.tags && Array.isArray(post.tags.species) ? post.tags.species.filter(Boolean) : [];
  const general = post.tags && Array.isArray(post.tags.general) ? post.tags.general.filter(Boolean).slice(0, 12) : [];
  return {
    id: post.id,
    ext,
    type: ext === 'webm' || ext === 'mp4' ? 'video' : 'image',
    score: (post.score && post.score.total) || 0,
    rating: post.rating || 'u',
    width: post.file.width || (post.sample && post.sample.width) || 0,
    height: post.file.height || (post.sample && post.sample.height) || 0,
    createdAt: post.created_at,
    mediaUrl: post.file.url,
    previewUrl: (post.preview && post.preview.url) || (post.sample && post.sample.url) || post.file.url,
    sourceUrl: E621_ORIGIN + '/posts/' + post.id,
    description: [
      artist.length ? 'Artist: ' + artist.join(', ') : 'Artist unknown',
      species.length ? 'Species: ' + species.slice(0, 3).join(', ') : null,
    ].filter(Boolean).join(' • '),
    tags: artist.map((tag) => 'artist:' + tag).concat(general),
  };
}

export function mapAutocompleteTags(payload, limit = AUTOCOMPLETE_LIMIT) {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((tag) => tag && typeof tag.name === 'string')
    .slice(0, limit)
    .map((tag) => ({
      id: tag.id || null,
      name: tag.name,
      category: Number.isFinite(tag.category) ? tag.category : null,
      postCount: Number.isFinite(tag.post_count) ? tag.post_count : 0,
      antecedentName: tag.antecedent_name || null,
    }));
}

export const POSTS_TTL_MS = 10 * 60 * 1000;
export const POSTS_STALE_TTL_MS = 60 * 60 * 1000;

// One page of posts, mapped for the given view. `rawCount` is the number of posts e621 returned before
// filtering, which tells the caller whether more pages exist.
export function fetchPostsPage(client, { view, tags, page, limit, signal, onStatus, bypassCache = false }) {
  const mapPost = view === 'photos' ? mapPhotoPost : mapReelPost;
  const url = buildPostsUrl({ tags, page, limit });
  return client.getJson(url, {
    label: view + ':page-' + page,
    cacheKey: view + '|' + url,
    ttlMs: POSTS_TTL_MS,
    staleTtlMs: POSTS_STALE_TTL_MS,
    validate: hasPostsArray,
    transform: (payload) => ({ rawCount: payload.posts.length, posts: payload.posts.map(mapPost).filter(Boolean) }),
    signal,
    onStatus,
    bypassCache,
  });
}

export function peekPostsPage(client, { view, tags, page, limit }) {
  return client.peek(view + '|' + buildPostsUrl({ tags, page, limit }));
}

export async function fetchTagSuggestions(client, rawQuery, { signal } = {}) {
  const query = sanitizeAutocompleteQuery(rawQuery);
  if (query.length < AUTOCOMPLETE_MIN_LENGTH) return [];
  const { data } = await client.getJson(buildAutocompleteUrl(query), {
    label: 'autocomplete',
    ttlMs: 60 * 60 * 1000,
    timeoutMs: 5000,
    maxAttempts: 2,
    validate: (payload) => Array.isArray(payload) || (Boolean(payload) && typeof payload === 'object'),
    transform: (payload) => mapAutocompleteTags(payload),
    signal,
  });
  return data;
}

// Human-readable reason for status lines. Never includes URLs or tags.
export function describeApiError(error) {
  if (!error) return 'e621 could not be reached';
  if (error.kind === 'timeout') return 'e621 did not respond in time';
  if (error.kind === 'bad_json') return 'e621 sent an unreadable response';
  if (error.kind === 'network') return 'e621 could not be reached (it may be rate limiting this connection)';
  if (error.status === 429 || error.status === 503) return 'e621 is busy (HTTP ' + error.status + ')';
  if (error.status) return 'e621 returned HTTP ' + error.status;
  return 'e621 could not be reached';
}

function safeStorage(getter) {
  try {
    const storage = getter();
    const probe = '__fr_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function webLock(navigatorRef) {
  if (!navigatorRef || !navigatorRef.locks || typeof navigatorRef.locks.request !== 'function') return null;
  return async (fn, signal) => {
    try {
      return await navigatorRef.locks.request(LOCK_NAME, signal ? { signal } : {}, fn);
    } catch (error) {
      if (error && error.name === 'AbortError') throw abortError();
      throw error;
    }
  };
}

let browserClient = null;

// Page-wide singleton wired to the real browser environment.
export function getBrowserClient(win = globalThis) {
  if (browserClient) return browserClient;
  const local = safeStorage(() => win.localStorage);
  const session = safeStorage(() => win.sessionStorage);
  let debug = false;
  try {
    debug = Boolean(local) && local.getItem('fr_debug') === '1';
  } catch {
    debug = false;
  }
  const consoleRef = win.console;
  const log = createRequestLog({
    sink: (entry) => {
      if (debug) consoleRef.debug('[e621]', entry);
      else if (entry.outcome === 'failed') consoleRef.warn('[e621] request failed', { label: entry.label, kind: entry.kind, status: entry.status, attempts: entry.attempt });
      else if (entry.outcome === 'ok' && entry.totalMs > 5000) consoleRef.warn('[e621] slow response', { label: entry.label, totalMs: entry.totalMs, attempts: entry.attempt });
    },
  });
  const limiter = createRateLimiter({
    sharedStore: local ? {
      read: () => {
        try {
          return local.getItem(SLOT_STORAGE_KEY);
        } catch {
          return 0;
        }
      },
      write: (value) => {
        try {
          local.setItem(SLOT_STORAGE_KEY, String(value));
        } catch {
          // Cross-tab spacing degrades to per-tab spacing.
        }
      },
    } : null,
    lock: webLock(win.navigator),
  });
  const cache = createResponseCache({ storage: session });
  const client = createApiClient({ fetchImpl: win.fetch.bind(win), limiter, cache, logger: log });
  browserClient = { ...client, log };
  // Diagnostics from DevTools: frApiStats() for a summary, frApiLog() for recent request outcomes.
  win.frApiStats = () => log.summary();
  win.frApiLog = () => log.entries();
  return browserClient;
}
