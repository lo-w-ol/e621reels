# AGENTS.md

## Decision log update requirement
When making changes in this repository, append entries to this file so the next AI can follow intent and sequence.

## Summarized context read
- Reviewed `src/worker.js` feed loading and tag autocomplete network flow.
- Reviewed `README.md` notes describing Worker-first with direct fallback behavior.
- Reviewed `createSlide` media element creation in `src/worker.js` and existing `.loading` / `.awaiting-play` states.

## Summarized thinking
- User goal is to keep network traffic direct from visitor to e621 API and reduce Worker relay usage.
- Safest migration is direct-first with Worker fallback, preserving resilience when direct requests fail.
- Keep existing Worker API endpoints for fallback compatibility and operational continuity.
- A lightweight per-file loading indicator should reuse existing loading states instead of adding heavy logic, so it appears for both images and videos with minimal overhead.

## Summarized changes with dates
- 2026-05-22: Switched reel feed fetching from Worker-first to direct-first, with `/api/posts` as fallback only.
- 2026-05-22: Switched tag autocomplete from Worker-first to direct-first, with `/api/tags/autocomplete` fallback only.
- 2026-05-22: Updated README notes to document direct-first behavior and reduced Worker traffic.
- 2026-05-22: Reviewed dissatisfaction follow-up and implemented smooth inter-page transitions for burger-menu/back-link navigation using View Transitions API with fade fallback and reduced-motion bypass.
- 2026-05-22: Kept navigation interception scoped to same-tab left-clicks to preserve expected new-tab/modified-click behavior.
- 2026-05-22: Added a lightweight in-slide loading indicator for media files (images and videos), tied to existing `.loading` and `.awaiting-play` classes for fast visual feedback.
- Reviewed reel page shell/header/menu CSS/markup in `renderApp`.
- Reviewed photo grid page inline shell/header/menu layout in `renderPhotoGridPage`.

## Summarized thinking
- To make the site feel more app-like, both modes should share a persistent framed surface and a continuous top header.
- A swipe-style burger menu is best implemented as an off-canvas drawer with transform transitions, instead of a popover dropdown.
- Keep existing view-transition navigation so URL changes feel less like page breaks while preserving normal modified-click behavior.

## Summarized changes with dates
- 2026-05-22: Reworked reel mode UI to use a continuous top app header and an off-canvas burger drawer that slides in from the left.
- 2026-05-22: Reworked photo mode UI into a framed app surface with the same continuous top header pattern and swipe-open off-canvas burger drawer.
- 2026-05-22: Kept smooth page navigation transitions intact while integrating the new shared header/drawer behavior.
- Reviewed `renderPhotoGridPage` lightbox markup/CSS/JS behavior for image sizing and swipe handling.
- Reviewed existing reel swipe transition behavior to mirror interaction feel in photo lightbox.

## Summarized thinking
- To match reel feel, photo lightbox needs horizontal swipe transitions with animated track movement instead of abrupt image replacement.
- For comic/tall images, setting displayed image width to 100% inside fullscreen slides preserves full-width app feel while allowing tall content to remain large.
- Preserve lightweight implementation by pre-rendering previous/current/next slides only and animating between them.

## Summarized changes with dates
- 2026-05-22: Reworked photo lightbox into a slide-track viewer with smooth left/right swipe transitions between adjacent images.
- 2026-05-22: Updated lightbox image presentation to render at 100% width in fullscreen slide panels so tall images (e.g., comic strips) stay large and full-width.
- 2026-05-22: Added gesture handling that prioritizes horizontal swipe for next/previous and keeps keyboard navigation + escape close behavior.
