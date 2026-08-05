# e621reels

A Cloudflare Worker site that turns e621's public API into an Instagram Reels-style fullscreen viewer.

## Features

- Defaults to a trending/popular animated feed using `order:rank animated` on the e621 API.
- Instagram-inspired fullscreen UI with vertical swipe navigation and animated auto-advance transitions.
- Lets videos play fully before auto-advancing, while images still advance after roughly 10 seconds.
- Lets users switch to score-based sorting, add tags, and filter by rating.
- Includes privacy/safety hardening for logs, API errors, response headers, and metadata rendering.

## Local development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run check
npm run deploy
```

## Notes

- Normal frontend reels/feed/photos/media/tag-autocomplete requests go directly from the visitor browser to `https://e621.net`.
- Tag autocomplete availability depends on e621 permitting browser-side cross-origin requests.
- Worker proxy endpoints `/api/posts` and `/api/tags/autocomplete` have been removed to keep browser→e621 requests truly direct.
- Worker/API privacy hardening reduces exposed error details, restricts CORS behavior, and minimizes sensitive logs.
- Placeholder contact emails in policy/legal/support text must be replaced before production.
- Run `npm run check` before deployment.

## Content/removal note

- This site does not normally host underlying e621 media as first-party content; it links/displays third-party content served by e621/static hosts.
- Content removal, copyright, or privacy requests about specific e621-hosted posts should generally be sent to e621 first.
- The site operator may consider removing local links/indexing references to specific posts when technically feasible.
- Site-specific concerns can be sent to `privacy@example.com` (placeholder; replace before production).

## Migration note (2026-05-26)

- `src/worker.js` routes requests and renders pages.
- Worker proxy API module `src/api.js` was removed; Worker no longer proxies e621 content APIs.
- Shared sanitization/escaping/header helpers live in `src/utils.js`.
