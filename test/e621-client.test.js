import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError,
  backoffDelay,
  createRateLimiter,
  createResponseCache,
  fetchTagSuggestions,
  mapPhotoPost,
  mapReelPost,
  buildPostsUrl,
} from '../src/client/e621-client.js';
import { jsonResponse, memoryStorage, scriptedClient, e621Post } from './helpers.js';

function virtualClock() {
  const clock = { t: 0 };
  return { clock, now: () => clock.t, sleep: async (ms) => { clock.t += ms; } };
}

test('rate limiter spaces request starts at least intervalMs apart', async () => {
  const { clock, now, sleep } = virtualClock();
  const limiter = createRateLimiter({ intervalMs: 1000, now, sleep });
  const starts = [];
  await Promise.all([1, 2, 3, 4].map(() => limiter.acquire().then(() => starts.push(clock.t))));
  assert.deepEqual(starts, [0, 1000, 2000, 3000]);
});

test('rate limiter shares spacing across tabs through the shared store', async () => {
  const { clock, now, sleep } = virtualClock();
  let stored = 0;
  const starts = [];
  const sharedStore = {
    read: () => stored,
    write: (value) => {
      stored = value;
      starts.push(clock.t);
    },
  };
  let lockChain = Promise.resolve();
  const lock = (fn) => {
    const run = lockChain.then(fn);
    lockChain = run.catch(() => {});
    return run;
  };
  const tabA = createRateLimiter({ intervalMs: 1000, now, sleep, sharedStore, lock });
  const tabB = createRateLimiter({ intervalMs: 1000, now, sleep, sharedStore, lock });
  await Promise.all([tabA, tabB, tabA, tabB].map((tab) => tab.acquire()));
  assert.deepEqual(starts, [0, 1000, 2000, 3000]);
});

test('penalize pushes the next slot back for every caller', async () => {
  const { clock, now, sleep } = virtualClock();
  const limiter = createRateLimiter({ intervalMs: 1000, now, sleep });
  await limiter.acquire();
  limiter.penalize(5000);
  await limiter.acquire();
  assert.equal(clock.t, 5000);
});

test('an aborted wait does not block later callers', async () => {
  const limiter = createRateLimiter({ intervalMs: 0 });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(limiter.acquire(controller.signal), (error) => error.kind === 'aborted');
  assert.equal(await limiter.acquire(), 0);
});

test('backoff grows exponentially with jitter and a cap', () => {
  const opts = { backoffBaseMs: 1000, backoffMaxMs: 8000 };
  assert.equal(backoffDelay(1, opts, () => 1), 1000);
  assert.equal(backoffDelay(2, opts, () => 1), 2000);
  assert.equal(backoffDelay(3, opts, () => 0), 2000);
  assert.equal(backoffDelay(10, opts, () => 1), 8000);
});

test('identical concurrent requests share one fetch', async () => {
  const { client, calls } = scriptedClient({ responses: [jsonResponse({ posts: [] })] });
  const [a, b] = await Promise.all([client.getJson('https://e621.net/x'), client.getJson('https://e621.net/x')]);
  assert.equal(calls.length, 1);
  assert.deepEqual(a.data, b.data);
});

test('fresh cache entries are served without a request, expired ones are refetched', async () => {
  const { client, calls, clock } = scriptedClient({
    ttlMs: 60_000,
    responses: [jsonResponse({ n: 1 }), jsonResponse({ n: 2 })],
  });
  assert.equal((await client.getJson('https://e621.net/x')).source, 'network');
  const cached = await client.getJson('https://e621.net/x');
  assert.equal(cached.source, 'cache');
  assert.deepEqual(cached.data, { n: 1 });
  clock.t += 61_000;
  assert.deepEqual((await client.getJson('https://e621.net/x')).data, { n: 2 });
  assert.equal(calls.length, 2);
});

test('503 responses are retried with growing backoff and slow down the shared limiter', async () => {
  const { client, calls, sleeps, penalties } = scriptedClient({
    responses: [jsonResponse('busy', 503), jsonResponse('busy', 503), jsonResponse({ ok: true })],
  });
  const statuses = [];
  const result = await client.getJson('https://e621.net/x', { onStatus: (s) => statuses.push(s.phase + s.attempt) });
  assert.deepEqual(result.data, { ok: true });
  assert.equal(calls.length, 3);
  assert.deepEqual(sleeps, [1000, 2000]);
  assert.deepEqual(penalties, [1000, 2000]);
  assert.ok(statuses.includes('retrying1') && statuses.includes('requesting3'));
});

test('gives up after maxAttempts and reports the last error', async () => {
  const { client, calls } = scriptedClient({
    responses: [jsonResponse('busy', 503), jsonResponse('busy', 503), jsonResponse('busy', 503)],
  });
  await assert.rejects(client.getJson('https://e621.net/x'), (error) => error instanceof ApiError && error.status === 503);
  assert.equal(calls.length, 3);
});

test('client errors other than 429 are not retried', async () => {
  const { client, calls } = scriptedClient({ responses: [jsonResponse({ error: 'bad request' }, 400)] });
  await assert.rejects(client.getJson('https://e621.net/x'), (error) => error.status === 400 && !error.retryable);
  assert.equal(calls.length, 1);
});

test('invalid JSON and wrong shapes are retried', async () => {
  const { client, calls } = scriptedClient({
    responses: [jsonResponse('<html>challenge</html>'), jsonResponse({ nope: 1 }), jsonResponse({ posts: [] })],
  });
  const result = await client.getJson('https://e621.net/x', { validate: (p) => Array.isArray(p.posts) });
  assert.deepEqual(result.data, { posts: [] });
  assert.equal(calls.length, 3);
});

test('a request that never answers times out instead of hanging', async () => {
  const hang = (url, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  });
  const { client, calls } = scriptedClient({ responses: [hang, hang], defaults: { timeoutMs: 20, maxAttempts: 2 } });
  await assert.rejects(client.getJson('https://e621.net/x'), (error) => error.kind === 'timeout');
  assert.equal(calls.length, 2);
});

test('falls back to stale cached data when e621 keeps failing', async () => {
  const { client, clock } = scriptedClient({
    defaults: { ttlMs: 1000, staleTtlMs: 60_000, maxAttempts: 1 },
    responses: [jsonResponse({ n: 1 }), jsonResponse('busy', 503)],
  });
  await client.getJson('https://e621.net/x');
  clock.t += 5000;
  const result = await client.getJson('https://e621.net/x');
  assert.equal(result.source, 'stale');
  assert.deepEqual(result.data, { n: 1 });
  assert.equal(result.error.status, 503);
});

test('one caller aborting does not cancel the request for other callers', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { client, calls } = scriptedClient({ responses: [async () => { await gate; return jsonResponse({ ok: 1 }); }] });
  const controller = new AbortController();
  const aborted = client.getJson('https://e621.net/x', { signal: controller.signal });
  const kept = client.getJson('https://e621.net/x');
  controller.abort();
  release();
  await assert.rejects(aborted, (error) => error.kind === 'aborted');
  assert.deepEqual((await kept).data, { ok: 1 });
  assert.equal(calls.length, 1);
});

test('a request already sent still completes and is cached after its only caller aborts', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { client, calls } = scriptedClient({ ttlMs: 60_000, responses: [async () => { await gate; return jsonResponse({ ok: 1 }); }] });
  const controller = new AbortController();
  const pending = client.getJson('https://e621.net/x', { signal: controller.signal });
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(calls.length, 1);
  controller.abort();
  await assert.rejects(pending, (error) => error.kind === 'aborted');
  release();
  await new Promise((resolve) => setTimeout(resolve, 5));
  const later = await client.getJson('https://e621.net/x');
  assert.equal(later.source, 'cache');
  assert.equal(calls.length, 1);
});

test('queued requests whose callers all abort are never sent', async () => {
  const { client, calls } = scriptedClient({ responses: [] });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(client.getJson('https://e621.net/x', { signal: controller.signal }), (error) => error.kind === 'aborted');
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(calls.length, 0);
});

test('session storage cache survives a reload and evicts the oldest entries', () => {
  const storage = memoryStorage();
  let t = 0;
  const first = createResponseCache({ storage, maxEntries: 2, now: () => t });
  first.write('a', 1, { ttlMs: 100 });
  t = 1;
  first.write('b', 2, { ttlMs: 100 });
  t = 2;
  first.write('c', 3, { ttlMs: 100 });
  const afterReload = createResponseCache({ storage, maxEntries: 2, now: () => t });
  assert.equal(afterReload.read('a'), null);
  assert.equal(afterReload.read('c').value, 3);
  assert.equal(storage.map.size, 2);
});

test('cache keeps working in memory when storage throws', () => {
  const storage = { length: 0, key: () => null, getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  const cache = createResponseCache({ storage, now: () => 0 });
  cache.write('a', 1, { ttlMs: 10 });
  assert.equal(cache.read('a').value, 1);
});

test('autocomplete never requests queries e621 rejects as too short, and caches results', async () => {
  const { client, calls } = scriptedClient({ responses: [jsonResponse([{ id: 1, name: 'fox', post_count: 5, category: 5 }])] });
  assert.deepEqual(await fetchTagSuggestions(client, 'fo'), []);
  assert.equal(calls.length, 0);
  const tags = await fetchTagSuggestions(client, 'fox');
  assert.equal(tags[0].name, 'fox');
  await fetchTagSuggestions(client, 'FOX ');
  assert.equal(calls.length, 1);
  assert.match(calls[0], /_client=/);
});

test('photo posts pick sample/preview/file and skip posts e621 hides', () => {
  const post = mapPhotoPost(e621Post(1));
  assert.equal(post.sampleWidth, 850);
  assert.match(post.previewUrl, /preview/);
  const noSample = mapPhotoPost(e621Post(2, { sample: { has: false, url: null, width: 2000 } }));
  assert.equal(noSample.sampleUrl, '');
  const hidden = e621Post(3, { file: { ext: 'png', url: null }, preview: { url: null }, sample: { has: true, url: null } });
  assert.equal(mapPhotoPost(hidden), null);
  assert.equal(mapPhotoPost(e621Post(4, { file: { ext: 'webm', url: 'x' } })), null);
});

test('reel posts keep videos and gifs with a file URL', () => {
  assert.equal(mapReelPost(e621Post(1, { file: { ext: 'webm', url: 'https://static1.e621.net/a.webm' } })).type, 'video');
  assert.equal(mapReelPost(e621Post(2, { file: { ext: 'gif', url: 'https://static1.e621.net/a.gif' } })).type, 'image');
  assert.equal(mapReelPost(e621Post(3)), null);
});

test('posts URLs identify the client to e621', () => {
  const url = new URL(buildPostsUrl({ tags: 'order:rank -animated', page: 2, limit: 60 }));
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('limit'), '60');
  assert.ok(url.searchParams.get('_client'));
});
