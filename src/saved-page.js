import { clientAssetUrl } from './assets.js';
import { ICONS, renderBottomNav, renderBottomNavScript, renderBottomNavStyles, renderToastStyles } from './ui.js';

export function renderSavedPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Saved | FurryReel</title>
  <meta name="robots" content="noindex,nofollow" />
  <meta name="theme-color" content="#07070b" />
  <link rel="preconnect" href="https://static1.e621.net" />
  <link rel="modulepreload" href="${clientAssetUrl('saved-posts.js')}" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #06060a;
      --surface: #0d0d14;
      --card: #13131d;
      --text: #f7f7fb;
      --muted: #9b9bb0;
      --lavender: #b7adff;
      --pink: #ff3e88;
      --outline: rgba(255,255,255,.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top, #151424 0%, var(--bg) 48%);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100dvh;
    }
    button, input { font: inherit; }
    ${renderBottomNavStyles()}
    ${renderToastStyles()}
    .saved-frame {
      min-height: 100dvh;
      max-width: 1120px;
      margin: 0 auto;
      padding: max(16px, env(safe-area-inset-top, 0px)) 16px calc(92px + env(safe-area-inset-bottom, 0px));
    }
    .saved-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .saved-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .saved-title-group h1 {
      margin: 0;
      font-size: 1.45rem;
      letter-spacing: -0.02em;
    }
    .saved-count-pill {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(183,173,255,.14);
      border: 1px solid rgba(183,173,255,.32);
      color: var(--lavender);
      font-size: .78rem;
      font-weight: 700;
    }
    .saved-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 18px;
    }
    .saved-tabs {
      display: inline-flex;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      background: rgba(18,18,26,.85);
      border: 1px solid var(--outline);
    }
    .saved-tab {
      min-height: 36px;
      padding: 0 14px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--muted);
      font-weight: 600;
      font-size: .84rem;
      cursor: pointer;
    }
    .saved-tab.active {
      background: rgba(255,255,255,.14);
      color: #fff;
    }
    .saved-tab:focus-visible,
    .saved-btn:focus-visible,
    .saved-card:focus-visible,
    .saved-remove-btn:focus-visible {
      outline: 2px solid #ffd36b;
      outline-offset: 2px;
    }
    .saved-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .saved-btn {
      min-height: 38px;
      padding: 0 13px;
      border-radius: 11px;
      border: 1px solid var(--outline);
      background: rgba(20,20,30,.9);
      color: var(--text);
      font-size: .82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .saved-btn:hover { background: rgba(34,34,48,.95); border-color: rgba(255,255,255,.24); }
    .saved-btn--danger { color: #ff9cb8; border-color: rgba(255,62,136,.32); }
    .saved-btn--primary {
      background: linear-gradient(135deg, #ff3e88, #8c78ff);
      border-color: transparent;
      color: #fff;
    }
    .saved-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
      gap: 10px;
    }
    @media (min-width: 640px) {
      .saved-grid { grid-template-columns: repeat(auto-fill, minmax(192px, 1fr)); gap: 12px; }
    }
    .saved-card {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      background: var(--card);
      border: 1px solid var(--outline);
      aspect-ratio: 3 / 4;
      cursor: pointer;
      padding: 0;
      text-align: left;
      color: #fff;
      display: block;
    }
    .saved-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform .22s ease;
    }
    .saved-card:hover img { transform: scale(1.03); }
    .saved-card-grad {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,.38) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,.84) 100%);
      pointer-events: none;
    }
    .saved-kind-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(10,10,16,.76);
      border: 1px solid rgba(255,255,255,.16);
      font-size: .68rem;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--lavender);
      pointer-events: none;
    }
    .saved-remove-btn {
      position: absolute;
      top: 7px;
      right: 7px;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.18);
      background: rgba(10,10,16,.78);
      color: var(--pink);
      display: grid;
      place-items: center;
      cursor: pointer;
      z-index: 2;
    }
    .saved-remove-btn:hover { background: rgba(255,62,136,.22); }
    .saved-card-meta {
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 9px;
      pointer-events: none;
    }
    .saved-card-artist {
      font-size: .82rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .saved-card-sub {
      font-size: .72rem;
      color: #c6c6d8;
      margin-top: 2px;
    }
    .saved-empty {
      margin: 36px auto;
      max-width: 440px;
      text-align: center;
      padding: 32px 22px;
      border-radius: 22px;
      background: rgba(18,18,26,.85);
      border: 1px solid var(--outline);
    }
    .saved-empty[hidden] { display: none; }
    .saved-empty-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 14px;
      border-radius: 18px;
      background: rgba(183,173,255,.14);
      border: 1px solid rgba(183,173,255,.28);
      color: var(--lavender);
      display: grid;
      place-items: center;
    }
    .saved-empty h2 { margin: 0 0 8px; font-size: 1.15rem; }
    .saved-empty p { margin: 0 0 18px; color: var(--muted); font-size: .88rem; line-height: 1.5; }
    .saved-empty-cta { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
    .saved-privacy-note {
      margin-top: 22px;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(18,18,26,.65);
      border: 1px solid rgba(255,255,255,.08);
      color: var(--muted);
      font-size: .8rem;
      line-height: 1.45;
    }
    .saved-privacy-note a { color: var(--lavender); }
    dialog.saved-viewer {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      background: rgba(4,4,8,.96);
      color: #fff;
      overflow: hidden;
    }
    dialog.saved-viewer::backdrop { background: rgba(0,0,0,.92); }
    .saved-viewer-shell {
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
    .saved-viewer-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: max(12px, env(safe-area-inset-top, 0px)) 14px 10px;
      background: linear-gradient(180deg, rgba(6,6,10,.9), transparent);
      z-index: 3;
    }
    .saved-viewer-stage {
      position: relative;
      display: grid;
      place-items: center;
      min-height: 0;
      overflow: auto;
      padding: 8px 14px;
    }
    .saved-viewer-stage img,
    .saved-viewer-stage video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 12px;
      background: #000;
    }
    .saved-viewer-bottom {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px max(16px, env(safe-area-inset-bottom, 0px));
      background: linear-gradient(0deg, rgba(6,6,10,.95), rgba(6,6,10,.7));
      border-top: 1px solid rgba(255,255,255,.08);
    }
    .saved-viewer-meta { min-width: 0; }
    .saved-viewer-meta strong { display: block; font-size: .95rem; }
    .saved-viewer-meta span { color: var(--muted); font-size: .8rem; }
  </style>
</head>
<body>
  <main class="saved-frame">
    <header class="saved-header">
      <div class="saved-title-group">
        <h1>Saved</h1>
        <span class="saved-count-pill" id="savedCountPill">0 saved</span>
      </div>
      <div class="saved-actions">
        <button type="button" class="saved-btn" id="exportSavedBtn">Export JSON</button>
        <button type="button" class="saved-btn" id="importSavedBtn">Import JSON</button>
        <input type="file" id="importSavedInput" accept=".json,application/json" hidden />
        <button type="button" class="saved-btn saved-btn--danger" id="clearSavedBtn" hidden>Clear all</button>
      </div>
    </header>

    <div class="saved-toolbar">
      <div class="saved-tabs" role="tablist" aria-label="Filter saved posts">
        <button type="button" class="saved-tab active" data-saved-filter="" aria-selected="true">All</button>
        <button type="button" class="saved-tab" data-saved-filter="reel" aria-selected="false">Reels</button>
        <button type="button" class="saved-tab" data-saved-filter="photo" aria-selected="false">Photos</button>
      </div>
    </div>

    <section class="saved-grid" id="savedGrid" aria-label="Saved posts"></section>

    <section class="saved-empty" id="savedEmpty" hidden>
      <div class="saved-empty-icon">${ICONS.bookmarkOutline}</div>
      <h2 id="savedEmptyTitle">No saved posts yet</h2>
      <p id="savedEmptyText">Tap the bookmark button on any Reel or Photo to keep it here. Saved posts stay strictly in this browser's local storage and are never sent to a server.</p>
      <div class="saved-empty-cta">
        <a class="saved-btn saved-btn--primary" href="/" data-page-nav>Browse Reels</a>
        <a class="saved-btn" href="/photos" data-page-nav>Browse Photos</a>
      </div>
    </section>

    <p class="saved-privacy-note">
      <strong>Private by design:</strong> Saved posts are stored only on your device in browser local storage (never in HTTP cookies and never uploaded to FurryReel servers). Use Export JSON to back up or move your list between devices. <a href="/privacy" data-page-nav>Privacy policy</a>.
    </p>
  </main>

  <dialog class="saved-viewer" id="savedViewer" aria-label="Saved post viewer">
    <div class="saved-viewer-shell">
      <div class="saved-viewer-top">
        <div style="display:flex;gap:8px">
          <button type="button" class="saved-btn" id="viewerPrev">Prev</button>
          <button type="button" class="saved-btn" id="viewerNext">Next</button>
        </div>
        <button type="button" class="saved-btn" id="viewerClose">Close</button>
      </div>
      <div class="saved-viewer-stage" id="viewerStage"></div>
      <div class="saved-viewer-bottom">
        <div class="saved-viewer-meta">
          <strong id="viewerArtist"></strong>
          <span id="viewerSub"></span>
        </div>
        <div class="saved-actions">
          <a class="saved-btn" id="viewerSourceLink" target="_blank" rel="noreferrer noopener">View on e621 ${ICONS.externalLink}</a>
          <button type="button" class="saved-btn" id="viewerShareBtn">Share</button>
          <button type="button" class="saved-btn saved-btn--danger" id="viewerRemoveBtn">Remove</button>
        </div>
      </div>
    </div>
  </dialog>

  <div class="fr-toast" id="frToast" role="status" aria-live="polite"></div>
  ${renderBottomNav('saved')}
  <script>${renderBottomNavScript()}</script>
  <script type="module">
    import { getSavedStore } from '${clientAssetUrl('saved-posts.js')}';

    const store = getSavedStore();
    const grid = document.getElementById('savedGrid');
    const emptyBox = document.getElementById('savedEmpty');
    const emptyTitle = document.getElementById('savedEmptyTitle');
    const emptyText = document.getElementById('savedEmptyText');
    const countPill = document.getElementById('savedCountPill');
    const clearBtn = document.getElementById('clearSavedBtn');
    const exportBtn = document.getElementById('exportSavedBtn');
    const importBtn = document.getElementById('importSavedBtn');
    const importInput = document.getElementById('importSavedInput');
    const tabs = [...document.querySelectorAll('[data-saved-filter]')];
    const viewer = document.getElementById('savedViewer');
    const viewerStage = document.getElementById('viewerStage');
    const viewerArtist = document.getElementById('viewerArtist');
    const viewerSub = document.getElementById('viewerSub');
    const viewerSourceLink = document.getElementById('viewerSourceLink');
    const viewerPrev = document.getElementById('viewerPrev');
    const viewerNext = document.getElementById('viewerNext');
    const viewerClose = document.getElementById('viewerClose');
    const viewerShareBtn = document.getElementById('viewerShareBtn');
    const viewerRemoveBtn = document.getElementById('viewerRemoveBtn');
    const toast = document.getElementById('frToast');

    let activeFilter = '';
    let visibleItems = [];
    let viewerIndex = -1;
    let toastTimer = null;

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function notifyBadge() {
      window.dispatchEvent(new CustomEvent('fr:saved-changed'));
    }

    function renderGrid() {
      const allCount = store.count();
      visibleItems = store.list(activeFilter);
      countPill.textContent = allCount + (allCount === 1 ? ' saved' : ' saved');
      clearBtn.hidden = allCount === 0;
      exportBtn.disabled = allCount === 0;

      grid.replaceChildren();
      if (!visibleItems.length) {
        emptyBox.hidden = false;
        if (allCount > 0) {
          emptyTitle.textContent = activeFilter === 'reel' ? 'No saved reels' : 'No saved photos';
          emptyText.textContent = 'Switch to All to see your other saved items, or bookmark more while browsing.';
        } else {
          emptyTitle.textContent = 'No saved posts yet';
          emptyText.textContent = "Tap the bookmark button on any Reel or Photo to keep it here. Saved posts stay strictly in this browser's local storage and are never sent to a server.";
        }
        return;
      }
      emptyBox.hidden = true;

      const frag = document.createDocumentFragment();
      visibleItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'saved-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Open saved post #' + item.id);

        const img = document.createElement('img');
        img.loading = index < 8 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.alt = item.artistText ? 'Artwork by ' + item.artistText : 'Saved post #' + item.id;
        const candidates = [...new Set([item.previewUrl, item.sampleUrl, item.type === 'image' ? item.mediaUrl : ''].filter(Boolean))];
        let candIdx = 0;
        img.addEventListener('error', () => {
          candIdx += 1;
          if (candIdx < candidates.length) {
            img.src = candidates[candIdx];
          } else {
            img.remove();
            const ph = document.createElement('div');
            ph.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;color:#7d7d96;font-size:.76rem;padding:12px;text-align:center';
            ph.textContent = 'Preview unavailable';
            card.insertBefore(ph, grad);
          }
        });
        img.src = candidates[0] || '';

        const grad = document.createElement('div');
        grad.className = 'saved-card-grad';

        const badge = document.createElement('span');
        badge.className = 'saved-kind-badge';
        badge.textContent = item.type === 'video' ? 'Video' : (item.ext === 'gif' ? 'GIF' : 'Photo');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'saved-remove-btn';
        removeBtn.setAttribute('aria-label', 'Remove post #' + item.id + ' from Saved');
        removeBtn.innerHTML = ${JSON.stringify(ICONS.bookmarkFilled)};
        removeBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          store.remove(item.id);
          notifyBadge();
          showToast('Removed from Saved');
          renderGrid();
        });

        const meta = document.createElement('div');
        meta.className = 'saved-card-meta';
        const artist = document.createElement('div');
        artist.className = 'saved-card-artist';
        artist.textContent = item.artistText ? '@' + item.artistText.split(',')[0].trim() : 'Post #' + item.id;
        const sub = document.createElement('div');
        sub.className = 'saved-card-sub';
        sub.textContent = [item.ext ? item.ext.toUpperCase() : '', item.score !== null ? '♥ ' + item.score : ''].filter(Boolean).join(' • ');
        meta.append(artist, sub);

        card.append(img, grad, badge, removeBtn, meta);
        card.addEventListener('click', () => openViewer(index));
        card.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openViewer(index);
          }
        });
        frag.appendChild(card);
      });
      grid.appendChild(frag);
    }

    function openViewer(index) {
      if (index < 0 || index >= visibleItems.length) return;
      viewerIndex = index;
      const item = visibleItems[index];
      viewerStage.replaceChildren();
      if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.mediaUrl;
        video.poster = item.previewUrl || '';
        video.controls = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        try {
          const settings = JSON.parse(localStorage.getItem('fr_settings_v1') || '{}');
          video.muted = settings?.reels?.muted !== false;
        } catch {
          video.muted = true;
        }
        viewerStage.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = item.sampleUrl || item.mediaUrl || item.previewUrl;
        img.alt = item.artistText ? 'Artwork by ' + item.artistText : 'Saved post #' + item.id;
        viewerStage.appendChild(img);
      }
      viewerArtist.textContent = item.artistText ? '@' + item.artistText : 'Post #' + item.id;
      viewerSub.textContent = [
        item.kind === 'reel' ? 'Reel' : 'Photo',
        item.width && item.height ? item.width + '×' + item.height : '',
        item.score !== null ? 'Score ' + item.score : '',
      ].filter(Boolean).join(' • ');
      viewerSourceLink.href = item.sourceUrl;
      viewerPrev.disabled = index <= 0;
      viewerNext.disabled = index >= visibleItems.length - 1;
      if (!viewer.open) viewer.showModal();
    }

    function closeViewer() {
      const video = viewerStage.querySelector('video');
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
      viewerStage.replaceChildren();
      if (viewer.open) viewer.close();
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        activeFilter = tab.getAttribute('data-saved-filter') || '';
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('active', active);
          t.setAttribute('aria-selected', String(active));
        });
        renderGrid();
      });
    });

    viewerClose.addEventListener('click', closeViewer);
    viewer.addEventListener('cancel', (event) => { event.preventDefault(); closeViewer(); });
    viewerPrev.addEventListener('click', () => openViewer(viewerIndex - 1));
    viewerNext.addEventListener('click', () => openViewer(viewerIndex + 1));
    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' && viewerIndex > 0) openViewer(viewerIndex - 1);
      else if (event.key === 'ArrowRight' && viewerIndex < visibleItems.length - 1) openViewer(viewerIndex + 1);
    });

    viewerShareBtn.addEventListener('click', async () => {
      const item = visibleItems[viewerIndex];
      if (!item) return;
      try {
        if (navigator.share) {
          await navigator.share({ title: 'FurryReel post #' + item.id, url: item.sourceUrl });
          return;
        }
        await navigator.clipboard.writeText(item.sourceUrl);
        showToast('Post link copied');
      } catch {
        showToast('Could not copy link');
      }
    });

    viewerRemoveBtn.addEventListener('click', () => {
      const item = visibleItems[viewerIndex];
      if (!item) return;
      store.remove(item.id);
      notifyBadge();
      showToast('Removed from Saved');
      renderGrid();
      if (!visibleItems.length) {
        closeViewer();
      } else {
        openViewer(Math.min(viewerIndex, visibleItems.length - 1));
      }
    });

    clearBtn.addEventListener('click', () => {
      if (!window.confirm('Clear all saved posts from this browser?')) return;
      store.clear();
      notifyBadge();
      showToast('Cleared all saved posts');
      renderGrid();
    });

    exportBtn.addEventListener('click', () => {
      const blob = new Blob([store.exportJson()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'furryreel-saved.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Exported saved list');
    });

    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      importInput.value = '';
      if (!file) return;
      const text = await file.text();
      const res = store.importJson(text);
      if (!res.ok) {
        showToast(res.error || 'Import failed');
        return;
      }
      notifyBadge();
      renderGrid();
      showToast('Imported ' + res.added + ' item' + (res.added === 1 ? '' : 's'));
    });

    store.subscribe(() => {
      notifyBadge();
      renderGrid();
    });

    renderGrid();
  </script>
</body>
</html>`;
}
