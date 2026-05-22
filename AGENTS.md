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
