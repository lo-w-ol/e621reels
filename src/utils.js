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

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}
