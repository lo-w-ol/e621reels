import { fetchPostArtists, isAbortError } from './e621-client.js';

export function bindPostCredit(container, client) {
  let request;
  let currentPost;
  const artist = document.createElement('span');
  artist.setAttribute('aria-live', 'polite');
  const link = document.createElement('a');
  link.textContent = 'View post';
  link.target = '_blank';
  link.rel = 'noreferrer noopener';
  container.replaceChildren(artist, ' • ', link);

  function cancel() {
    request?.abort();
  }

  function show(post) {
    cancel();
    currentPost = post;
    link.href = post.sourceUrl;
    artist.textContent = post.artistText ? 'Artist: ' + post.artistText : 'Artist credit unavailable';
  }

  async function resolve() {
    if (!currentPost || currentPost.artistText || !currentPost.artistTags?.length) return;
    cancel();
    const controller = new AbortController();
    request = controller;
    artist.textContent = 'Looking up artist…';
    try {
      const credit = await fetchPostArtists(client, currentPost, { signal: controller.signal });
      if (!controller.signal.aborted) {
        artist.textContent = credit ? 'Artist: ' + credit : 'No artist listed';
      }
    } catch (error) {
      if (!controller.signal.aborted && !isAbortError(error)) {
        artist.textContent = 'Artist credit unavailable';
      }
    }
  }

  return { show, resolve, cancel };
}
