# e621reels

A Cloudflare Worker site that turns e621's public API into an Instagram Reels-style fullscreen viewer.

## Features

- Defaults to a trending/popular animated feed using `order:rank animated` on the e621 API.
- Instagram-inspired fullscreen UI with vertical swipe navigation and animated auto-advance transitions.
- Lets videos play fully before auto-advancing, while images still advance after roughly 10 seconds.
- Lets users switch to score-based sorting, add tags, and filter by rating.
- Includes an almost-transparent settings cog with optional fit-media and hide-tags display toggles.
- Ships as a single Worker with no extra Cloudflare bindings or dashboard changes required.

## Local development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Notes

- The browser now requests `https://e621.net/posts.json` directly by default so visitor traffic goes straight to e621, and with no client-side fallback through this Worker API.
- Browser JavaScript cannot set a custom `User-Agent` header, so direct requests always use the visitor's normal browser user agent. This app avoids client→Worker API relay paths for feed and autocomplete requests.
- e621 requires a descriptive `User-Agent` for server-side API usage. Update the placeholder contact in `src/worker.js` before production deployment.

- A dedicated `/privacy` page explains direct-to-e621 data flow and first-party privacy scope.

## Migration note (2026-05-26)

- `src/worker.js` now primarily routes requests while shared network/sanitization helpers are split into `src/api.js` and `src/utils.js`.
- This is a structure-only refactor intended to preserve all existing routes and UI behavior.
