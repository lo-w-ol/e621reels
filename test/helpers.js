import { createApiClient, createRateLimiter, createResponseCache, createRequestLog } from '../src/client/e621-client.js';

export function jsonResponse(body, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Storage-like object backed by a Map, matching the Web Storage methods the client uses.
export function memoryStorage() {
  const map = new Map();
  return {
    get length() {
      return map.size;
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    map,
  };
}

// Client with a controllable clock, instant backoff sleeps and a scripted fetch.
// `responses` items are Response objects or functions (url, init) => Response | Promise.
export function scriptedClient({ responses = [], intervalMs = 0, ttlMs, storage = null, defaults = {} } = {}) {
  const clock = { t: 1_000_000 };
  const calls = [];
  const sleeps = [];
  const penalties = [];
  const fetchImpl = async (url, init) => {
    calls.push(url);
    if (!responses.length) throw new Error('unexpected fetch ' + url);
    const next = responses.shift();
    return typeof next === 'function' ? next(url, init) : next;
  };
  const now = () => clock.t;
  const limiter = createRateLimiter({ intervalMs, now, sleep: async (ms) => { clock.t += ms; } });
  const penalize = limiter.penalize;
  limiter.penalize = (ms) => {
    penalties.push(ms);
    penalize(ms);
  };
  const cache = createResponseCache({ storage, now });
  const log = createRequestLog({ now });
  const client = createApiClient({
    fetchImpl,
    limiter,
    cache,
    logger: log,
    now,
    sleep: async (ms) => {
      sleeps.push(ms);
      clock.t += ms;
    },
    random: () => 1,
    defaults: { ...(ttlMs ? { ttlMs } : {}), ...defaults },
  });
  return { client, calls, sleeps, penalties, clock, log, cache, responses };
}

export function e621Post(id, overrides = {}) {
  return {
    id,
    file: { ext: 'jpg', width: 2000, height: 3000, url: `https://static1.e621.net/data/${id}.jpg` },
    preview: { width: 256, height: 384, url: `https://static1.e621.net/data/preview/${id}.jpg` },
    sample: { has: true, width: 850, height: 1275, url: `https://static1.e621.net/data/sample/${id}.jpg` },
    tags: { artist: ['someone'] },
    ...overrides,
  };
}
