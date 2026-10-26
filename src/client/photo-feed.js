// Paging state for the photo grid, kept free of DOM so it can be unit tested (test/photo-feed.test.js).
// The page decides *when* more photos are needed; this module guarantees at most one page request
// at a time, stops at the end of results, and caps how many empty pages it will skip through.

import { fetchPostsPage, peekPostsPage, isAbortError } from './e621-client.js';

export const PHOTO_PAGE_SIZE = 60;
export const MAX_EMPTY_PAGES = 3;
// e621 answers 410 for pages beyond 750.
export const MAX_PAGE = 750;
export const SLOW_AFTER_MS = 4000;

export function photoTagsFromSettings(shared) {
  const raw = String(shared.tags || '').trim().split(/\s+/).filter(Boolean);
  const rating = String(shared.rating || '').trim().toLowerCase();
  const ratio = String(shared.ratio || '').trim().toLowerCase();
  const tags = [shared.sort === 'score' ? 'order:score' : 'order:rank', '-animated', ...raw];
  if (rating === 's' || rating === 'q' || rating === 'e') tags.push('rating:' + rating);
  if (ratio === 'vertical') tags.push('ratio:<1');
  if (ratio === 'landscape') tags.push('ratio:>1');
  return tags.join(' ');
}

export function createPhotoFeed({
  client,
  tags,
  pageSize = PHOTO_PAGE_SIZE,
  maxEmptyPages = MAX_EMPTY_PAGES,
  slowAfterMs = SLOW_AFTER_MS,
  onChange = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  const queue = [];
  const seen = new Set();
  const state = {
    // 'idle' | 'loading' | 'error' | 'done'
    phase: 'idle',
    slow: false,
    attempt: 1,
    maxAttempts: 1,
    retryError: null,
    error: null,
    // storedAt of the saved data being shown because e621 failed; 0 when the data is current.
    staleSince: 0,
    nextPage: 1,
    emptyPages: 0,
    // 'end' (last page reached) | 'sparse' (too many pages without images) | 'limit' (page 750)
    endReason: '',
  };
  let inflight = null;

  function notify() {
    onChange(state);
  }

  function finish(reason) {
    state.phase = 'done';
    state.endReason = reason;
  }

  function accept(result, page) {
    const { posts, rawCount } = result.data;
    let added = 0;
    posts.forEach((post) => {
      // Rankings can shift between page requests, so the same post may appear on two pages.
      if (seen.has(post.id)) return;
      seen.add(post.id);
      queue.push(post);
      added += 1;
    });
    state.nextPage = page + 1;
    state.staleSince = result.source === 'stale' ? result.storedAt : 0;
    state.error = result.source === 'stale' ? result.error : null;
    state.phase = 'idle';
    if (rawCount < pageSize) {
      finish('end');
    } else if (page >= MAX_PAGE) {
      finish('limit');
    } else if (added === 0) {
      state.emptyPages += 1;
      if (state.emptyPages >= maxEmptyPages) finish('sparse');
    } else {
      state.emptyPages = 0;
    }
    return added;
  }

  function onStatus(status) {
    if (status.phase === 'retrying') {
      state.attempt = status.nextAttempt;
      state.retryError = status.error;
    } else {
      state.attempt = status.attempt;
    }
    state.maxAttempts = status.maxAttempts;
    notify();
  }

  // Resolves to the number of new posts queued, or null if the request failed.
  function loadNextPage() {
    if (inflight) return inflight;
    if (state.phase === 'done' || state.phase === 'error') return Promise.resolve(state.phase === 'done' ? 0 : null);
    const page = state.nextPage;
    let current = null;
    state.phase = 'loading';
    state.slow = false;
    state.attempt = 1;
    state.retryError = null;
    const slowTimer = setTimer(() => {
      if (inflight !== current) return;
      state.slow = true;
      notify();
    }, slowAfterMs);
    current = fetchPostsPage(client, { view: 'photos', tags, page, limit: pageSize, onStatus })
      .then(
        (result) => accept(result, page),
        (error) => {
          if (error && error.kind === 'http' && error.status === 410) {
            finish('limit');
            return 0;
          }
          state.phase = isAbortError(error) ? 'idle' : 'error';
          state.error = isAbortError(error) ? null : error;
          return null;
        },
      )
      .finally(() => {
        clearTimer(slowTimer);
        state.slow = false;
        inflight = null;
        notify();
      });
    inflight = current;
    notify();
    return current;
  }

  // Manual retry after a failure: the next loadNextPage() asks e621 again.
  function clearError() {
    if (state.phase === 'error') state.phase = 'idle';
    state.error = null;
  }

  function take(max) {
    return queue.splice(0, max);
  }

  // Re-queues pages 1..maxPages from fresh cache entries only (no network), so back/reload can put the
  // grid back where it was. Stops at the first page that is missing or stale.
  function restore(maxPages) {
    let restored = 0;
    for (let page = 1; page <= Math.min(maxPages, MAX_PAGE) && state.phase !== 'done'; page += 1) {
      const hit = peekPostsPage(client, { view: 'photos', tags, page, limit: pageSize });
      if (!hit || !hit.fresh) break;
      accept({ data: hit.value, source: 'cache', storedAt: hit.storedAt }, page);
      restored += 1;
    }
    return restored;
  }

  return {
    state,
    queue,
    loadNextPage,
    clearError,
    take,
    restore,
    get canLoad() {
      return !inflight && state.phase === 'idle';
    },
    get pagesLoaded() {
      return state.nextPage - 1;
    },
  };
}
