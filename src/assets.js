// Serves the browser modules in src/client/ (imported as text via the "Text" rule in wrangler.jsonc).
// URLs carry a content hash, so browsers can cache them forever and a deploy picks up new code at once.
import e621ClientSource from './client/e621-client.js';
import photoFeedSource from './client/photo-feed.js';

const CLIENT_FILES = {
  'e621-client.js': e621ClientSource,
  'photo-feed.js': photoFeedSource,
};

// FNV-1a; only needs to change whenever any client file changes.
function hashText(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

const CLIENT_VERSION = hashText(Object.values(CLIENT_FILES).join('\n'));

// Files share one versioned directory so their relative imports resolve to the same version.
export function clientAssetUrl(name) {
  return '/assets/' + CLIENT_VERSION + '/' + name;
}

export function serveClientAsset(url) {
  const match = /^\/assets\/([a-z0-9]+)\/([a-z0-9-]+\.js)$/.exec(url.pathname);
  if (!match || !Object.hasOwn(CLIENT_FILES, match[2])) return null;
  return new Response(CLIENT_FILES[match[2]], {
    headers: {
      'content-type': 'text/javascript; charset=UTF-8',
      'cache-control': match[1] === CLIENT_VERSION ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff',
    },
  });
}
