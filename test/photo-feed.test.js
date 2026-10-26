import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoFeed, photoTagsFromSettings } from '../src/client/photo-feed.js';
import { jsonResponse, scriptedClient, e621Post } from './helpers.js';

const PAGE = 4;

function page(startId, count = PAGE, overrides = {}) {
  return jsonResponse({ posts: Array.from({ length: count }, (_, i) => e621Post(startId + i, overrides)) });
}

test('only one page request is in flight at a time', async () => {
  const { client, calls } = scriptedClient({ responses: [page(1)] });
  const feed = createPhotoFeed({ client, tags: 't', pageSize: PAGE });
  const [a, b] = await Promise.all([feed.loadNextPage(), feed.loadNextPage()]);
  assert.equal(a, PAGE);
  assert.equal(b, PAGE);
  assert.equal(calls.length, 1);
  assert.equal(feed.queue.length, PAGE);
});

test('an empty result ends the feed instead of paging forever', async () => {
  const { client, calls } = scriptedClient({ responses: [jsonResponse({ posts: [] })] });
  const feed = createPhotoFeed({ client, tags: 'no_such_tag', pageSize: PAGE });
  assert.equal(await feed.loadNextPage(), 0);
  assert.equal(feed.state.phase, 'done');
  assert.equal(feed.state.endReason, 'end');
  assert.equal(await feed.loadNextPage(), 0);
  assert.equal(calls.length, 1);
});

test('a short page is treated as the last page', async () => {
  const { client } = scriptedClient({ responses: [page(1, 2)] });
  const feed = createPhotoFeed({ client, tags: 't', pageSize: PAGE });
  await feed.loadNextPage();
  assert.equal(feed.state.phase, 'done');
  assert.equal(feed.queue.length, 2);
});

test('stops after a bounded number of full pages without any images', async () => {
  const videos = { file: { ext: 'webm', url: 'https://static1.e621.net/v.webm' } };
  const { client, calls } = scriptedClient({ responses: [page(1, PAGE, videos), page(10, PAGE, videos), page(20, PAGE, videos), page(30)] });
  const feed = createPhotoFeed({ client, tags: 't', pageSize: PAGE, maxEmptyPages: 3 });
  while (feed.canLoad) await feed.loadNextPage();
  assert.equal(calls.length, 3);
  assert.equal(feed.state.endReason, 'sparse');
});

test('a failure stops loading until the user retries', async () => {
  const { client, calls } = scriptedClient({
    defaults: { maxAttempts: 1 },
    responses: [jsonResponse('busy', 503), page(1)],
  });
  const feed = createPhotoFeed({ client, tags: 't', pageSize: PAGE });
  assert.equal(await feed.loadNextPage(), null);
  assert.equal(feed.state.phase, 'error');
  assert.equal(feed.state.error.status, 503);
  assert.equal(feed.canLoad, false);
  assert.equal(await feed.loadNextPage(), null);
  assert.equal(calls.length, 1);
  feed.clearError();
  assert.equal(await feed.loadNextPage(), PAGE);
  assert.equal(feed.state.phase, 'idle');
});

test('page 750 limit response ends the feed', async () => {
  const { client } = scriptedClient({ responses: [jsonResponse({ success: false }, 410)] });
  const feed = createPhotoFeed({ client, tags: 't', pageSize: PAGE });
  assert.equal(await feed.loadNextPage(), 0);
  assert.equal(feed.state.endReason, 'limit');
});

test('posts repeated on a later page are not shown twice', async () => {
  const { client } = scriptedClient({ responses: [page(1), page(3)] });
  const feed = createPhotoFeed({ client, tags: 't', pageSize: PAGE });
  await feed.loadNextPage();
  assert.equal(await feed.loadNextPage(), 2);
  assert.deepEqual(feed.take(Infinity).map((post) => post.id), [1, 2, 3, 4, 5, 6]);
});

test('reports a slow request while still waiting', async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const { client } = scriptedClient({ responses: [async () => { await gate; return page(1); }] });
  const seenSlow = [];
  const feed = createPhotoFeed({ client, tags: 't', pageSize: PAGE, slowAfterMs: 5, onChange: (s) => seenSlow.push(s.slow) });
  const pending = feed.loadNextPage();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(feed.state.slow, true);
  release();
  await pending;
  assert.equal(feed.state.slow, false);
  assert.ok(seenSlow.includes(true));
});

test('restores previously loaded pages from cache without any request', async () => {
  const { client, calls } = scriptedClient({ ttlMs: 60_000, responses: [page(1), page(5)] });
  const first = createPhotoFeed({ client, tags: 't', pageSize: PAGE });
  await first.loadNextPage();
  await first.loadNextPage();
  const afterBack = createPhotoFeed({ client, tags: 't', pageSize: PAGE });
  assert.equal(afterBack.restore(first.pagesLoaded), 2);
  assert.equal(afterBack.queue.length, 8);
  assert.equal(afterBack.state.nextPage, 3);
  assert.equal(calls.length, 2);
});

test('photo tags match the shared settings', () => {
  assert.equal(photoTagsFromSettings({ sort: 'score', tags: ' fox  wolf ', rating: 's', ratio: 'vertical' }), 'order:score -animated fox wolf rating:s ratio:<1');
  assert.equal(photoTagsFromSettings({}), 'order:rank -animated');
});
