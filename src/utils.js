export function formatTagLabel(tag) {
  return String(tag || '').replaceAll('_', ' ');
}

export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replaceAll('</script', '<\\/script');
}

export function normalizePage(value) {
  const page = Number.parseInt(value || '1', 10);
  if (Number.isNaN(page) || page < 1) return 1;
  return Math.min(page, 750);
}

export function sanitizeTags(raw) {
  return String(raw || '')
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function sanitizeRating(raw) {
  return ['s', 'q', 'e'].includes(raw) ? raw : '';
}

export function sanitizeRatioFilter(raw) {
  return ['vertical', 'landscape'].includes(raw) ? raw : '';
}

export function sanitizeAutocompleteQuery(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_:()'-]/g, '')
    .slice(0, 64);
}

const ALLOWED_CORS_ORIGINS = new Set([
  'https://furryreel.com',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);

export function jsonHeaders(request = null) {
  const headers = {
    'content-type': 'application/json; charset=UTF-8',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'permissions-policy': "geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
  };

  // Same-origin frontend calls do not need CORS. This allowlist is only for controlled origins.
  const origin = request?.headers?.get('origin');
  if (origin && ALLOWED_CORS_ORIGINS.has(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers.vary = 'Origin';
  }

  return headers;
}

export function htmlHeaders() {
  return {
    'content-type': 'text/html; charset=UTF-8',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'permissions-policy': "geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
    'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://e621.net; img-src 'self' data: https://static1.e621.net https://static1.e926.net https://static.e621.net https://e621.net; media-src 'self' https://static1.e621.net https://static1.e926.net https://static.e621.net https://e621.net; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  };
}

export function json(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(request),
  });
}
