import { bindTagAutocomplete } from './tag-autocomplete.js';

// Shared filter sheet for the two feed pages.
export function bindFeedFilters({ initial, loadSettings, onApply, onVisibilityChange = () => {} }) {
  const dialog = document.getElementById('feedFilters');
  const trigger = document.getElementById('openFeedFilters');
  const form = dialog.querySelector('form');
  const fields = form.elements;
  const closeSuggestions = bindTagAutocomplete(fields.tags);
  const searchTrigger = document.getElementById('openFeedSearch');
  const sortTabs = [...document.querySelectorAll('[data-sort-tab]')];
  const filterBadge = trigger.querySelector('[data-filter-badge]');
  let filters = { ...initial };

  function updateTrigger() {
    const count = Number(Boolean(filters.tags)) + Number(Boolean(filters.rating))
      + Number(filters.sort === 'score') + Number(Boolean(filters.ratio));
    if (filterBadge) {
      filterBadge.textContent = count ? String(count) : '';
      filterBadge.hidden = !count;
      trigger.setAttribute('aria-label', count ? `Feed filters (${count} active)` : 'Feed filters');
    } else {
      trigger.textContent = count ? 'Filters · ' + count : 'Filters';
    }
    for (const tab of sortTabs) {
      const isActive = tab.getAttribute('data-sort-tab') === (filters.sort === 'score' ? 'score' : 'trending');
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-pressed', String(isActive));
    }
  }

  function open(source = trigger, { focusTags = false } = {}) {
    if (dialog.open) return;
    fields.tags.value = filters.tags;
    fields.rating.value = filters.rating;
    fields.sort.value = filters.sort;
    fields.ratio.value = filters.ratio;
    dialog.showModal();
    onVisibilityChange(true);
    if (focusTags) {
      fields.tags.focus({ preventScroll: true });
      fields.tags.select();
    }
    dialog.addEventListener('close', () => {
      closeSuggestions();
      (source && source.isConnected && !source.closest('[hidden]') ? source : trigger).focus({ preventScroll: true });
      onVisibilityChange(false);
    }, { once: true });
  }

  function apply(next, options) {
    if (!Object.keys(next).some(key => next[key] !== filters[key])) return;
    filters = { ...filters, ...next };
    const settings = loadSettings();
    settings.shared = { ...settings.shared, ...next };
    try {
      localStorage.setItem('fr_settings_v1', JSON.stringify(settings));
    } catch {
      // The current feed can still use these filters when storage is unavailable.
    }
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({ tags: filters.tags, rating: filters.rating, mode: filters.sort === 'score' ? 'score' : '', ratio: filters.ratio })) {
      if (settings.shared.syncUrl !== false && value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, '', url);
    updateTrigger();
    onApply(filters, options);
  }

  trigger.addEventListener('click', () => open(trigger));
  if (searchTrigger) {
    searchTrigger.addEventListener('click', () => open(searchTrigger, { focusTags: true }));
  }
  for (const tab of sortTabs) {
    tab.addEventListener('click', () => {
      const sort = tab.getAttribute('data-sort-tab') === 'score' ? 'score' : 'trending';
      apply({ sort });
    });
  }
  dialog.querySelector('[data-close-filters]').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', event => {
    event.preventDefault();
    dialog.close();
    apply({ tags: fields.tags.value.trim(), rating: fields.rating.value, sort: fields.sort.value, ratio: fields.ratio.value });
  });
  form.addEventListener('reset', event => {
    event.preventDefault();
    closeSuggestions();
    fields.tags.value = '';
    fields.rating.value = '';
    fields.sort.value = 'trending';
    fields.ratio.value = '';
  });
  updateTrigger();
  return { open, apply, get current() { return { ...filters }; } };
}
