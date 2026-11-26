// Shared UI primitives, SVG icons, top feed bar, and bottom navigation bar
// matching the FurryReel dark glass + lavender/pink visual design.

export const ICONS = {
  flame: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M13.5 2.4c.4 2.7-1.1 4.6-2.4 6.1-1.2 1.3-2.1 2.4-2.1 4.1 0 1.4.8 2.6 2 3.1-.5-1-.3-2.3.7-3.3.7-.7 1.3-1.4 1.5-2.4 1.8 1.5 2.9 3.6 2.9 5.8 0 2.9-2.2 5.2-5.1 5.2S6 18.7 6 15.6c0-3.3 2.1-5.8 4.2-8.2 1.3-1.5 2.5-3 3.3-5z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2.2" fill="currentColor"/><circle cx="15" cy="12" r="2.2" fill="currentColor"/><circle cx="10" cy="18" r="2.2" fill="currentColor"/></svg>`,
  paw: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="7" cy="9.5" r="2.1"/><circle cx="11" cy="7.2" r="2.1"/><circle cx="15.2" cy="7.8" r="2.1"/><circle cx="18.2" cy="11" r="2"/><path d="M12.2 11.4c-2.6 0-5 2.1-5 4.6 0 1.7 1.3 2.8 2.9 2.8 1 0 1.5-.3 2.1-.3s1.1.3 2.1.3c1.6 0 2.9-1.1 2.9-2.8 0-2.5-2.4-4.6-5-4.6z"/></svg>`,
  externalLink: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 5h5v5"/><path d="M10 14 19 5"/><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.1 15.8 3 12.9 3 9.1 3 6.2 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.2 5 5.1 0 3.8-3.1 6.7-8.2 11-.2.2-.5.3-.8.3z"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true"><path d="M12 3.5c-5 0-9 3.4-9 7.6 0 2.1 1 4 2.6 5.4L4.4 20c-.1.4.3.7.7.5l3.9-1.7c.9.2 2 .4 3 .4 5 0 9-3.4 9-7.6s-4-8.1-9-8.1z"/></svg>`,
  bookmarkOutline: `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 4.5h11a1 1 0 0 1 1 1v14.8l-6.5-4.1-6.5 4.1V5.5a1 1 0 0 1 1-1z"/></svg>`,
  bookmarkFilled: `<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true"><path d="M6.5 3.5h11a2 2 0 0 1 2 2v15.4c0 .7-.8 1.2-1.4.8L12 17.8l-6.1 3.9c-.6.4-1.4-.1-1.4-.8V5.5a2 2 0 0 1 2-2z"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/><path d="M18.5 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3 10 14"/><path d="m21 3-6.5 18-3.8-7.7L3 9.5 21 3z"/></svg>`,
  musicNote: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 4v10.2a3.3 3.3 0 1 1-1.8-2.9V7.5l-6 1.5v7.2a3.3 3.3 0 1 1-1.8-2.9V6.8c0-.8.5-1.5 1.3-1.7l7.1-1.8c.7-.2 1.2.3 1.2.7z"/></svg>`,
  soundWave: `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M4 12h1M8 8v8M12 5v14M16 8v8M20 12h0"/></svg>`,
  mutedSlash: `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>`,
  verified: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.4 1.6 2.9-.2 1.2 2.6 2.5 1.4-.4 2.9 1.4 2.5-1.9 2.2.2 2.9-2.8.8-1.6 2.4-2.9-.6-2.9.6-1.6-2.4-2.8-.8.2-2.9L2 13.3l1.4-2.5-.4-2.9 2.5-1.4 1.2-2.6 2.9.2L12 2.5zm-1.1 12.9l5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3z"/></svg>`,
  playCircle: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm-2.1 6.1 6.2 3.4-6.2 3.4V8.6z"/></svg>`,
  playCircleOutline: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10.2 8.7 15.8 12l-5.6 3.3V8.7z" fill="currentColor" stroke="none"/></svg>`,
  photoGallery: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="9.5" r="1.5" fill="currentColor" stroke="none"/><path d="m20.5 15.5-4.3-4.3a1.5 1.5 0 0 0-2.1 0L7 18.3"/></svg>`,
  play: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>`,
};

export function renderBottomNavStyles() {
  return `
    .fr-bottom-nav{
      display:flex;align-items:center;justify-content:center;
      background:rgba(9,9,13,.96);
      border-top:1px solid rgba(255,255,255,.1);
      backdrop-filter:blur(18px);
      -webkit-backdrop-filter:blur(18px);
      padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));
      z-index:45;
    }
    .fr-bottom-nav--fixed{
      position:fixed;left:0;right:0;bottom:0;
    }
    .fr-bottom-nav--embedded{
      position:relative;flex:none;width:100%;
    }
    .fr-bottom-nav__inner{
      width:min(100%,540px);
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:4px;
    }
    .fr-bottom-nav__item{
      position:relative;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
      min-height:48px;padding:4px 6px;border-radius:12px;
      color:#8f8fa3;text-decoration:none;
      font:600 .72rem/1.1 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;
      letter-spacing:.01em;
      transition:color .14s ease,background .14s ease;
    }
    .fr-bottom-nav__item:hover{color:#e8e8f4;background:rgba(255,255,255,.05)}
    .fr-bottom-nav__item:focus-visible{outline:2px solid #ffd36b;outline-offset:-2px}
    .fr-bottom-nav__item[aria-current="page"]{color:#b7adff}
    .fr-bottom-nav__icon{position:relative;display:grid;place-items:center;width:24px;height:24px}
    .fr-bottom-nav__badge{
      position:absolute;top:-5px;right:-10px;
      min-width:16px;height:16px;padding:0 4px;border-radius:999px;
      background:#ff3e88;color:#fff;
      font:700 10px/16px Inter,system-ui,sans-serif;text-align:center;
      box-shadow:0 2px 6px rgba(0,0,0,.45);
    }
    .fr-bottom-nav__badge[hidden]{display:none}
    body.page-transitioning{opacity:0;transition:opacity .18s ease}
  `;
}

export function renderBottomNav(activePage, { embedded = false } = {}) {
  const item = (key, href, label, icon, extra = '') => {
    const current = activePage === key ? ' aria-current="page"' : '';
    return `<a class="fr-bottom-nav__item" href="${href}" data-page-nav data-nav-key="${key}"${current}><span class="fr-bottom-nav__icon">${icon}${extra}</span><span>${label}</span></a>`;
  };
  const reelsIcon = activePage === 'reels' ? ICONS.playCircle : ICONS.playCircleOutline;
  const savedIcon = activePage === 'saved' ? ICONS.bookmarkFilled : ICONS.bookmarkOutline;
  return `<nav class="fr-bottom-nav ${embedded ? 'fr-bottom-nav--embedded' : 'fr-bottom-nav--fixed'}" aria-label="Primary">
    <div class="fr-bottom-nav__inner">
      ${item('reels', '/', 'Reels', reelsIcon)}
      ${item('photos', '/photos', 'Photos', ICONS.photoGallery)}
      ${item('saved', '/saved', 'Saved', savedIcon, '<span class="fr-bottom-nav__badge" data-saved-badge hidden></span>')}
      ${item('settings', '/settings', 'Settings', ICONS.sliders)}
    </div>
  </nav>`;
}

export function renderBottomNavScript() {
  return `(() => {
    function syncSavedBadge() {
      let count = 0;
      try {
        const raw = localStorage.getItem('fr_saved_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
          count = list.length;
        }
      } catch {
        count = 0;
      }
      document.querySelectorAll('[data-saved-badge]').forEach((el) => {
        el.textContent = count > 99 ? '99+' : (count ? String(count) : '');
        el.hidden = count === 0;
      });
    }
    syncSavedBadge();
    window.addEventListener('storage', (event) => {
      if (event.key === 'fr_saved_v1' || event.key === null) syncSavedBadge();
    });
    window.addEventListener('fr:saved-changed', syncSavedBadge);

    document.querySelectorAll('.fr-bottom-nav a[data-page-nav]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const targetUrl = new URL(anchor.href, location.href);
        if (targetUrl.pathname === location.pathname && targetUrl.search === location.search) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          location.href = anchor.href;
          return;
        }
        if (document.startViewTransition) {
          document.startViewTransition(() => { location.href = anchor.href; });
          return;
        }
        document.body.classList.add('page-transitioning');
        setTimeout(() => { location.href = anchor.href; }, 140);
      });
    });
  })();`;
}

export function renderFeedTopBarStyles() {
  return `
    .fr-topbar{
      display:flex;align-items:center;justify-content:space-between;gap:10px;
      padding:calc(var(--safe-top, 12px)) 14px 10px;
      z-index:20;pointer-events:none;
    }
    .fr-topbar > *{pointer-events:auto}
    .fr-topbar--floating{
      position:absolute;top:0;left:0;right:0;
    }
    .fr-topbar--sticky{
      position:sticky;top:0;
      background:linear-gradient(180deg, rgba(7,7,11,.94) 72%, rgba(7,7,11,0));
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      padding-top:max(12px, env(safe-area-inset-top, 0px));
    }
    .fr-seg-pill{
      display:inline-flex;align-items:center;gap:2px;
      padding:4px;border-radius:999px;
      background:rgba(12,12,18,.72);
      border:1px solid rgba(255,255,255,.14);
      backdrop-filter:blur(16px);
      -webkit-backdrop-filter:blur(16px);
      box-shadow:0 8px 24px rgba(0,0,0,.32);
    }
    .fr-seg-btn{
      display:inline-flex;align-items:center;gap:6px;
      min-height:36px;padding:0 14px;border:0;border-radius:999px;
      background:transparent;color:#a5a5b8;
      font:600 .86rem/1 Inter,ui-sans-serif,system-ui,sans-serif;
      cursor:pointer;white-space:nowrap;
      transition:background .15s ease,color .15s ease;
    }
    .fr-seg-btn:hover{color:#fff}
    .fr-seg-btn:focus-visible{outline:2px solid #ffd36b;outline-offset:2px}
    .fr-seg-btn.active{
      background:rgba(255,255,255,.14);
      color:#fff;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.12);
    }
    .fr-seg-btn .fr-flame{color:#ff3e88;display:inline-flex}
    .fr-topbar-actions{
      display:flex;align-items:center;gap:8px;margin-left:auto;
    }
    .fr-icon-circle{
      position:relative;
      width:42px;height:42px;border-radius:999px;
      border:1px solid rgba(255,255,255,.15);
      background:rgba(12,12,18,.72);
      color:#f4f4fa;
      display:grid;place-items:center;
      backdrop-filter:blur(16px);
      -webkit-backdrop-filter:blur(16px);
      cursor:pointer;
      transition:background .14s ease,border-color .14s ease,transform .12s ease;
    }
    .fr-icon-circle:hover{background:rgba(32,32,44,.86);border-color:rgba(255,255,255,.28)}
    .fr-icon-circle:active{transform:scale(.95)}
    .fr-icon-circle:focus-visible{outline:2px solid #ffd36b;outline-offset:2px}
    .icon-badge{
      position:absolute;top:-3px;right:-3px;
      min-width:17px;height:17px;padding:0 4px;border-radius:999px;
      background:#ff3e88;color:#fff;
      font:700 10px/17px Inter,system-ui,sans-serif;text-align:center;
      box-shadow:0 2px 6px rgba(0,0,0,.45);
    }
    .icon-badge[hidden]{display:none}
  `;
}

export function renderFeedTopBar({ sticky = false } = {}) {
  return `<header class="fr-topbar ${sticky ? 'fr-topbar--sticky' : 'fr-topbar--floating'}">
    <div class="fr-seg-pill" role="group" aria-label="Sort feed">
      <button type="button" class="fr-seg-btn active" data-sort-tab="trending" aria-pressed="true"><span class="fr-flame">${ICONS.flame}</span>Trending</button>
      <button type="button" class="fr-seg-btn" data-sort-tab="score" aria-pressed="false">Top Scored</button>
    </div>
    <div class="fr-topbar-actions">
      <button type="button" class="fr-icon-circle" id="openFeedSearch" aria-label="Search tags" aria-haspopup="dialog">${ICONS.search}</button>
      <button type="button" class="fr-icon-circle" id="openFeedFilters" aria-label="Feed filters" aria-haspopup="dialog">${ICONS.sliders}<span class="icon-badge" data-filter-badge hidden></span></button>
    </div>
  </header>`;
}

export function renderToastStyles() {
  return `
    .fr-toast{
      position:fixed;left:50%;top:calc(max(16px, env(safe-area-inset-top, 0px)) + 58px);
      transform:translate(-50%, -8px);
      z-index:80;padding:9px 15px;border-radius:999px;
      background:rgba(16,16,24,.94);border:1px solid rgba(183,173,255,.35);
      color:#fff;font:600 .82rem/1.2 Inter,system-ui,sans-serif;
      box-shadow:0 12px 30px rgba(0,0,0,.48);
      opacity:0;pointer-events:none;
      transition:opacity .16s ease,transform .16s ease;
    }
    .fr-toast.show{opacity:1;transform:translate(-50%, 0)}
  `;
}
