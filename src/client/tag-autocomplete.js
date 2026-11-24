import {
  AUTOCOMPLETE_MIN_LENGTH,
  fetchTagSuggestions,
  getBrowserClient,
  isAbortError,
  sanitizeAutocompleteQuery,
} from './e621-client.js';

const CATEGORY_LABELS = ['General', 'Artist', 'Contributor', 'Copyright', 'Character', 'Species', 'Invalid', 'Meta', 'Lore'];

export function bindTagAutocomplete(input) {
  const client = getBrowserClient();
  const popup = document.createElement('div');
  popup.className = 'tag-suggestions';
  popup.hidden = true;
  const list = document.createElement('div');
  list.id = input.id + '-suggestions';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Tag suggestions');
  const status = document.createElement('div');
  status.className = 'tag-suggestion-status';
  status.setAttribute('role', 'status');
  popup.append(list, status);
  input.after(popup);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-controls', list.id);
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');

  let items = [];
  let selected = -1;
  let pending;
  let timer;

  function close() {
    clearTimeout(timer);
    pending?.abort();
    items = [];
    selected = -1;
    list.replaceChildren();
    status.textContent = '';
    popup.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function tokenAtCursor() {
    const caret = input.selectionStart ?? input.value.length;
    const before = input.value.slice(0, caret);
    const prefix = before.match(/\S+$/)?.[0] || '';
    const suffix = input.value.slice(caret).match(/^\S*/)[0];
    return {
      start: caret - prefix.length,
      end: caret + suffix.length,
      minus: prefix.startsWith('-') ? '-' : '',
      query: sanitizeAutocompleteQuery(prefix.replace(/^-/, '')),
    };
  }

  function choose(index) {
    const tag = items[index];
    if (!tag) return;
    const { start, end, minus } = tokenAtCursor();
    const trailingSpace = !/^\s/.test(input.value.slice(end));
    input.setRangeText(minus + tag.name + (trailingSpace ? ' ' : ''), start, end, 'end');
    close();
    input.focus();
  }

  function select(index) {
    selected = index;
    for (const [i, option] of [...list.children].entries()) {
      option.setAttribute('aria-selected', String(i === selected));
    }
    const option = list.children[selected];
    input.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function render(results) {
    items = results;
    list.replaceChildren(...items.map((tag, index) => {
      const option = document.createElement('div');
      option.id = list.id + '-' + index;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.dataset.index = index;
      const label = tag.antecedentName ? tag.antecedentName + ' → ' + tag.name : tag.name;
      option.textContent = label.replaceAll('_', ' ');
      const category = document.createElement('small');
      category.textContent = CATEGORY_LABELS[tag.category] || 'Tag';
      option.append(category);
      return option;
    }));
    status.textContent = items.length ? '' : 'No matching tags';
    popup.hidden = false;
    input.setAttribute('aria-expanded', String(Boolean(items.length)));
  }

  function schedule() {
    close();
    const { query } = tokenAtCursor();
    if (input !== document.activeElement || query.length < AUTOCOMPLETE_MIN_LENGTH) return;
    timer = setTimeout(async () => {
      const request = new AbortController();
      pending = request;
      try {
        const results = await fetchTagSuggestions(client, query, { signal: request.signal });
        if (!request.signal.aborted && tokenAtCursor().query === query) render(results);
      } catch (error) {
        if (request.signal.aborted || isAbortError(error)) return;
        popup.hidden = false;
        status.textContent = 'Could not load tag suggestions';
      }
    }, 160);
  }

  input.addEventListener('input', schedule);
  input.addEventListener('focus', schedule);
  input.addEventListener('click', schedule);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !popup.hidden) {
      event.preventDefault();
      close();
    } else if (items.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = selected < 0 && delta < 0 ? items.length - 1 : (selected + delta + items.length) % items.length;
      select(next);
    } else if (event.key === 'Enter' && selected >= 0) {
      event.preventDefault();
      choose(selected);
    } else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      close();
    }
  });
  list.addEventListener('mousedown', event => event.preventDefault());
  list.addEventListener('click', event => {
    const option = event.target.closest('[data-index]');
    if (option) choose(Number(option.dataset.index));
  });
  return close;
}
