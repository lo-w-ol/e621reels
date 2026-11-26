import test from 'node:test';
import assert from 'node:assert/strict';
import { createSavedStore, sanitizeSavedItem, sanitizeMediaUrl } from '../src/client/saved-posts.js';
import { memoryStorage } from './helpers.js';

function sampleReel(id = 101) {
  return {
    id,
    ext: 'webm',
    type: 'video',
    mediaUrl: `https://static1.e621.net/data/reel-${id}.webm`,
    previewUrl: `https://static1.e621.net/data/preview/reel-${id}.jpg`,
    sourceUrl: `https://e621.net/posts/${id}`,
    width: 720,
    height: 1280,
    score: 1420,
    favCount: 840,
    commentCount: 19,
    rating: 's',
    artistText: 'felkintoby',
    caption: 'Twilight Pond Commission',
    postTags: ['wolf', 'fantasy', 'loop'],
  };
}

function samplePhoto(id = 202) {
  return {
    id,
    ext: 'jpg',
    fileUrl: `https://static1.e621.net/data/photo-${id}.jpg`,
    sampleUrl: `https://static1.e621.net/data/sample/photo-${id}.jpg`,
    previewUrl: `https://static1.e621.net/data/preview/photo-${id}.jpg`,
    sourceUrl: `https://e621.net/posts/${id}`,
    width: 1200,
    height: 1600,
    score: 512,
    rating: 's',
    artistText: 'vaccino',
    postTags: ['fox', 'forest'],
  };
}

test('sanitizeMediaUrl allows only HTTPS e621/e926 hosts', () => {
  assert.equal(sanitizeMediaUrl('https://static1.e621.net/data/a.webm'), 'https://static1.e621.net/data/a.webm');
  assert.equal(sanitizeMediaUrl('https://e621.net/posts/123'), 'https://e621.net/posts/123');
  assert.equal(sanitizeMediaUrl('http://static1.e621.net/data/a.webm'), '');
  assert.equal(sanitizeMediaUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeMediaUrl('https://evil.example/a.webm'), '');
  assert.equal(sanitizeMediaUrl('data:image/png;base64,AAA'), '');
});

test('sanitizeSavedItem strips untrusted URLs and rejects invalid records', () => {
  assert.equal(sanitizeSavedItem(null), null);
  assert.equal(sanitizeSavedItem({ id: -5, previewUrl: 'https://static1.e621.net/a.jpg' }), null);
  assert.equal(sanitizeSavedItem({ id: 5, previewUrl: 'https://evil.example/a.jpg' }), null);

  const clean = sanitizeSavedItem({
    id: 42,
    ext: 'webm',
    mediaUrl: 'https://static1.e621.net/data/42.webm',
    sourceUrl: 'javascript:alert(1)',
    artistText: '  artist_one  ',
    tags: ['wolf', 'bad tag', 'wolf', 'fantasy'],
  }, 'reel', () => 1000);

  assert.equal(clean.id, 42);
  assert.equal(clean.kind, 'reel');
  assert.equal(clean.type, 'video');
  assert.equal(clean.sourceUrl, 'https://e621.net/posts/42');
  assert.equal(clean.artistText, 'artist_one');
  assert.deepEqual(clean.tags, ['wolf', 'fantasy']);
});

test('saved store toggles, filters by kind, persists, and caps items', () => {
  const storage = memoryStorage();
  let t = 1000;
  const store = createSavedStore({ storage, maxItems: 3, now: () => (t += 10) });

  assert.equal(store.count(), 0);
  const first = store.toggle(sampleReel(1), 'reel');
  assert.equal(first.saved, true);
  assert.equal(first.persisted, true);
  assert.equal(store.has(1), true);

  store.save(samplePhoto(2), 'photo');
  store.save(sampleReel(3), 'reel');
  store.save(samplePhoto(4), 'photo');

  // Capped at maxItems (3), newest first so id 1 is evicted.
  assert.deepEqual(store.list().map((item) => item.id), [4, 3, 2]);
  assert.deepEqual(store.list('reel').map((item) => item.id), [3]);
  assert.deepEqual(store.list('photo').map((item) => item.id), [4, 2]);

  // Toggle removes an already-saved item.
  const removed = store.toggle(sampleReel(3), 'reel');
  assert.equal(removed.saved, false);
  assert.equal(store.has(3), false);

  // Re-reading from a fresh store instance sees persisted data.
  const store2 = createSavedStore({ storage });
  assert.deepEqual(store2.list().map((item) => item.id), [4, 2]);
});

test('saved store exportJson and importJson merge safely and skip untrusted entries', () => {
  const storage = memoryStorage();
  const store = createSavedStore({ storage });
  store.save(sampleReel(10), 'reel');

  const exported = store.exportJson();
  const other = createSavedStore({ storage: memoryStorage() });
  other.save(samplePhoto(20), 'photo');

  const res = other.importJson(exported);
  assert.equal(res.ok, true);
  assert.equal(res.added, 1);
  assert.equal(other.has(10), true);
  assert.equal(other.has(20), true);

  const badImport = other.importJson(JSON.stringify({
    items: [
      { id: 99, mediaUrl: 'https://evil.example/x.mp4' },
      sampleReel(30),
    ],
  }));
  assert.equal(badImport.ok, true);
  assert.equal(badImport.added, 1);
  assert.equal(badImport.skipped, 1);
  assert.equal(other.has(99), false);
  assert.equal(other.has(30), true);
});

test('saved store falls back to memory when storage throws', () => {
  const brokenStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  const store = createSavedStore({ storage: brokenStorage });
  const res = store.save(sampleReel(55), 'reel');
  assert.equal(res.saved, true);
  assert.equal(res.persisted, false);
  assert.equal(store.has(55), true);
});
