import { fetchPostCount, fetchPostsPage, isAbortError } from './e621-client.js';

const COUNT_DELAY_MS = 300;
const MAX_VALIDATION_PAGES = 3;

export function bindMoreLikeThis({ client, view, pageSize, buildTags, filters, getPost, onOpen, onClose, onSuccess }) {
  const dialog = document.getElementById('moreLikeThis');
  const trigger = document.getElementById('openMoreLikeThis');
  const search = dialog.querySelector('input[type=search]');
  const list = dialog.querySelector('[data-more-tags]');
  const feedback = dialog.querySelector('[data-more-feedback]');
  const add = dialog.querySelector('[data-more-add]');
  const form = dialog.querySelector('form');
  const mediaType = view === 'reels' ? 'reels' : 'photos';
  let tagNames;
  let current;
  let selected;
  let count;
  let countTimer;
  let countRequest;
  let applyRequest;

  function cancelCount() {
    clearTimeout(countTimer);
    countRequest?.abort();
  }

  function setBusy(busy) {
    search.disabled = busy;
    list.disabled = busy;
    add.disabled = busy || !selected;
  }

  function renderTags() {
    const query = search.value.trim().toLowerCase().replaceAll(' ', '_');
    const existing = new Set(buildTags(current).toLowerCase().split(/\s+/));
    const matching = tagNames.filter(tag => tag.toLowerCase().includes(query));
    const rows = matching.map(tag => {
      const row = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'candidateTag';
      radio.value = tag;
      radio.checked = tag === selected;
      radio.disabled = existing.has(tag.toLowerCase());
      row.append(radio, document.createTextNode(tag.replaceAll('_', ' ')));
      if (radio.disabled) {
        const note = document.createElement('small');
        note.textContent = 'Added';
        row.append(note);
      }
      return row;
    });
    list.replaceChildren(...rows);
    if (!matching.length) {
      list.textContent = tagNames.length ? 'No tags match your search.' : 'This post has no listed tags.';
    }
    list.scrollTop = 0;
  }

  function nextFilters() {
    return { ...current, tags: [String(current.tags || '').trim(), selected].filter(Boolean).join(' ') };
  }

  function select(tag) {
    cancelCount();
    selected = tag;
    count = null;
    setBusy(false);
    const next = nextFilters();
    feedback.textContent = 'Checking matches for ' + tag.replaceAll('_', ' ') + '…';
    countTimer = setTimeout(async () => {
      const request = new AbortController();
      countRequest = request;
      try {
        const result = await fetchPostCount(client, buildTags(next), { signal: request.signal });
        if (request.signal.aborted || !dialog.open) return;
        count = result;
        const number = count.count.toLocaleString() + (count.capped ? '+' : '');
        feedback.textContent = count.count === 0 && !count.capped
          ? 'No posts match this combination. Your filters are unchanged.'
          : number + (count.count === 1 && !count.capped ? ' matching post' : ' matching posts') + ' on e621.';
      } catch (error) {
        if (request.signal.aborted || !dialog.open || isAbortError(error)) return;
        feedback.textContent = 'Match count unavailable. You can still try adding this tag.';
      }
    }, COUNT_DELAY_MS);
  }

  trigger.addEventListener('click', () => {
    const post = getPost();
    if (!post || dialog.open) return;
    cancelCount();
    applyRequest?.abort();
    current = filters.current;
    tagNames = [...(post.postTags || [])].sort((a, b) => a.localeCompare(b));
    selected = '';
    count = null;
    search.value = '';
    feedback.textContent = 'Select a tag to check matches with your current filters.';
    setBusy(false);
    renderTags();
    dialog.showModal();
    onOpen?.();
  });
  dialog.querySelector('[data-more-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    cancelCount();
    applyRequest?.abort();
    onClose?.();
  });
  search.addEventListener('input', renderTags);
  list.addEventListener('change', event => {
    if (event.target.name === 'candidateTag') select(event.target.value);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!selected || add.disabled) return;
    cancelCount();
    if (count?.count === 0 && !count.capped) {
      feedback.textContent = 'No posts match this combination. Your filters are unchanged.';
      return;
    }

    const request = new AbortController();
    applyRequest = request;
    setBusy(true);
    feedback.textContent = 'Checking for ' + mediaType + ' you can view…';
    const next = nextFilters();
    const tags = buildTags(next);
    const pages = [];
    try {
      for (let page = 1; page <= MAX_VALIDATION_PAGES; page += 1) {
        const result = await fetchPostsPage(client, { view, tags, page, limit: pageSize, signal: request.signal });
        if (request.signal.aborted || !dialog.open) return;
        if (result.source === 'stale') throw result.error;
        pages.push(result);
        if (result.data.posts.length) {
          dialog.close();
          onSuccess?.();
          filters.apply({ tags: next.tags }, { pages });
          return;
        }
        if (result.data.rawCount < pageSize) break;
      }
      const checkedAll = pages.at(-1)?.data.rawCount < pageSize;
      feedback.textContent = checkedAll
        ? 'No viewable ' + mediaType + ' match this combination. Your filters are unchanged.'
        : 'No viewable ' + mediaType + ' in the first ' + MAX_VALIDATION_PAGES + ' pages. Your filters are unchanged.';
    } catch (error) {
      if (request.signal.aborted || !dialog.open || isAbortError(error)) return;
      feedback.textContent = error?.status === 422
        ? 'e621 rejected this tag combination. Your filters are unchanged.'
        : 'Could not check new matches. Your filters are unchanged. Try again.';
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  });
}
