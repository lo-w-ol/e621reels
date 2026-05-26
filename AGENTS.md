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
- Reviewed latest photo lightbox gesture handling and identified vertical swipe still triggering close behavior.
- Reviewed Google Photos-like swipe threshold expectation (commit only when drag passes roughly half-screen and user releases).

## Summarized thinking
- Lightbox should never close on vertical drag because users need vertical movement for tall/comic images.
- Smoothness needs live drag tracking during touchmove, then settle on release with a 50% width threshold to switch images.
- Persistent directional hints improve discoverability: side arrows for horizontal swipe, and conditional down hint for tall images.

## Summarized changes with dates
- 2026-05-22: Removed vertical-swipe-to-close behavior in photo lightbox to prevent accidental exits while inspecting tall images.
- 2026-05-22: Implemented live touch-drag translation with release-based commit logic that only changes image when swipe exceeds 50% viewport width.
- 2026-05-22: Added subtle side swipe arrows and a conditional down-arrow hint shown for tall images to indicate vertical exploration.
- Reviewed latest photo lightbox swipe threshold constant and slide alignment CSS.

## Summarized thinking
- Lowering swipe commit threshold from 50% to 40% should keep intent-based navigation while making transitions feel less effortful.
- Center alignment should apply to smaller-than-viewport-height images so they sit visually centered in lightbox.

## Summarized changes with dates
- 2026-05-22: Reduced photo lightbox horizontal swipe release threshold to 40% viewport width for easier next/previous transitions.
- 2026-05-22: Adjusted photo lightbox slide alignment to center smaller images vertically in the viewport.

## Summary title: Reels stripped UI + horizontal scrub seek

### Summarized context read
- Reviewed `renderApp` reel-mode HTML/CSS shell, overlay controls, and menu/settings surfaces in `src/worker.js`.
- Reviewed reel gesture handlers (`beginGesture`, `updateGesture`, `finalizeSwipe`) and playback/meta updates (`updateMeta`, `startPlaybackForPost`) in `src/worker.js`.
- Reviewed photo-mode credit treatment to mirror a minimal artist credit + source link presentation style.

### Summarized thinking
- User requested a reel experience with almost all chrome removed, while preserving mute control and artist attribution similar to photo mode, so the safest path is to keep existing feed logic while collapsing visible controls to a minimal bottom credit strip.
- Existing swipe navigation is vertical, so scrub should be introduced as a horizontal gesture on active video only; this avoids conflict with up/down reel navigation and matches YouTube-mobile-style side scrub behavior.
- To reduce risk of runtime breakage from dependent selectors/listeners, preserve required DOM IDs in hidden compatibility nodes while removing visible UI surfaces.

### Summarized changes with dates
- 2026-05-22 05:03 UTC: Removed visible reel-side UI surfaces (header/menu/settings/top badges/jump/buttons/filter panel/progress chrome), keeping a minimal overlay with artist credit and mute button.
- 2026-05-22 05:03 UTC: Updated reel meta rendering to present artist-focused credit text with inline “View post” link, matching photo-mode credit intent.
- 2026-05-22 05:03 UTC: Implemented horizontal video scrubbing during side drag, including a transient scrub HUD with current time / total duration and progress bar; vertical drag behavior remains reel navigation.
- 2026-05-22 05:03 UTC: Added hidden compatibility nodes for legacy element IDs so existing script wiring remains stable while UI is visually simplified.

## Summary title: Global shared header + top-right burger nav unification

### Summarized context read
- Reviewed `renderApp`, `renderPhotoGridPage`, and `renderAboutPage` page-shell HTML/CSS/JS in `src/worker.js` to identify where page-level navigation was duplicated or missing.
- Reviewed existing page transition interception logic (`data-page-nav` click handling with View Transitions fallback) to keep same-tab smooth navigation behavior.

### Summarized thinking
- A single common top-right header pattern on every page reduces per-page branching and keeps navigation predictable.
- Reusing the existing `data-page-nav` transition pattern keeps UX continuity while avoiding additional routing complexity.
- Keeping menu markup lightweight and directly server-rendered per page preserves performance and avoids extra network fetches for nav.

### Summarized changes with dates
- 2026-05-22 05:14 UTC: Added a shared top-right burger-style header/navigation treatment to reel and about pages so all main pages expose Reels/Photos/About from the same position.
- 2026-05-22 05:14 UTC: Kept same-tab left-click transition behavior for global menu links (View Transitions API with fade fallback).
- 2026-05-22 05:14 UTC: Preserved server-rendered navigation output for simplicity/performance with no additional client fetch step.

## Summary title: Global nav componentization + photo legacy menu removal

### Summarized context read
- Reviewed the latest `src/worker.js` render output for reels, photos, and about pages to confirm where the previous menu wiring diverged.
- Verified photo page still had the older local menu/header implementation (`#menu`, `#menuBtn`) alongside new global navigation intent.
- Reviewed prior global menu injection points and found duplicated per-page logic rather than a single shared render/script source.

### Summarized thinking
- The menu click issue is best resolved by moving interaction logic into one shared script generator so behavior cannot drift by page.
- To avoid future misses, header markup should be produced by one shared render helper and reused by all pages.
- Removing photo-page legacy menu/header avoids conflicting controls and ensures only one authoritative nav path remains.

### Summarized changes with dates
- 2026-05-22 05:19 UTC: Refactored global navigation into shared `renderGlobalHeader(...)` + `renderGlobalHeaderScript()` helpers reused by reels, photos, and about pages.
- 2026-05-22 05:19 UTC: Removed legacy photo-page menu/header wiring (`#menu`, `#menuBtn`, and related page-local handlers) and switched photos to the shared global menu.
- 2026-05-22 05:19 UTC: Standardized menu open/close and same-tab transition navigation behavior through one shared script source to prevent page-by-page drift.

## Summary title: Direct-only e621 data path + dedicated privacy page

### Summarized context read
- Reviewed reel feed request flow in `src/worker.js`, especially `fetchPostsPreferDirect`, `fetchPostsDirectly`, and failure messaging.
- Reviewed tag autocomplete network flow in `src/worker.js`, including direct request handling and worker fallback usage.
- Reviewed route handlers and page render helpers (`renderAboutPage`, `renderGlobalHeader`) to add a new privacy-focused page and navigation link.
- Reviewed `README.md` notes describing direct-first behavior with worker fallback language.

### Summarized thinking
- To reduce first-party compliance surface, the browser should request e621 APIs directly with no client-to-worker fallback path for feed/autocomplete.
- A dedicated privacy page should explicitly explain what this site does and does not process, and clearly disclose unavoidable third-party processing by e621.
- Keeping the existing worker API endpoints intact for operational compatibility is acceptable as long as frontend flows no longer invoke them as fallback.

### Summarized changes with dates
- 2026-05-22 05:55 UTC: Removed reel feed client-side worker fallback logic and made the feed path direct-only to e621.
- 2026-05-22 05:55 UTC: Removed tag autocomplete client-side worker fallback logic and made autocomplete direct-only to e621.
- 2026-05-22 05:55 UTC: Added a new `/privacy` page detailing first-party privacy scope, direct e621 data flow, and no client→worker relay for feed/autocomplete.
- 2026-05-22 05:55 UTC: Added Privacy navigation entry to the shared global header menu across pages.
- 2026-05-22 05:55 UTC: Updated `README.md` notes to reflect direct-only client API behavior and the new privacy page.

## Summary title: Privacy policy hardening with legal transparency notice

### Summarized context read
- Reviewed existing `/privacy` route and `renderPrivacyPage()` content in `src/worker.js` to confirm the page existed but was brief and mainly technical.
- Reviewed prior AGENTS decision log entries documenting direct-to-e621 data flow so policy language remains aligned with implemented behavior.

### Summarized thinking
- User requested a stronger privacy policy intended to reduce legal exposure, so the safest change is to expand policy scope with clearer sections (controller scope, third-party processing, regional rights, children, updates, and legal disclaimer).
- It is important to avoid false promises; therefore policy text should explicitly state it is not legal advice and cannot guarantee immunity from lawsuits.
- Keep the implementation lightweight by updating only the existing privacy page renderer and preserving global navigation behavior.

### Summarized changes with dates
- 2026-05-26 23:22 UTC: Expanded the `/privacy` page into a fuller Privacy Policy with effective date, data practices, third-party disclosures, rights language, children section, updates section, and legal transparency disclaimer.
- 2026-05-26 23:22 UTC: Updated privacy page title text to “Privacy Policy” to match user intent and legal-page semantics.
