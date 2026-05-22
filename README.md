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

- The browser now requests `https://e621.net/posts.json` directly by default so visitor traffic goes straight to e621, and only falls back to `/api/posts` if direct requests fail (for example due to temporary CORS or network issues).
- Browser JavaScript cannot set a custom `User-Agent` header, so direct requests always use the visitor's normal browser user agent. The Worker fallback path still sends the descriptive `User-Agent` configured in `src/worker.js`.
- e621 requires a descriptive `User-Agent` for server-side API usage. Update the placeholder contact in `src/worker.js` before production deployment.
