// Safe, local-only saved posts store for FurryReel.
//
// Uses browser localStorage (never HTTP cookies) so saved posts are never sent to the Worker
// on HTTP requests and are not constrained by the 4 KB cookie limit. Every read/write validates
// fields and restricts media/source URLs to allowlisted e621/e926 HTTPS hosts.

export const SAVED_STORAGE_KEY = 'fr_saved_v1';
export const MAX_SAVED_ITEMS = 300;

const ALLOWED_MEDIA_HOSTS = new Set([
  'e621.net',
  'static1.e621.net',
  'static.e621.net',
  'static1.e926.net',
]);

const ALLOWED_EXTS = new Set(['webm', 'mp4', 'gif', 'jpg', 'jpeg', 'png', 'webp']);
const ALLOWED_RATINGS = new Set(['s', 'q', 'e', 'u']);

export function sanitizeMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'https:') return '';
    if (!ALLOWED_MEDIA_HOSTS.has(parsed.hostname)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function safeInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : fallback;
}

function safeNullableInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

function safeText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function safeTags(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const tag of raw) {
    if (typeof tag !== 'string') continue;
    const clean = tag.trim().slice(0, 64);
    if (!clean || /\s/.test(clean) || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= 12) break;
  }
  return out;
}

export function sanitizeSavedItem(raw, fallbackKind = 'reel', now = Date.now) {
  if (!raw || typeof raw !== 'object') return null;
  const id = Number(raw.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const rawExt = String(raw.ext || '').toLowerCase();
  const ext = ALLOWED_EXTS.has(rawExt) ? rawExt : '';
  const isVideo = raw.type === 'video' || ext === 'webm' || ext === 'mp4';
  const kind = raw.kind === 'photo' || raw.kind === 'reel'
    ? raw.kind
    : (fallbackKind === 'photo' ? 'photo' : (isVideo || ext === 'gif' ? 'reel' : 'photo'));
  const type = isVideo ? 'video' : 'image';

  const mediaUrl = sanitizeMediaUrl(raw.mediaUrl || raw.fileUrl);
  const sampleUrl = sanitizeMediaUrl(raw.sampleUrl);
  const previewUrl = sanitizeMediaUrl(raw.previewUrl) || sampleUrl || mediaUrl;
  const sourceUrl = sanitizeMediaUrl(raw.sourceUrl) || `https://e621.net/posts/${id}`;

  if (!previewUrl && !mediaUrl && !sampleUrl) return null;

  const rawRating = String(raw.rating || 'u').toLowerCase();
  const rating = ALLOWED_RATINGS.has(rawRating) ? rawRating : 'u';

  return {
    id,
    kind,
    type,
    ext,
    previewUrl,
    sampleUrl,
    mediaUrl: mediaUrl || sampleUrl || previewUrl,
    sourceUrl,
    width: safeInt(raw.width),
    height: safeInt(raw.height),
    score: safeNullableInt(raw.score),
    favCount: safeNullableInt(raw.favCount),
    commentCount: safeNullableInt(raw.commentCount),
    rating,
    artistText: safeText(raw.artistText, 120),
    caption: safeText(raw.caption || raw.description, 240),
    tags: safeTags(raw.tags || raw.postTags),
    savedAt: safeInt(raw.savedAt, now()),
  };
}

export function createSavedStore({
  storage = null,
  key = SAVED_STORAGE_KEY,
  maxItems = MAX_SAVED_ITEMS,
  now = () => Date.now(),
  win = null,
} = {}) {
  const listeners = new Set();
  let memoryItems = [];
  let storageAvailable = Boolean(storage);

  function readFromStorage() {
    if (!storage) return memoryItems.slice();
    try {
      const raw = storage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
      const seen = new Set();
      const valid = [];
      for (const entry of list) {
        const clean = sanitizeSavedItem(entry, entry?.kind, now);
        if (!clean || seen.has(clean.id)) continue;
        seen.add(clean.id);
        valid.push(clean);
        if (valid.length >= maxItems) break;
      }
      memoryItems = valid;
      storageAvailable = true;
      return valid.slice();
    } catch {
      storageAvailable = false;
      return memoryItems.slice();
    }
  }

  function writeToStorage(items) {
    const trimmed = items.slice(0, maxItems);
    memoryItems = trimmed.slice();
    let persisted = false;
    if (storage) {
      try {
        storage.setItem(key, JSON.stringify({ version: 1, items: trimmed }));
        persisted = true;
        storageAvailable = true;
      } catch {
        storageAvailable = false;
      }
    }
    notify(trimmed);
    return { persisted, count: trimmed.length };
  }

  function notify(items) {
    const snapshot = items.slice();
    for (const fn of listeners) {
      try {
        fn(snapshot);
      } catch {
        // Ignore listener errors so one consumer cannot break others.
      }
    }
  }

  if (win && typeof win.addEventListener === 'function') {
    win.addEventListener('storage', (event) => {
      if (event.key === key || event.key === null) {
        notify(readFromStorage());
      }
    });
  }

  function list(kind = '') {
    const all = readFromStorage();
    if (kind === 'reel' || kind === 'photo') {
      return all.filter((item) => item.kind === kind);
    }
    return all;
  }

  function count(kind = '') {
    return list(kind).length;
  }

  function has(id) {
    const num = Number(id);
    if (!Number.isSafeInteger(num) || num <= 0) return false;
    return readFromStorage().some((item) => item.id === num);
  }

  function save(post, kind = 'reel') {
    const clean = sanitizeSavedItem({ ...post, kind, savedAt: now() }, kind, now);
    if (!clean) return { saved: false, persisted: false, reason: 'invalid' };
    const current = readFromStorage().filter((item) => item.id !== clean.id);
    current.unshift(clean);
    const { persisted, count: nextCount } = writeToStorage(current);
    return { saved: true, item: clean, persisted, count: nextCount };
  }

  function remove(id) {
    const num = Number(id);
    const current = readFromStorage();
    const next = current.filter((item) => item.id !== num);
    if (next.length === current.length) {
      return { removed: false, persisted: storageAvailable, count: current.length };
    }
    const { persisted, count: nextCount } = writeToStorage(next);
    return { removed: true, persisted, count: nextCount };
  }

  function toggle(post, kind = 'reel') {
    const id = Number(post?.id);
    if (has(id)) {
      const res = remove(id);
      return { saved: false, persisted: res.persisted, count: res.count };
    }
    return save(post, kind);
  }

  function clear() {
    const { persisted } = writeToStorage([]);
    return { cleared: true, persisted, count: 0 };
  }

  function exportJson() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date(now()).toISOString(),
      items: readFromStorage(),
    }, null, 2);
  }

  function importJson(rawText) {
    let parsed;
    try {
      parsed = JSON.parse(String(rawText || ''));
    } catch {
      return { ok: false, added: 0, skipped: 0, error: 'Invalid JSON file.' };
    }
    const incoming = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : null);
    if (!incoming) {
      return { ok: false, added: 0, skipped: 0, error: 'File does not contain a saved items list.' };
    }
    const existing = readFromStorage();
    const byId = new Map(existing.map((item) => [item.id, item]));
    let added = 0;
    let skipped = 0;
    for (const raw of incoming) {
      const clean = sanitizeSavedItem(raw, raw?.kind, now);
      if (!clean) {
        skipped += 1;
        continue;
      }
      if (!byId.has(clean.id)) {
        added += 1;
      }
      byId.set(clean.id, clean);
    }
    const merged = [...byId.values()].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    const { persisted, count: nextCount } = writeToStorage(merged);
    return { ok: true, added, skipped, persisted, count: nextCount };
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    list,
    count,
    has,
    save,
    remove,
    toggle,
    clear,
    exportJson,
    importJson,
    subscribe,
  };
}

let browserSavedStore = null;

function probeLocalStorage(win) {
  try {
    const s = win.localStorage;
    const probe = '__fr_saved_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function getSavedStore(win = globalThis) {
  if (browserSavedStore) return browserSavedStore;
  browserSavedStore = createSavedStore({
    storage: probeLocalStorage(win),
    win,
  });
  return browserSavedStore;
}
