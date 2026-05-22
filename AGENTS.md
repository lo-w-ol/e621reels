# AGENTS.md

## Decision log update requirement
When making changes in this repository, append entries to this file so the next AI can follow intent and sequence.

## Summarized context read
- Reviewed `src/worker.js` feed loading and tag autocomplete network flow.
- Reviewed `README.md` notes describing Worker-first with direct fallback behavior.

## Summarized thinking
- User goal is to keep network traffic direct from visitor to e621 API and reduce Worker relay usage.
- Safest migration is direct-first with Worker fallback, preserving resilience when direct requests fail.
- Keep existing Worker API endpoints for fallback compatibility and operational continuity.

## Summarized changes with dates
- 2026-05-22: Switched reel feed fetching from Worker-first to direct-first, with `/api/posts` as fallback only.
- 2026-05-22: Switched tag autocomplete from Worker-first to direct-first, with `/api/tags/autocomplete` fallback only.
- 2026-05-22: Updated README notes to document direct-first behavior and reduced Worker traffic.
