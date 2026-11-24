import { bindTagAutocomplete } from './tag-autocomplete.js';

// Shared filter sheet for the two feed pages.
export function bindFeedFilters({ initial, loadSettings, onApply, onVisibilityChange = () => {} }) {
  const dialog = document.getElementById('feedFilters');
  const trigger = document.getElementById('openFeedFilters');
  const form = dialog.querySelector('form');
  const fields = form.elements;
  const closeSuggestions = bindTagAutocomplete(fields.tags);
  let filters = { ...initial };

  function updateTrigger() {
    const count = Number(Boolean(filters.tags)) + Number(Boolean(filters.rating))
      + Number(filters.sort === 'score') + Number(Boolean(filters.ratio));
    trigger.textContent = count ? 'Filters · ' + count : 'Filters';
  }

  function open(source = trigger) {
    if (dialog.open) return;
    fields.tags.value = filters.tags;
    fields.rating.value = filters.rating;
    fields.sort.value = filters.sort;
    fields.ratio.value = filters.ratio;
    dialog.showModal();
    onVisibilityChange(true);
    dialog.addEventListener('close', () => {
      closeSuggestions();
      (source.isConnected && !source.closest('[hidden]') ? source : trigger).focus({ preventScroll: true });
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

  trigger.addEventListener('click', () => open());
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
