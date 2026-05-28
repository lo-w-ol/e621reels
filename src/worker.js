import { handlePosts, handleTagAutocomplete } from './api.js';
import { formatTagLabel, escapeHtml, serializeJsonLd, sanitizeTags, sanitizeRating, sanitizeRatioFilter, htmlHeaders } from './utils.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/api/posts') {
      return handlePosts(request, url);
    }

    if (url.pathname === '/api/tags/autocomplete') {
      return handleTagAutocomplete(request, url);
    }

    if (url.pathname === '/robots.txt') {
      return new Response(renderRobotsTxt(), {
        headers: {
          'content-type': 'text/plain; charset=UTF-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    if (url.pathname === '/sitemap.xml') {
      return new Response(renderSitemapXml(), {
        headers: {
          'content-type': 'application/xml; charset=UTF-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    if (url.pathname === '/photos') {
      return new Response(renderPhotoGridPage(url), {
        headers: htmlHeaders(),
      });
    }

    if (url.pathname === '/settings') {
      return new Response(renderSettingsPage(url), {
        headers: htmlHeaders(),
      });
    }

    if (url.pathname === '/about') {
      return new Response(renderAboutPage(), {
        headers: htmlHeaders(),
      });
    }

    if (url.pathname === '/privacy') {
      return new Response(renderPrivacyPage(), {
        headers: htmlHeaders(),
      });
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(renderApp(url), {
        headers: htmlHeaders(),
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

function renderApp(url) {
  const seo = buildSeo(url);
  const landingLinks = buildLandingLinks();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="FurryReel" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />
    <meta property="og:image" content="https://furryreel.com/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="theme-color" content="#080808" />
    <script type="application/ld+json">${serializeJsonLd(seo.structuredData)}</script>
    <style>
      :root {
        color-scheme: dark;
        --bg: #080808;
        --panel: rgba(20, 20, 24, 0.82);
        --panel-strong: rgba(15, 15, 20, 0.94);
        --text: #f6f6f6;
        --muted: #b6b6c2;
        --accent: #ff2f78;
        --accent-soft: rgba(255, 47, 120, 0.18);
        --outline: rgba(255,255,255,0.12);
        --safe-top: max(18px, env(safe-area-inset-top));
        --safe-bottom: max(24px, env(safe-area-inset-bottom));
        --app-height: 100dvh;
      }
      @supports not (height: 100dvh) {
        :root {
          --app-height: 100vh;
        }
      }
      * { box-sizing: border-box; }
      html, body {
        overscroll-behavior: none;
      }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background: radial-gradient(circle at top, #171727 0%, var(--bg) 48%);
        color: var(--text);
        min-height: 100vh;
      }
      button, input, select {
        font: inherit;
      }
      .fr-nav-fallback{position:fixed;top:8px;left:8px;right:8px;display:flex;gap:8px;flex-wrap:wrap;z-index:55;padding:8px;border-radius:10px;background:rgba(12,12,18,.92);border:1px solid rgba(255,255,255,.18)}.fr-nav-fallback a{color:#fff;text-decoration:none;padding:8px 10px;border-radius:8px}.fr-nav-fallback a[aria-current="page"]{background:rgba(255,47,120,.2)}
      .shell {
        min-height: var(--app-height);
        display: grid;
        place-items: center;
        padding: 20px;
      }
      .app {
        width: min(100%, 1240px);
        height: min(calc(var(--app-height) - 40px), 960px);
        border: 1px solid var(--outline);
        border-radius: 32px;
        overflow: hidden;
        position: relative;
        background: #000;
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.45);
        touch-action: none;
      }
      .viewport {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: #000;
      }
      .reel-track {
        position: absolute;
        inset: 0;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
      .reel-track.animating {
        transition: transform 320ms cubic-bezier(.22, .61, .36, 1);
      }
      .reel-slide {
        position: absolute;
        inset: 0;
        background: #000;
        overflow: hidden;
      }
      .reel-slide.placeholder {
        display: grid;
        place-items: center;
        color: var(--muted);
        font-size: 0.95rem;
      }
      .reel-slide::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: var(--preview-image, none);
        background-size: cover;
        background-position: center;
        filter: blur(28px) saturate(0.9);
        transform: scale(1.08);
        opacity: 0.55;
      }
      .reel-media,
      .reel-media-fallback {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background: #000;
      }
      .reel-media {
        object-fit: cover;
      }
      .reel-media.fit {
        object-fit: contain;
      }
      .reel-media-fallback {
        background-size: cover;
        background-position: center;
        opacity: 0;
        transition: opacity 180ms ease;
      }
      .reel-slide.loading .reel-media-fallback,
      .reel-slide.awaiting-play .reel-media-fallback {
        opacity: 0.92;
      }
      .load-indicator {
        position: absolute;
        left: 50%;
        bottom: calc(var(--safe-bottom) + 108px);
        transform: translateX(-50%);
        z-index: 3;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 11px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.62);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.92);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        opacity: 0;
        transition: opacity 120ms linear;
        pointer-events: none;
      }
      .reel-slide.loading .load-indicator,
      .reel-slide.awaiting-play .load-indicator {
        opacity: 1;
      }
      .load-indicator-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.95);
        animation: reelPulse 0.85s ease-in-out infinite alternate;
      }
      @keyframes reelPulse {
        from { transform: scale(0.72); opacity: 0.5; }
        to { transform: scale(1.02); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .load-indicator-dot {
          animation: none;
        }
      }
      .gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.68) 0%, rgba(0, 0, 0, 0.08) 24%, rgba(0, 0, 0, 0.1) 60%, rgba(0, 0, 0, 0.86) 100%);
        pointer-events: none;
      }
      .overlay {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-rows: 1fr auto;
        padding: calc(var(--safe-top) + 70px) 16px var(--safe-bottom);
        z-index: 2;
        pointer-events: none;
      }
      .overlay > * {
        pointer-events: auto;
      }
      .global-header{position:absolute;top:0;right:0;z-index:25;padding:calc(var(--safe-top) + 8px) 16px 8px}.global-menu-toggle{border:1px solid rgba(255,255,255,.16);background:rgba(12,12,16,.66);color:#fff;border-radius:10px;width:42px;height:42px;display:grid;place-items:center;cursor:pointer}.global-drawer{position:absolute;right:0;top:0;bottom:0;width:min(80vw,290px);display:grid;gap:6px;padding:82px 12px 20px;background:#141418;border-left:1px solid rgba(255,255,255,.18);transform:translateX(110%);transition:transform .22s ease;z-index:30}.global-drawer.open{transform:translateX(0)}.global-drawer a{color:#fff;text-decoration:none;padding:10px 12px;border-radius:10px}.global-drawer a:hover{background:rgba(255,255,255,.08)}.topbar,
      .status-card,
      .jump,
      .pill-row,
      .settings-toggle,
      .filter-panel,
      .app-header,
      .burger-menu,
      .progress,
      .tagline {
        display: none !important;
      }
      .brand h1 {
        margin: 0;
        font-size: 1.2rem;
      }
      .brand p,
      .status,
      .empty,
      .meta p,
      .hint,
      .side-label,
      .filter-panel label span,
      .field-help,
      .tagline,
      .counter,
      .swipe-hint,
      .autocomplete-meta,
      .autocomplete-empty {
        color: var(--muted);
      }
      .badge-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
        padding-left: 8px;
      }
      .badge,
      .pill,
      .counter,
      .swipe-hint {
        border: 1px solid var(--outline);
        background: rgba(8, 8, 12, 0.5);
        backdrop-filter: blur(18px);
        border-radius: 999px;
        padding: 8px 12px;
      }
      .status-card {
        align-self: center;
        justify-self: center;
        max-width: 80%;
        text-align: center;
        background: var(--panel);
        border: 1px solid var(--outline);
        border-radius: 24px;
        padding: 18px 20px;
        backdrop-filter: blur(18px);
        z-index: 3;
      }
      .bottom {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        align-items: end;
      }
      .meta {
        display: grid;
        gap: 10px;
        min-width: 0;
      }
      .meta h2 {
        display: none;
      }
      .meta p {
        margin: 0;
        line-height: 1.4;
      }
      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .pill {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .side-actions {
        display: flex;
        gap: 8px;
        justify-items: center;
      }
      .credit {
        font-size: .95rem;
        background: rgba(8,8,12,.5);
        border: 1px solid var(--outline);
        border-radius: 999px;
        padding: 9px 14px;
        backdrop-filter: blur(16px);
      }
      .privacy-note{margin:8px 0 0;color:var(--muted);font-size:.78rem;}
      .privacy-note a{color:#fff}.ux-chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.ux-chip{border:1px solid var(--outline);background:rgba(8,8,12,.5);color:var(--text);border-radius:999px;padding:8px 12px;font-size:.78rem;min-height:40px}.ux-chip.selected{background:var(--accent-soft);border-color:rgba(255,47,120,.5)}.ux-notice{margin-top:10px;padding:10px 12px;border:1px solid var(--outline);border-radius:12px;background:rgba(8,8,12,.45);font-size:.8rem;line-height:1.4}.ux-notice[hidden]{display:none}.onboarding{position:absolute;inset:auto 12px calc(var(--safe-bottom) + 72px);z-index:20;border:1px solid var(--outline);background:rgba(11,11,15,.9);border-radius:14px;padding:12px;backdrop-filter:blur(14px)}.onboarding[hidden]{display:none}.onboarding h3{margin:0 0 6px;font-size:.95rem}.onboarding p{margin:0;font-size:.82rem;color:var(--muted);line-height:1.35}.onboarding-actions{display:flex;justify-content:flex-end;margin-top:10px}.focus-ring:focus-visible,.action-button:focus-visible,.global-menu-toggle:focus-visible{outline:2px solid #ffd36b;outline-offset:2px}
      .credit a { color: #fff; }
      .scrub-hud {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 12;
        min-width: 220px;
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(0,0,0,.72);
        border: 1px solid rgba(255,255,255,.26);
        opacity: 0;
        pointer-events: none;
        transition: opacity .12s linear;
      }
      .scrub-hud.show { opacity: 1; }
      .scrub-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,.18); overflow: hidden; margin-top: 8px; }
      .scrub-bar > div { height: 100%; width: 0; background: linear-gradient(90deg, #ff59a0 0%, #ffd36b 100%); }
      .action-button {
        width: 54px;
        height: 54px;
        border-radius: 999px;
        border: 1px solid var(--outline);
        background: var(--panel);
        color: var(--text);
        display: grid;
        place-items: center;
        backdrop-filter: blur(20px);
        cursor: pointer;
      }
      .settings-button {
        width: 38px;
        height: 38px;
        background: rgba(10, 10, 14, 0.18);
        border-color: rgba(255,255,255,0.18);
        opacity: 0.42;
        transition: opacity 140ms ease, background 140ms ease;
      }
      .settings-button:hover,
      .settings-button:focus-visible,
      .settings-button.active {
        opacity: 1;
        background: rgba(14, 14, 18, 0.62);
      }
      .side-label {
        font-size: 0.74rem;
      }
      .progress {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(255,255,255,0.08);
        z-index: 4;
      }
      .progress > div {
        height: 100%;
        width: 0;
        background: linear-gradient(90deg, #ff59a0 0%, #ffd36b 100%);
        transition: width 100ms linear;
      }
      .settings-toggle {
        position: absolute;
        right: 16px;
        top: calc(var(--safe-top) + 58px);
        z-index: 5;
      }
      .filter-panel {
        position: absolute;
        top: 74px;
        right: 12px;
        left: 12px;
        z-index: 6;
        border: 1px solid var(--outline);
        background: var(--panel-strong);
        backdrop-filter: blur(24px);
        border-radius: 24px;
        padding: 18px;
        display: grid;
        gap: 14px;
        transform: translateY(-12px) scale(0.98);
        opacity: 0;
        pointer-events: none;
        transition: opacity 140ms ease, transform 180ms ease;
      }
      .filter-panel.open {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: auto;
      }
      .filter-panel h3 {
        margin: 0 0 4px;
      }
      .filter-panel label {
        display: grid;
        gap: 8px;
      }
      .filter-panel input,
      .filter-panel select,
      .filter-panel button {
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.06);
        color: var(--text);
        border-radius: 14px;
        padding: 12px 14px;
      }
      .filter-panel input::placeholder {
        color: rgba(255,255,255,0.42);
      }
      .settings-option {
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 12px;
      }
      .settings-option input {
        width: 20px;
        height: 20px;
        padding: 0;
      }
      .filter-actions,
      .jump {
        display: flex;
        gap: 10px;
      }
      .filter-actions > *,
      .jump > * {
        flex: 1;
      }
      .primary,
      .secondary {
        cursor: pointer;
      }
      .primary {
        background: linear-gradient(135deg, #ff4d98 0%, #ff7b4d 100%);
        border: none;
      }
      .secondary {
        background: rgba(255,255,255,0.08);
      }
      .meta.hidden-tags #tagList {
        display: none;
      }
      .field-help,
      .hint {
        font-size: 0.87rem;
        line-height: 1.45;
      }
      .input-with-autocomplete {
        position: relative;
      }
      .autocomplete {
        position: absolute;
        left: 0;
        right: 0;
        top: calc(100% + 8px);
        z-index: 7;
        border: 1px solid var(--outline);
        border-radius: 16px;
        background: rgba(10, 10, 14, 0.96);
        backdrop-filter: blur(18px);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
        overflow: hidden;
      }
      .autocomplete[hidden] {
        display: none;
      }
      .autocomplete-list {
        display: grid;
      }
      .autocomplete-option,
      .autocomplete-empty {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 10px;
        align-items: center;
        width: 100%;
        padding: 12px 14px;
        border: 0;
        border-top: 1px solid rgba(255,255,255,0.06);
        background: transparent;
        color: var(--text);
        text-align: left;
      }
      .autocomplete-option:first-child,
      .autocomplete-empty:first-child {
        border-top: 0;
      }
      .autocomplete-option.active,
      .autocomplete-option:hover,
      .autocomplete-option:focus-visible {
        background: rgba(255,255,255,0.08);
        outline: none;
      }
      .autocomplete-tag {
        overflow: hidden;
      }
      .autocomplete-name {
        font-weight: 600;
      }
      .autocomplete-meta {
        font-size: 0.78rem;
        margin-top: 2px;
      }
      .autocomplete-empty {
        grid-template-columns: 1fr;
      }
      .autocomplete-category {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #666;
      }
      .autocomplete-category[data-category="0"] { background: #b9b9b9; }
      .autocomplete-category[data-category="1"] { background: #e7c94e; }
      .autocomplete-category[data-category="3"] { background: #53b45e; }
      .autocomplete-category[data-category="4"] { background: #f28b51; }
      .autocomplete-category[data-category="5"] { background: #5f9bff; }
      .autocomplete-category[data-category="6"] { background: #b36df6; }
      .autocomplete-count {
        font-size: 0.78rem;
        color: var(--muted);
        white-space: nowrap;
      }
      .pill-button {
        cursor: pointer;
      }
      .pill-button:hover,
      .pill-button:focus-visible {
        border-color: rgba(255,255,255,0.28);
        background: rgba(255,255,255,0.12);
        outline: none;
      }
      .pill-button.active {
        background: var(--accent-soft);
        border-color: rgba(255, 47, 120, 0.48);
      }
      .seo-content {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .app-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
        height: calc(var(--safe-top) + 58px);
        display: flex;
        align-items: flex-end;
        gap: 10px;
        padding: 10px 14px 10px;
        background: linear-gradient(180deg, rgba(8,8,10,.96), rgba(8,8,10,.62));
        border-bottom: 1px solid rgba(255,255,255,0.08);
        backdrop-filter: blur(14px);
      }
      .frame-pill {
        font-size: .82rem;
        border: 1px solid var(--outline);
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        padding: 7px 12px;
      }
      .app-header-title { font-weight: 700; letter-spacing: .01em; }
      .nav-toggle { z-index: 12; }
      .burger-menu {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: min(80vw, 290px);
        z-index: 11;
        border-right: 1px solid var(--outline);
        background: rgba(12, 12, 16, 0.98);
        padding: calc(var(--safe-top) + 74px) 12px 18px;
        display: grid;
        gap: 6px;
        transform: translateX(-110%);
        transition: transform 220ms ease;
      }
      .burger-menu.open { transform: translateX(0); }
      .burger-menu a {
        color: var(--text);
        text-decoration: none;
        padding: 8px 10px;
        border-radius: 10px;
      }
      .burger-menu a:hover { background: rgba(255,255,255,0.08); }
      @media (orientation: landscape) and (max-width: 960px) {
        .shell {
          padding: 0;
        }
        .app {
          width: 100vw;
          height: var(--app-height);
          border-radius: 0;
          border: none;
        }
        .overlay {
          padding-left: max(14px, env(safe-area-inset-left));
          padding-right: max(14px, env(safe-area-inset-right));
        }
      }
      @media (max-width: 640px) {
        .shell {
          padding: 0;
        }
        .app {
          width: 100%;
          height: var(--app-height);
          border-radius: 0;
          border: none;
        }
      }
    </style>
  </head>
  <body>
    ${renderFloatingNav('reels')}
    <div class="shell">
      <section class="seo-content" aria-hidden="true">
        <h1>${escapeHtml(seo.heading)}</h1>
        <p>${escapeHtml(seo.description)}</p>
        <p>${escapeHtml(seo.indexingText)}</p>
        <ul>${landingLinks}</ul>
      </section>
      <main class="app" id="appRoot">
        <div class="viewport" id="viewport">
          <div class="reel-track" id="reelTrack"></div>
        </div>
        <div class="gradient"></div>
        <div class="scrub-hud" id="scrubHud" aria-live="polite">
          <div id="scrubTime">0:00 / 0:00</div>
          <div class="scrub-bar"><div id="scrubBar"></div></div>
        </div>
        <section class="overlay">
          <div class="bottom">
            <div class="meta" id="metaBlock">
              <div class="credit" id="postDescription">Artist: Unknown artist • <a id="openPostLink" href="https://e621.net" target="_blank" rel="noreferrer">View post</a></div>
            </div>
            <p class="privacy-note" id="privacyUrlNotice">Filters may appear in your URL/history. <a href="/privacy" data-page-nav>Privacy</a>.</p>
            <div class="side-actions">
              <button class="action-button focus-ring" id="toggleMuteButton" type="button" aria-label="Unmute video audio">🔇</button>
            </div>
          </div>
        </section>
        <aside class="onboarding" id="onboardingGuide" hidden><h3>Quick controls</h3><p>Swipe up/down for next reel, drag sideways on video to scrub, tap mute, and use the menu to switch pages.</p><div class="onboarding-actions"><button class="ux-chip focus-ring" id="dismissOnboarding" type="button" aria-label="Dismiss quick controls guide">Got it</button></div></aside>
        <div hidden aria-hidden="true">
          <div id="statusCard"><strong id="statusTitle"></strong><p id="statusText"></p></div>
          <div id="postTitle"></div><div id="tagList"></div><div id="sortBadge"></div><div id="ratioBadge"></div><div id="counterBadge"></div>
          <div id="progressBar"></div><button id="nextButton" type="button"></button><button id="previousButton" type="button"></button>
          <select id="modeSelect"><option value="trending">trending</option><option value="score">score</option></select>
          <input id="tagsInput" /><select id="ratingSelect"><option value=""></option><option value="s">s</option><option value="q">q</option><option value="e">e</option></select>
          <form id="filterPanel"></form><button id="toggleFiltersButton" type="button"></button><button id="resetButton" type="button"></button>
          <select id="mediaDisplaySelect"><option value="contain">contain</option><option value="fullscreen">fullscreen</option></select>
          <select id="ratioSelect"><option value=""></option><option value="vertical">vertical</option><option value="landscape">landscape</option></select>
          <input id="hideTagsToggle" type="checkbox" /><div id="tagAutocomplete"></div><div id="tagAutocompleteList"></div>
          <button id="navToggleButton" type="button"></button><nav id="burgerMenu"></nav>
        </div>
      </main>
    </div>

    <noscript>
      <section style="padding:24px;max-width:960px;margin:0 auto;color:#f6f6f6">
        <h2>Browse FurryReel without JavaScript</h2>
        <p>${escapeHtml(seo.description)}</p>
        <ul>${landingLinks}</ul>
      </section>
    </noscript>

    <script>${renderFloatingNavScript()}</script>
    <script>
      const CLIENT_E621_API = 'https://e621.net/posts.json';
      const CLIENT_E621_TAG_AUTOCOMPLETE_API = 'https://e621.net/tags/autocomplete.json';
      const CLIENT_SUPPORTED_MEDIA = new Set(['webm', 'mp4', 'gif']);
      const SWIPE_THRESHOLD = 90;
      const DRAG_LOCK_THRESHOLD = 12;
      const TAP_DISTANCE_THRESHOLD = 10;
      const WHEEL_THRESHOLD = 8;
      const PRELOAD_DISTANCE = 2;
      const IMAGE_COUNTDOWN_MS = 10000;
      const MIN_VIDEO_PLAYBACK_MS = 10000;
      const TRACK_TRANSITION_MS = 320;
      const TRACK_TRANSITION_FALLBACK_MS = TRACK_TRANSITION_MS + 120;
      const TAG_AUTOCOMPLETE_LIMIT = 8;
      const AUTOCOMPLETE_DEBOUNCE_MS = 160;
      const INITIAL_MODE = ${JSON.stringify(seo.initialModeForClient)};
      const INITIAL_TAGS = ${JSON.stringify(seo.initialTagsForClient)};
      const INITIAL_RATING = ${JSON.stringify(seo.initialRatingForClient)};
      const INITIAL_RATIO = ${JSON.stringify(seo.initialRatioForClient)};

      const bootSettings = mergeUrlParamsIntoSettings(loadSettings(), new URL(window.location.href));
      saveSettings(bootSettings);
      const state = {
        posts: [],
        currentIndex: 0,
        nextPage: 1,
        loading: false,
        mode: bootSettings.shared.sort || INITIAL_MODE,
        tags: bootSettings.shared.tags || INITIAL_TAGS,
        rating: bootSettings.shared.rating || INITIAL_RATING,
        ratio: bootSettings.shared.ratio || INITIAL_RATIO,
        muted: bootSettings.reels.muted !== false,
        timer: null,
        progressTimer: null,
        animationLock: false,
        fitMedia: bootSettings.reels.fitMedia !== false,
        hideTags: true,
        touchActive: false,
        gesturePointerId: null,
        gestureSource: null,
        dragLocked: false,
        pointerStartY: 0,
        pointerStartX: 0,
        pointerDeltaY: 0,
        pointerDeltaX: 0,
        horizontalScrubbing: false,
        scrubStartTime: 0,
        currentMedia: null,
        currentSlide: null,
        navigationToken: 0,
        preloaded: new Map(),
        lastFeedSource: 'worker',
        suppressClickUntil: 0,
        videoPlayback: new WeakMap(),
        tagAutocomplete: {
          items: [],
          activeIndex: -1,
          open: false,
          requestId: 0,
          debounceTimer: null,
          query: '',
        },
      };

      const appRoot = document.getElementById('appRoot');
      const viewport = document.getElementById('viewport');
      const reelTrack = document.getElementById('reelTrack');
      const metaBlock = document.getElementById('metaBlock');
      const postTitle = document.getElementById('postTitle');
      const postDescription = document.getElementById('postDescription');
      const statusCard = document.getElementById('statusCard');
      const statusTitle = document.getElementById('statusTitle');
      const statusText = document.getElementById('statusText');
      const tagList = document.getElementById('tagList');
      const nextButton = document.getElementById('nextButton');
      const previousButton = document.getElementById('previousButton');
      const sortBadge = document.getElementById('sortBadge');
      const ratioBadge = document.getElementById('ratioBadge');
      const counterBadge = document.getElementById('counterBadge');
      const progressBar = document.getElementById('progressBar');
      const openPostLink = document.getElementById('openPostLink');
      const modeSelect = document.getElementById('modeSelect');
      const tagsInput = document.getElementById('tagsInput');
      const ratingSelect = document.getElementById('ratingSelect');
      const filterPanel = document.getElementById('filterPanel');
      const toggleFiltersButton = document.getElementById('toggleFiltersButton');
      const resetButton = document.getElementById('resetButton');
      const toggleMuteButton = document.getElementById('toggleMuteButton');
      const mediaDisplaySelect = document.getElementById('mediaDisplaySelect');
      const ratioSelect = document.getElementById('ratioSelect');
      const hideTagsToggle = document.getElementById('hideTagsToggle');
      const tagAutocomplete = document.getElementById('tagAutocomplete');
      const tagAutocompleteList = document.getElementById('tagAutocompleteList');
      const navToggleButton = document.getElementById('navToggleButton');
      const burgerMenu = document.getElementById('burgerMenu');
      const scrubHud = document.getElementById('scrubHud');
      const scrubTime = document.getElementById('scrubTime');
      const scrubBar = document.getElementById('scrubBar');
      const onboardingGuide = document.getElementById('onboardingGuide');
      const dismissOnboarding = document.getElementById('dismissOnboarding');

      modeSelect.value = state.mode;
      tagsInput.value = state.tags;
      ratingSelect.value = state.rating;
      mediaDisplaySelect.value = state.fitMedia ? 'contain' : 'fullscreen';
      ratioSelect.value = state.ratio;
      hideTagsToggle.checked = state.hideTags;
      maybeShowOnboarding();

      navToggleButton.addEventListener('click', (event) => {
        event.stopPropagation();
        burgerMenu.classList.toggle('open');
        navToggleButton.setAttribute('aria-label', burgerMenu.classList.contains('open') ? 'Close navigation' : 'Open navigation');
      });

      function navigateWithTransition(href) {
        if (!href) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          window.location.href = href;
          return;
        }
        const go = () => {
          if (document.startViewTransition) {
            document.startViewTransition(() => {
              window.location.href = href;
            });
            return;
          }
          document.body.classList.add('page-transitioning');
          window.setTimeout(() => {
            window.location.href = href;
          }, 180);
        };
        window.requestAnimationFrame(go);
      }

      document.querySelectorAll('a[data-page-nav]').forEach((link) => {
        link.addEventListener('click', (event) => {
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          navigateWithTransition(link.href);
        });
      });

      toggleFiltersButton.addEventListener('click', () => {
        const nextOpen = !filterPanel.classList.contains('open');
        filterPanel.classList.toggle('open', nextOpen);
        toggleFiltersButton.classList.toggle('active', nextOpen);
        if (!nextOpen) {
          closeTagAutocomplete();
        }
      });

      filterPanel.addEventListener('submit', async (event) => {
        event.preventDefault();
        closeTagAutocomplete();
        state.mode = modeSelect.value;
        state.tags = tagsInput.value.trim();
        state.rating = ratingSelect.value;
        state.ratio = ratioSelect.value;
        state.fitMedia = mediaDisplaySelect.value !== 'fullscreen';
        state.hideTags = hideTagsToggle.checked;
        syncDisplaySettings();
        syncUrlState();
        closeSettings();
          await restartFeed();
      });

      resetButton.addEventListener('click', async () => {
        modeSelect.value = 'trending';
        tagsInput.value = '';
        ratingSelect.value = '';
        mediaDisplaySelect.value = 'contain';
        ratioSelect.value = '';
        hideTagsToggle.checked = true;
        state.mode = 'trending';
        state.tags = '';
        state.rating = '';
        state.ratio = '';
        state.fitMedia = true;
        state.hideTags = true;
        closeTagAutocomplete();
        syncDisplaySettings();
        syncUrlState();
        closeSettings();
          await restartFeed();
      });

      nextButton.addEventListener('click', () => goToRelativePost(1));
      previousButton.addEventListener('click', () => goToRelativePost(-1));
      toggleMuteButton.addEventListener('click', () => {
        state.muted = !state.muted;
        state.preloaded.forEach((entry) => {
          if (entry.media && entry.media.tagName === 'VIDEO') {
            entry.media.muted = state.muted;
          }
        });
        if (state.currentMedia && state.currentMedia.tagName === 'VIDEO') {
          state.currentMedia.muted = state.muted;
        }
        toggleMuteButton.textContent = state.muted ? '🔇' : '🔊';
        toggleMuteButton.setAttribute('aria-label', state.muted ? 'Unmute video audio' : 'Mute video audio');
      });

      dismissOnboarding.addEventListener('click', dismissOnboardingGuide);
      tagsInput.addEventListener('input', () => scheduleTagAutocomplete());
      tagsInput.addEventListener('focus', () => scheduleTagAutocomplete(true));
      tagsInput.addEventListener('blur', () => {
        window.setTimeout(() => {
          if (!tagAutocomplete.contains(document.activeElement)) {
            closeTagAutocomplete();
          }
        }, 120);
      });
      tagsInput.addEventListener('keydown', handleAutocompleteKeydown);
      tagAutocomplete.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });
      tagAutocomplete.addEventListener('click', (event) => {
        const option = event.target.closest('[data-tag-name]');
        if (!option) return;
        applyAutocompleteTag(option.getAttribute('data-tag-name'));
      });
      tagList.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-tag-filter]');
        if (!button) return;
        const nextTag = button.getAttribute('data-tag-filter') || '';
        if (!nextTag || nextTag === state.tags) return;
        tagsInput.value = nextTag;
        state.tags = nextTag;
        closeTagAutocomplete();
        syncUrlState();
        renderStatus('Loading tag…', 'Switching the reel feed to ' + nextTag.replaceAll('_', ' ') + '.');
        await restartFeed();
      });

      document.addEventListener('click', (event) => {
        if (!filterPanel.contains(event.target) && !toggleFiltersButton.contains(event.target)) {
          closeSettings();
        }
        if (!burgerMenu.contains(event.target) && !navToggleButton.contains(event.target)) {
          burgerMenu.classList.remove('open');
        }
        if (!filterPanel.contains(event.target)) {
          closeTagAutocomplete();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.target === tagsInput) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          goToRelativePost(1);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          goToRelativePost(-1);
        } else if (event.key.toLowerCase() === 'f') {
          state.fitMedia = !state.fitMedia;
          mediaDisplaySelect.value = state.fitMedia ? 'contain' : 'fullscreen';
          syncDisplaySettings();
              rerenderCurrentSlide();
        } else if (event.key.toLowerCase() === 't') {
          state.hideTags = !state.hideTags;
          hideTagsToggle.checked = state.hideTags;
          syncDisplaySettings();
        } else if (event.key === 'Escape') {
          closeSettings();
          closeTagAutocomplete();
          dismissOnboardingGuide();
        }
      });

      appRoot.addEventListener('pointerdown', handlePointerDown, { capture: true });
      appRoot.addEventListener('pointermove', handlePointerMove, { capture: true });
      appRoot.addEventListener('pointerup', handlePointerUp, { capture: true });
      appRoot.addEventListener('pointercancel', cancelPointerGesture, { capture: true });
      appRoot.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
      appRoot.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      appRoot.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
      appRoot.addEventListener('touchcancel', cancelPointerGesture, { passive: false, capture: true });
      appRoot.addEventListener('wheel', handleWheel, { passive: false });

      // Shared settings storage used by reels/photos/settings pages.
      function loadSettings() {
        const defaults = { shared: { tags: '', sort: 'trending', rating: '', ratio: '', syncUrl: true }, reels: { fitMedia: true, muted: true, onboardingSeen: false }, photos: { gridDensity: 'comfortable', fitImages: 'crop' } };
        try {
          const raw = window.localStorage.getItem('fr_settings_v1');
          if (!raw) return defaults;
          const parsed = JSON.parse(raw);
          return { ...defaults, ...parsed, shared: { ...defaults.shared, ...(parsed.shared || {}) }, reels: { ...defaults.reels, ...(parsed.reels || {}) }, photos: { ...defaults.photos, ...(parsed.photos || {}) } };
        } catch { return defaults; }
      }
      function saveSettings(settings) { window.localStorage.setItem('fr_settings_v1', JSON.stringify(settings)); }
      function mergeUrlParamsIntoSettings(settings, urlObj) {
        const mode = urlObj.searchParams.get('mode');
        const tags = (urlObj.searchParams.get('tags') || '').trim();
        const rating = (urlObj.searchParams.get('rating') || '').trim();
        const ratio = (urlObj.searchParams.get('ratio') || '').trim();
        if (mode === 'score' || mode === 'trending') settings.shared.sort = mode;
        if (tags) settings.shared.tags = tags;
        if (['s','q','e'].includes(rating)) settings.shared.rating = rating;
        if (['vertical','landscape'].includes(ratio)) settings.shared.ratio = ratio;
        return settings;
      }
      function applySettingsToUrl(settings, targetPath) {
        const next = new URL(window.location.origin + targetPath);
        if (settings.shared.sort === 'score') next.searchParams.set('mode', 'score');
        if (settings.shared.tags) next.searchParams.set('tags', settings.shared.tags);
        if (settings.shared.rating) next.searchParams.set('rating', settings.shared.rating);
        if (settings.shared.ratio) next.searchParams.set('ratio', settings.shared.ratio);
        return next.toString();
      }

      function maybeShowOnboarding() {
        const settings = loadSettings();
        if (settings.reels.onboardingSeen) return;
        onboardingGuide.hidden = false;
      }

      function dismissOnboardingGuide() {
        onboardingGuide.hidden = true;
        const settings = loadSettings();
        settings.reels.onboardingSeen = true;
        saveSettings(settings);
      }

      function renderFilterSummary() {
        const rows = [['Trending', state.mode === 'trending'], ['Top scored', state.mode === 'score'], ['Safe', state.rating === 's'], ['Questionable', state.rating === 'q'], ['Explicit', state.rating === 'e'], ['Any ratio', !state.ratio], ['Vertical', state.ratio === 'vertical'], ['Landscape', state.ratio === 'landscape'], ['Contain', state.fitMedia], ['Fullscreen', !state.fitMedia]];
        filterSummary.innerHTML = '';
        rows.forEach(([label, selected]) => {
          const chip = document.createElement('span');
          chip.className = 'ux-chip' + (selected ? ' selected' : '');
          chip.textContent = label;
          filterSummary.appendChild(chip);
        });
      }

      function closeSettings() {
        filterPanel.classList.remove('open');
        toggleFiltersButton.classList.remove('active');
      }

      function syncDisplaySettings() {
        metaBlock.classList.toggle('hidden-tags', state.hideTags);
        ratioBadge.textContent = formatRatioBadge(state.ratio);
      }

      function syncUrlState() {
        const settings = loadSettings();
        settings.shared = { ...settings.shared, tags: state.tags, sort: state.mode, rating: state.rating, ratio: state.ratio };
        settings.reels = { ...settings.reels, fitMedia: state.fitMedia, muted: state.muted };
        saveSettings(settings);
        if (!settings.shared.syncUrl) return;
        const nextUrl = new URL(window.location.href);
        nextUrl.search = '';
        if (state.mode !== 'trending') nextUrl.searchParams.set('mode', state.mode);
        if (state.tags) nextUrl.searchParams.set('tags', state.tags);
        if (state.rating) nextUrl.searchParams.set('rating', state.rating);
        if (state.ratio) nextUrl.searchParams.set('ratio', state.ratio);
        window.history.replaceState({}, '', nextUrl.toString());
      }

      function shouldIgnoreGestureTarget(target) {
        if (!target) return false;
        if (filterPanel.classList.contains('open') && filterPanel.contains(target)) return true;
        return Boolean(target.closest('button, a, input, select, option, label, textarea, [data-tag-name]'));
      }

      function beginGesture(point, source, event) {
        if (state.animationLock) return false;
        if (filterPanel.contains(event.target) || toggleFiltersButton.contains(event.target)) return false;
        if (shouldIgnoreGestureTarget(event.target)) return false;
        state.touchActive = true;
        state.gesturePointerId = point.identifier ?? event.pointerId ?? null;
        state.gestureSource = source;
        state.pointerStartY = point.clientY;
        state.pointerStartX = point.clientX;
        state.pointerDeltaY = 0;
        state.pointerDeltaX = 0;
        state.dragLocked = false;
        reelTrack.classList.remove('animating');
        return true;
      }

      function updateGesture(point) {
        if (!state.touchActive || state.animationLock) return false;
        state.pointerDeltaY = point.clientY - state.pointerStartY;
        state.pointerDeltaX = point.clientX - state.pointerStartX;
        if (!state.dragLocked) {
          if (state.currentMedia && state.currentMedia.tagName === 'VIDEO' && Math.abs(state.pointerDeltaX) > DRAG_LOCK_THRESHOLD && Math.abs(state.pointerDeltaX) > Math.abs(state.pointerDeltaY)) {
            state.dragLocked = true;
            state.horizontalScrubbing = true;
            state.scrubStartTime = Number.isFinite(state.currentMedia.currentTime) ? state.currentMedia.currentTime : 0;
          }
          if (Math.abs(state.pointerDeltaY) < DRAG_LOCK_THRESHOLD) return false;
          if (Math.abs(state.pointerDeltaX) > Math.abs(state.pointerDeltaY)) {
            cancelPointerGesture();
            return false;
          }
          state.dragLocked = true;
        }
        if (state.horizontalScrubbing && state.currentMedia && Number.isFinite(state.currentMedia.duration) && state.currentMedia.duration > 0) {
          const deltaSeconds = (state.pointerDeltaX / viewport.clientWidth) * state.currentMedia.duration;
          const nextTime = Math.max(0, Math.min(state.currentMedia.duration, state.scrubStartTime + deltaSeconds));
          state.currentMedia.currentTime = nextTime;
          updateScrubHud(nextTime, state.currentMedia.duration);
          return true;
        }
        updateTrackForDrag(state.pointerDeltaY);
        return true;
      }

      function endGesture() {
        if (!state.touchActive) return;
        if (state.horizontalScrubbing) {
          state.horizontalScrubbing = false;
          scrubHud.classList.remove('show');
          cancelPointerGesture();
          return;
        }
        finalizeSwipe(state.pointerDeltaY, state.dragLocked);
      }
      function updateScrubHud(current, duration) {
        scrubHud.classList.add('show');
        scrubTime.textContent = formatClock(current) + ' / ' + formatClock(duration);
        scrubBar.style.width = ((current / duration) * 100) + '%';
      }
      function formatClock(seconds) {
        const total = Math.max(0, Math.floor(seconds || 0));
        const m = Math.floor(total / 60);
        const s = String(total % 60).padStart(2, '0');
        return m + ':' + s;
      }

      function handlePointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (!beginGesture(event, 'pointer', event)) return;
        if (typeof appRoot.setPointerCapture === 'function') {
          try {
            appRoot.setPointerCapture(event.pointerId);
          } catch (error) {
            console.warn('Pointer capture failed', error);
          }
        }
      }

      function handlePointerMove(event) {
        if (!state.touchActive || state.gestureSource !== 'pointer') return;
        if (state.gesturePointerId !== null && event.pointerId !== state.gesturePointerId) return;
        if (updateGesture(event)) {
          event.preventDefault();
        }
      }

      function handlePointerUp(event) {
        if (!state.touchActive || state.gestureSource !== 'pointer') return;
        if (state.gesturePointerId !== null && event.pointerId !== state.gesturePointerId) return;
        if (typeof appRoot.releasePointerCapture === 'function') {
          try {
            appRoot.releasePointerCapture(event.pointerId);
          } catch (error) {
            console.warn('Pointer release failed', error);
          }
        }
        endGesture();
      }

      function handleTouchStart(event) {
        if (!event.changedTouches.length) return;
        beginGesture(event.changedTouches[0], 'touch', event);
      }

      function handleTouchMove(event) {
        if (!state.touchActive || state.gestureSource !== 'touch') return;
        const touch = findActiveTouch(event.changedTouches);
        if (!touch) return;
        if (updateGesture(touch)) {
          event.preventDefault();
        }
      }

      function handleTouchEnd(event) {
        if (!state.touchActive || state.gestureSource !== 'touch') return;
        const touch = findActiveTouch(event.changedTouches);
        if (!touch) return;
        event.preventDefault();
        endGesture();
      }

      function findActiveTouch(touchList) {
        for (const touch of touchList) {
          if (state.gesturePointerId === null || touch.identifier === state.gesturePointerId) {
            return touch;
          }
        }
        return null;
      }

      function cancelPointerGesture() {
        if (!state.touchActive) return;
        finalizeSwipe(0, false);
      }

      function handleWheel(event) {
        if (filterPanel.classList.contains('open') || state.animationLock) return;
        if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) return;
        event.preventDefault();
        goToRelativePost(event.deltaY > 0 ? 1 : -1);
      }

      function updateTrackForDrag(deltaY) {
        refreshTrackSlides();
        reelTrack.style.transform = 'translate3d(0, ' + deltaY + 'px, 0)';
        ensureAdjacentSlides();
      }

      function finalizeSwipe(deltaY, hasDragged = true) {
        const wasDragging = hasDragged && Math.abs(deltaY) >= DRAG_LOCK_THRESHOLD;
        state.touchActive = false;
        state.dragLocked = false;
        state.gesturePointerId = null;
        state.gestureSource = null;
        const direction = wasDragging && deltaY <= -SWIPE_THRESHOLD ? 1 : wasDragging && deltaY >= SWIPE_THRESHOLD ? -1 : 0;
        if (wasDragging) {
          state.suppressClickUntil = Date.now() + 400;
        }
        if (direction === 0) {
          animateTrackTo(0);
          return;
        }
        goToRelativePost(direction, { animated: true });
      }

      function scheduleTagAutocomplete(runImmediately = false) {
        if (state.tagAutocomplete.debounceTimer) {
          clearTimeout(state.tagAutocomplete.debounceTimer);
          state.tagAutocomplete.debounceTimer = null;
        }
        if (runImmediately) {
          updateTagAutocomplete();
          return;
        }
        state.tagAutocomplete.debounceTimer = setTimeout(updateTagAutocomplete, AUTOCOMPLETE_DEBOUNCE_MS);
      }

      async function updateTagAutocomplete() {
        const token = getActiveTagToken(tagsInput.value);
        state.tagAutocomplete.query = token;
        if (!token) {
          closeTagAutocomplete();
          return;
        }
        const requestId = ++state.tagAutocomplete.requestId;
        try {
          const items = await fetchTagAutocomplete(token);
          if (requestId !== state.tagAutocomplete.requestId) return;
          state.tagAutocomplete.items = items;
          state.tagAutocomplete.activeIndex = items.length ? 0 : -1;
          renderTagAutocomplete();
        } catch (error) {
          console.warn('Tag autocomplete failed', error);
          if (requestId !== state.tagAutocomplete.requestId) return;
          state.tagAutocomplete.items = [];
          state.tagAutocomplete.activeIndex = -1;
          renderTagAutocomplete('Could not load tag suggestions right now.');
        }
      }

      async function fetchTagAutocomplete(query) {
        const upstreamUrl = new URL(CLIENT_E621_TAG_AUTOCOMPLETE_API);
        upstreamUrl.searchParams.set('search[name_matches]', query + '*');
        const response = await fetch(upstreamUrl.toString(), {
          headers: { Accept: 'application/json' },
        });
        const payload = await parseJsonSafely(response);
        if (!response.ok) {
          throw createFetchError('Direct tag autocomplete failed', {
            url: upstreamUrl.toString(),
            status: response.status,
            payload,
          });
        }
        return Array.isArray(payload)
          ? payload
              .filter((tag) => tag && typeof tag.name === 'string')
              .slice(0, TAG_AUTOCOMPLETE_LIMIT)
              .map((tag) => ({
                id: tag.id || null,
                name: tag.name,
                category: Number.isFinite(tag.category) ? tag.category : null,
                postCount: Number.isFinite(tag.post_count) ? tag.post_count : 0,
                antecedentName: tag.antecedent_name || null,
              }))
          : [];
      }

      function handleAutocompleteKeydown(event) {
        if (!state.tagAutocomplete.open && event.key !== 'Tab') return;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveAutocompleteSelection(1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveAutocompleteSelection(-1);
        } else if (event.key === 'Enter' || event.key === 'Tab') {
          if (state.tagAutocomplete.open && state.tagAutocomplete.activeIndex >= 0) {
            event.preventDefault();
            const active = state.tagAutocomplete.items[state.tagAutocomplete.activeIndex];
            if (active) applyAutocompleteTag(active.name);
          }
        } else if (event.key === 'Escape') {
          closeTagAutocomplete();
        }
      }

      function moveAutocompleteSelection(direction) {
        if (!state.tagAutocomplete.items.length) return;
        const count = state.tagAutocomplete.items.length;
        state.tagAutocomplete.activeIndex = (state.tagAutocomplete.activeIndex + direction + count) % count;
        renderTagAutocomplete();
      }

      function renderTagAutocomplete(emptyMessage) {
        tagAutocompleteList.innerHTML = '';
        const hasItems = state.tagAutocomplete.items.length > 0;
        if (!hasItems) {
          if (!emptyMessage) {
            closeTagAutocomplete();
            return;
          }
          const empty = document.createElement('div');
          empty.className = 'autocomplete-empty';
          empty.textContent = emptyMessage;
          tagAutocompleteList.appendChild(empty);
        } else {
          state.tagAutocomplete.items.forEach((item, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'autocomplete-option' + (index === state.tagAutocomplete.activeIndex ? ' active' : '');
            button.setAttribute('data-tag-name', item.name);
            button.setAttribute('role', 'option');
            button.setAttribute('aria-selected', index === state.tagAutocomplete.activeIndex ? 'true' : 'false');

            const category = document.createElement('span');
            category.className = 'autocomplete-category';
            if (item.category !== null && item.category !== undefined) {
              category.setAttribute('data-category', String(item.category));
            }

            const tag = document.createElement('span');
            tag.className = 'autocomplete-tag';
            const name = document.createElement('div');
            name.className = 'autocomplete-name';
            name.textContent = item.name.replaceAll('_', ' ');
            const meta = document.createElement('div');
            meta.className = 'autocomplete-meta';
            meta.textContent = item.antecedentName ? 'Alias of ' + item.antecedentName.replaceAll('_', ' ') : categoryLabel(item.category);
            tag.appendChild(name);
            tag.appendChild(meta);

            const count = document.createElement('span');
            count.className = 'autocomplete-count';
            count.textContent = formatPostCount(item.postCount);

            button.appendChild(category);
            button.appendChild(tag);
            button.appendChild(count);
            tagAutocompleteList.appendChild(button);
          });
        }
        state.tagAutocomplete.open = true;
        tagAutocomplete.hidden = false;
        tagsInput.setAttribute('aria-expanded', 'true');
      }

      function closeTagAutocomplete() {
        state.tagAutocomplete.items = [];
        state.tagAutocomplete.activeIndex = -1;
        state.tagAutocomplete.open = false;
        tagAutocomplete.hidden = true;
        tagsInput.setAttribute('aria-expanded', 'false');
        tagAutocompleteList.innerHTML = '';
      }

      function applyAutocompleteTag(tagName) {
        tagsInput.value = replaceActiveTagToken(tagsInput.value, tagName);
        tagsInput.focus();
        closeTagAutocomplete();
      }

      function getActiveTagToken(value) {
        const normalized = String(value || '');
        const endsWithSpace = /\s$/.test(normalized);
        if (endsWithSpace) return '';
        const parts = normalized.split(/\s+/);
        return sanitizeAutocompleteQuery(parts[parts.length - 1] || '');
      }

      function replaceActiveTagToken(value, tagName) {
        const normalized = String(value || '');
        const parts = normalized.split(/\s+/).filter((part, index, array) => part || index < array.length - 1);
        if (!parts.length || /\s$/.test(normalized)) {
          return (normalized.trim() ? normalized.trim() + ' ' : '') + tagName + ' ';
        }
        parts[parts.length - 1] = tagName;
        return parts.join(' ') + ' ';
      }

      function categoryLabel(category) {
        const labels = {
          0: 'General',
          1: 'Artist',
          3: 'Copyright',
          4: 'Character',
          5: 'Species',
          6: 'Invalid',
        };
        return labels[category] || 'Tag';
      }

      function formatPostCount(count) {
        return Number(count || 0).toLocaleString();
      }

      async function restartFeed() {
        clearTimers();
        state.posts = [];
        state.currentIndex = 0;
        state.nextPage = 1;
        state.currentMedia = null;
        state.currentSlide = null;
        state.preloaded.clear();
        reelTrack.innerHTML = '';
        reelTrack.style.transform = 'translate3d(0, 0, 0)';
        renderStatus('Loading feed…', 'Pulling fresh posts from e621.');
        await loadPosts(true);
      }

      async function loadPosts(replace = false) {
        if (state.loading) return;
        state.loading = true;
        try {
          const params = new URLSearchParams({
            mode: state.mode,
            page: String(state.nextPage),
          });
          if (state.tags) params.set('tags', state.tags);
          if (state.rating) params.set('rating', state.rating);
          if (state.ratio) params.set('ratio', state.ratio);


          const { data, source } = await fetchPostsPreferDirect(params);
          const incoming = Array.isArray(data.posts) ? data.posts : [];
          state.lastFeedSource = source;


          if (replace) {
            state.posts = incoming;
            state.currentIndex = 0;
          } else {
            state.posts.push(...incoming);
          }
          state.nextPage += 1;

          if (!state.posts.length) {
            renderEmpty('No posts found', 'Try different tags or remove the rating filter.');
            return;
          }

          if (replace || !state.currentSlide) {
            await showPost(state.currentIndex, { immediate: true });
          } else {
            schedulePreloadAroundIndex(state.currentIndex);
          }
        } catch (error) {
          console.error('[feed] request failed', { message: error instanceof Error ? error.message : String(error) });
          renderEmpty('Could not load posts', 'Could not load content right now. Try again shortly.');
        } finally {
          state.loading = false;
        }
      }

      async function fetchPostsPreferDirect(params) {
        const directData = await fetchPostsDirectly(params);
        return { data: directData, source: 'client-direct' };
      }

      async function fetchPostsDirectly(params) {
        const upstreamUrl = new URL(CLIENT_E621_API);
        upstreamUrl.searchParams.set('limit', '24');
        upstreamUrl.searchParams.set('page', params.get('page'));
        upstreamUrl.searchParams.set('tags', buildApiTags(params));


        const upstreamResponse = await fetch(upstreamUrl.toString(), {
          headers: { Accept: 'application/json' },
        });
        const upstreamPayload = await parseJsonSafely(upstreamResponse);

        if (!upstreamResponse.ok) {
          const directError = createFetchError('Direct e621 request failed', {
            url: upstreamUrl.toString(),
            status: upstreamResponse.status,
            payload: upstreamPayload,
          });
          console.error('[feed] direct request failed', { status: upstreamResponse.status });
          throw directError;
        }

        const posts = Array.isArray(upstreamPayload && upstreamPayload.posts)
          ? upstreamPayload.posts
              .filter((post) => post && post.file && post.file.url && CLIENT_SUPPORTED_MEDIA.has(String(post.file.ext || '').toLowerCase()))
              .map((post) => mapApiPost(post))
          : [];

        return {
          mode: params.get('mode') === 'score' ? 'score' : 'trending',
          page: Number(params.get('page') || '1'),
          tags: sanitizeClientTags(params.get('tags') || ''),
          rating: sanitizeClientRating(params.get('rating')),
          ratio: sanitizeRatioFilter(params.get('ratio')),
          posts,
          source: 'client-direct',
        };
      }

      function buildApiTags(params) {
        const tags = [
          params.get('mode') === 'score' ? 'order:score' : 'order:rank',
          'animated',
          ...sanitizeClientTags(params.get('tags') || ''),
        ];
        const rating = sanitizeClientRating(params.get('rating'));
        const ratio = sanitizeRatioFilter(params.get('ratio'));
        if (rating) tags.push('rating:' + rating);
        if (ratio) tags.push(ratio === 'vertical' ? 'ratio:<1' : 'ratio:>1');
        return tags.join(' ');
      }

      function sanitizeClientTags(raw) {
        return String(raw || '')
          .split(/\s+/)
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 12);
      }

      function sanitizeClientRating(value) {
        return ['s', 'q', 'e'].includes(value) ? value : '';
      }

      function sanitizeRatioFilter(value) {
        return ['vertical', 'landscape'].includes(value) ? value : '';
      }

      function sanitizeAutocompleteQuery(value) {
        return String(value || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_:()'-]/g, '')
          .slice(0, 64);
      }

      function mapApiPost(post) {
        const ext = String((post.file && post.file.ext) || '').toLowerCase();
        const artist = Array.isArray(post.tags && post.tags.artist) ? post.tags.artist.filter(Boolean) : [];
        const species = Array.isArray(post.tags && post.tags.species) ? post.tags.species.filter(Boolean) : [];
        const general = Array.isArray(post.tags && post.tags.general) ? post.tags.general.filter(Boolean).slice(0, 12) : [];

        return {
          id: post.id,
          ext,
          type: ['webm', 'mp4'].includes(ext) ? 'video' : 'image',
          score: (post.score && post.score.total) || 0,
          rating: post.rating || 'u',
          width: (post.file && post.file.width) || (post.sample && post.sample.width) || 0,
          height: (post.file && post.file.height) || (post.sample && post.sample.height) || 0,
          createdAt: post.created_at,
          mediaUrl: post.file.url,
          previewUrl: (post.preview && post.preview.url) || (post.sample && post.sample.url) || post.file.url,
          sourceUrl: 'https://e621.net/posts/' + post.id,
          description: [
            artist.length ? 'Artist: ' + artist.join(', ') : 'Artist unknown',
            species.length ? 'Species: ' + species.slice(0, 3).join(', ') : null,
          ].filter(Boolean).join(' • '),
          tags: artist.map((tag) => 'artist:' + tag).concat(general),
        };
      }

      async function parseJsonSafely(response) {
        const text = await response.text();
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch (error) {
          return { rawText: text };
        }
      }

      function createFetchError(message, context) {
        const error = new Error(message);
        error.context = context;
        return error;
      }

      function renderStatus(title, body) {
        statusCard.hidden = false;
        statusTitle.textContent = title;
        statusText.textContent = body;
      }

      function renderEmpty(title, body) {
        reelTrack.innerHTML = '';
        clearTimers();
        renderStatus(title, body);
        postTitle.textContent = title;
        postDescription.textContent = body;
        tagList.innerHTML = '';
        counterBadge.textContent = '0 / 0';
        progressBar.style.width = '0%';
      }

      function setProgressValue(value) {
        progressBar.style.width = Math.max(0, Math.min(100, value)) + '%';
      }

      function clearTimers(resetProgress = true) {
        if (state.timer) {
          clearTimeout(state.timer);
          state.timer = null;
        }
        if (state.progressTimer) {
          clearInterval(state.progressTimer);
          state.progressTimer = null;
        }
        if (resetProgress) {
          setProgressValue(0);
        }
      }

      function scheduleImageAdvance() {
        clearTimers();
        const startedAt = Date.now();
        state.timer = setTimeout(() => goToRelativePost(1), IMAGE_COUNTDOWN_MS);
        state.progressTimer = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          setProgressValue((elapsed / IMAGE_COUNTDOWN_MS) * 100);
          if (elapsed >= IMAGE_COUNTDOWN_MS) {
            clearTimers(false);
          }
        }, 100);
      }

      function watchVideoProgress(video) {
        clearTimers();
        const update = () => {
          setProgressValue(getVideoPlaybackProgress(video) * 100);
        };
        update();
        state.progressTimer = setInterval(update, 120);
      }

      async function goToRelativePost(offset, options = {}) {
        if (!state.posts.length || state.animationLock) return;
        const nextIndex = state.currentIndex + offset;
        if (nextIndex < 0) {
          animateTrackTo(0);
          return;
        }

        if (nextIndex >= state.posts.length) {
          if (!state.loading) {
            await loadPosts(false);
          }
          if (nextIndex >= state.posts.length) {
            animateTrackTo(0);
            return;
          }
        }

        await showPost(nextIndex, { immediate: options.immediate === true, direction: Math.sign(offset) || 1 });
      }

      function rerenderCurrentSlide() {
        if (!state.posts.length) return;
        const currentEntry = state.preloaded.get(state.currentIndex);
        if (currentEntry) {
          currentEntry.media.classList.toggle('fit', state.fitMedia);
        }
        if (state.currentSlide) {
          const media = state.currentSlide.querySelector('.reel-media');
          if (media) {
            media.classList.toggle('fit', state.fitMedia);
          }
        }
      }

      async function showPost(index, options = {}) {
        const post = state.posts[index];
        if (!post) return;

        const navigationToken = ++state.navigationToken;
        statusCard.hidden = true;
        const previousIndex = state.currentIndex;
        const direction = index > previousIndex ? 1 : index < previousIndex ? -1 : 0;
        const movement = options.immediate || direction === 0 ? 0 : direction;

        if (!state.currentSlide || options.immediate) {
          const entry = await ensureSlide(index);
          if (navigationToken !== state.navigationToken) return;
          state.currentIndex = index;
          setCurrentSlide(entry.slide, entry.media);
          refreshTrackSlides();
          updateMeta(post);
          startPlaybackForPost(post, entry.media, entry.slide);
          ensureAdjacentSlides();
          schedulePreloadAroundIndex(index);
          if (state.posts.length - index <= 4) {
            loadPosts(false);
          }
          animateTrackTo(0, false);
          return;
        }

        state.animationLock = true;
        clearTimers(direction === 0);

        try {
          const currentMedia = state.currentMedia;
          const targetEntry = await ensureSlide(index);
          if (navigationToken !== state.navigationToken) return;

          if (currentMedia && currentMedia.tagName === 'VIDEO') {
            currentMedia.pause();
          }

          refreshTrackSlides();
          ensureAdjacentSlides();
          schedulePreloadAroundIndex(index);

          const trackTarget = movement > 0 ? -viewport.clientHeight : viewport.clientHeight;
          await animateTrackTo(trackTarget, true);
          if (navigationToken !== state.navigationToken) return;
          reelTrack.classList.remove('animating');
          reelTrack.style.transform = 'translate3d(0, 0, 0)';

          state.currentIndex = index;
          setCurrentSlide(targetEntry.slide, targetEntry.media);
          refreshTrackSlides();
          updateMeta(post);
          ensureAdjacentSlides();
          startPlaybackForPost(post, targetEntry.media, targetEntry.slide);

          if (state.posts.length - index <= 4) {
            loadPosts(false);
          }
        } finally {
          if (navigationToken === state.navigationToken) {
            state.animationLock = false;
          }
        }
      }

      function positionSlide(slide, offsetPercent) {
        slide.style.transform = 'translate3d(0, ' + offsetPercent + '%, 0)';
      }

      function setCurrentSlide(slide, media) {
        state.currentSlide = slide;
        state.currentMedia = media;
      }

      async function ensureSlide(index) {
        if (state.preloaded.has(index)) {
          return state.preloaded.get(index);
        }
        const entry = await createSlide(state.posts[index]);
        state.preloaded.set(index, entry);
        prunePreloaded(index);
        return entry;
      }

      function refreshTrackSlides() {
        reelTrack.innerHTML = '';
        if (!state.posts.length) return;

        const indexes = [state.currentIndex - 1, state.currentIndex, state.currentIndex + 1].filter((index) => index >= 0 && index < state.posts.length);
        indexes.forEach((index) => {
          const entry = state.preloaded.get(index);
          if (!entry) return;
          positionSlide(entry.slide, (index - state.currentIndex) * 100);
          reelTrack.appendChild(entry.slide);
        });
      }

      function prunePreloaded(centerIndex) {
        const allowed = new Set();
        for (let offset = -PRELOAD_DISTANCE; offset <= PRELOAD_DISTANCE; offset += 1) {
          allowed.add(centerIndex + offset);
        }
        Array.from(state.preloaded.keys()).forEach((key) => {
          if (key === state.currentIndex || allowed.has(key)) return;
          const entry = state.preloaded.get(key);
          if (entry && entry.media && entry.media.tagName === 'VIDEO') {
            entry.media.pause();
            entry.media.removeAttribute('src');
            entry.media.load();
          }
          state.preloaded.delete(key);
        });
      }

      async function createSlide(post) {
        const slide = document.createElement('article');
        slide.className = 'reel-slide loading';
        slide.style.setProperty('--preview-image', post.previewUrl ? 'url("' + post.previewUrl.replace(/"/g, '\\"') + '")' : 'none');

        const fallback = document.createElement('div');
        fallback.className = 'reel-media-fallback';
        fallback.style.backgroundImage = post.previewUrl ? 'url("' + post.previewUrl.replace(/"/g, '\\"') + '")' : 'none';
        slide.appendChild(fallback);

        const loadIndicator = document.createElement('div');
        loadIndicator.className = 'load-indicator';
        loadIndicator.setAttribute('role', 'status');
        loadIndicator.setAttribute('aria-live', 'polite');
        loadIndicator.innerHTML = '<span class="load-indicator-dot" aria-hidden="true"></span><span>Loading media</span>';
        slide.appendChild(loadIndicator);

        let media;
        if (post.type === 'video') {
          media = document.createElement('video');
          media.src = post.mediaUrl;
          media.poster = post.previewUrl;
          media.preload = 'metadata';
          media.playsInline = true;
          media.loop = false;
          media.muted = state.muted;
          media.controls = false;
          media.autoplay = false;
          media.className = 'reel-media' + (state.fitMedia ? ' fit' : '');
          media.addEventListener('loadeddata', () => slide.classList.remove('loading'), { once: true });
          media.addEventListener('loadedmetadata', () => initializeVideoPlayback(media));
          media.addEventListener('ended', () => {
            handleVideoEnded(media);
          });
          media.addEventListener('play', () => {
            markVideoPlaybackStarted(media);
            if (state.currentMedia === media) watchVideoProgress(media);
            slide.classList.remove('awaiting-play');
          });
          media.addEventListener('pause', () => {
            finalizeVideoPlaybackChunk(media);
            if (state.currentMedia === media && !media.ended) {
              clearTimers(false);
            }
          });
          media.addEventListener('waiting', () => slide.classList.add('awaiting-play'));
          media.addEventListener('playing', () => slide.classList.remove('awaiting-play'));
        } else {
          media = document.createElement('img');
          media.src = post.mediaUrl;
          media.alt = post.description || 'e621 media post';
          media.loading = 'eager';
          media.decoding = 'async';
          media.className = 'reel-media' + (state.fitMedia ? ' fit' : '');
          media.addEventListener('load', () => slide.classList.remove('loading'), { once: true });
        }

        media.addEventListener('click', (event) => {
          if (Date.now() < state.suppressClickUntil) {
            event.preventDefault();
            return;
          }
          if (state.touchActive) return;
          if (Math.abs(state.pointerDeltaY) > TAP_DISTANCE_THRESHOLD) return;
          if (media.tagName === 'VIDEO') {
            if (media.paused) {
              media.play().catch(() => {});
            } else {
              media.pause();
            }
          } else {
            goToRelativePost(1, { animated: true });
          }
        });

        slide.appendChild(media);
        return { slide, media, post };
      }

      function startPlaybackForPost(post, media, slide) {
        if (post.type === 'video') {
          resetVideoPlayback(media);
          media.currentTime = 0;
          media.muted = state.muted;
          slide.classList.add('awaiting-play');
          media.play().then(() => {
            watchVideoProgress(media);
          }).catch(() => {
            slide.classList.add('awaiting-play');
            clearTimers();
          });
        } else {
          slide.classList.remove('loading');
          scheduleImageAdvance();
        }
      }

      function updateMeta(post) {
        postDescription.textContent = '';
        const artistText = document.createTextNode((post.description.split(' • ')[0] || 'Artist: Unknown artist') + ' • ');
        const viewLink = document.createElement('a');
        viewLink.href = post.sourceUrl;
        viewLink.target = '_blank';
        viewLink.rel = 'noreferrer noopener';
        viewLink.textContent = 'View post';
        postDescription.append(artistText, viewLink);
        sortBadge.textContent = (state.mode === 'score' ? 'Top score' : 'Trending') + (state.lastFeedSource === 'client-direct' ? ' • Direct' : '');
        counterBadge.textContent = (state.currentIndex + 1) + ' / ' + state.posts.length;
        openPostLink.href = post.sourceUrl;
        tagList.innerHTML = '';

        const tags = post.tags.length ? post.tags : ['No tags'];
        tags.slice(0, 8).forEach((tag) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'pill pill-button' + (tag === state.tags ? ' active' : '');
          button.textContent = tag.replaceAll('_', ' ');
          button.setAttribute('data-tag-filter', tag);
          button.setAttribute('aria-label', 'Filter feed by ' + tag.replaceAll('_', ' '));
          tagList.appendChild(button);
        });
      }

      function ensureAdjacentSlides() {
        if (!state.posts.length) return;
        const beforeIndex = state.currentIndex - 1;
        const afterIndex = state.currentIndex + 1;
        Promise.resolve().then(async () => {
          if (beforeIndex >= 0) await ensureSlide(beforeIndex);
          if (afterIndex < state.posts.length) await ensureSlide(afterIndex);
          refreshTrackSlides();
        }).catch((error) => console.warn('Adjacent preload failed', error));
      }

      function schedulePreloadAroundIndex(index) {
        for (let offset = 1; offset <= PRELOAD_DISTANCE; offset += 1) {
          const nextIndex = index + offset;
          const previousIndex = index - offset;
          if (nextIndex < state.posts.length) {
            ensureSlide(nextIndex).catch((error) => console.warn('Preload failed', error));
          }
          if (previousIndex >= 0) {
            ensureSlide(previousIndex).catch((error) => console.warn('Preload failed', error));
          }
        }
      }

      function animateTrackTo(targetY, withTransition = true) {
        if (withTransition) {
          reelTrack.classList.add('animating');
          reelTrack.style.transform = 'translate3d(0, ' + targetY + 'px, 0)';
          return new Promise((resolve) => {
            let settled = false;
            const cleanup = () => {
              if (settled) return;
              settled = true;
              clearTimeout(fallbackTimer);
              reelTrack.removeEventListener('transitionend', done);
              resolve();
            };
            const done = (event) => {
              if (event && event.target !== reelTrack) return;
              cleanup();
            };
            const fallbackTimer = setTimeout(cleanup, TRACK_TRANSITION_FALLBACK_MS);
            reelTrack.addEventListener('transitionend', done, { once: true });
          });
        }
        reelTrack.classList.remove('animating');
        reelTrack.style.transform = 'translate3d(0, ' + targetY + 'px, 0)';
        return Promise.resolve();
      }

      function initializeVideoPlayback(video) {
        const existing = state.videoPlayback.get(video) || {};
        state.videoPlayback.set(video, {
          totalMs: existing.totalMs || 0,
          startedAt: existing.startedAt ?? null,
          targetMs: Math.max((Number.isFinite(video.duration) ? video.duration : 0) * 1000, existing.targetMs || 0, MIN_VIDEO_PLAYBACK_MS),
        });
      }

      function resetVideoPlayback(video) {
        initializeVideoPlayback(video);
        const playback = state.videoPlayback.get(video);
        if (!playback) return;
        playback.totalMs = 0;
        playback.startedAt = null;
      }

      function markVideoPlaybackStarted(video) {
        initializeVideoPlayback(video);
        const playback = state.videoPlayback.get(video);
        if (playback && playback.startedAt === null) {
          playback.startedAt = Date.now();
        }
      }

      function finalizeVideoPlaybackChunk(video) {
        const playback = state.videoPlayback.get(video);
        if (!playback || playback.startedAt === null) return;
        playback.totalMs += Math.max(0, Date.now() - playback.startedAt);
        playback.startedAt = null;
      }

      function getVideoPlaybackProgress(video) {
        initializeVideoPlayback(video);
        const playback = state.videoPlayback.get(video);
        if (!playback) return 0;
        const activeMs = playback.startedAt === null ? 0 : Math.max(0, Date.now() - playback.startedAt);
        return Math.max(0, Math.min(1, (playback.totalMs + activeMs) / playback.targetMs));
      }

      function handleVideoEnded(video) {
        finalizeVideoPlaybackChunk(video);
        const playback = state.videoPlayback.get(video);
        if (!playback) return;
        if (playback.totalMs + 50 < playback.targetMs) {
          video.currentTime = 0;
          video.play().catch(() => {
            if (state.currentMedia === video) {
              clearTimers(false);
            }
          });
          return;
        }
        if (state.currentMedia === video) {
          goToRelativePost(1, { animated: true });
        }
      }

      function formatRatioBadge(ratio) {
        if (ratio === 'vertical') return 'Vertical only';
        if (ratio === 'landscape') return 'Landscape only';
        return 'Any aspect';
      }

      function handleViewportResize() {
        const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--app-height', height + 'px');
        if (state.currentSlide) {
          animateTrackTo(0, false);
          refreshTrackSlides();
        }
      }

      window.addEventListener('resize', handleViewportResize);
      window.addEventListener('orientationchange', handleViewportResize);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
      }

      handleViewportResize();
      syncDisplaySettings();
      restartFeed();
    </script>
  </body>
</html>`;
}

function renderPhotoGridPage(url) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Photo Grid | e621 Reels</title>
  <style>body{margin:0;background:#070707;color:#fff;font-family:Inter,system-ui,sans-serif}.frame{min-height:100dvh;max-width:1240px;margin:0 auto;background:#09090d;border-left:1px solid rgba(255,255,255,.08);border-right:1px solid rgba(255,255,255,.08)}.global-header{position:sticky;top:0;z-index:30;display:flex;justify-content:flex-end;padding:12px 16px;background:rgba(12,12,14,.94);border-bottom:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px)}.global-menu-toggle{border:1px solid rgba(255,255,255,.16);background:#111;color:#fff;border-radius:10px;width:42px;height:42px;display:grid;place-items:center;cursor:pointer}.global-drawer{position:fixed;right:0;top:0;bottom:0;width:min(80vw,290px);display:grid;gap:6px;padding:82px 12px 20px;background:#141418;border-left:1px solid rgba(255,255,255,.18);transform:translateX(110%);transition:transform .22s ease;z-index:40}.global-drawer.open{transform:translateX(0)}.global-drawer a{color:#fff;text-decoration:none;padding:10px 12px;border-radius:10px}.global-drawer a:hover{background:rgba(255,255,255,.08)}body.page-transitioning{opacity:0;transition:opacity .22s ease}.status{padding:10px 14px;color:#bbb;font-size:.92rem}.error{margin:0 10px 14px;padding:10px;border:1px solid rgba(255,120,120,.45);border-radius:10px;background:rgba(255,70,70,.08);color:#ffc8c8;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;padding:10px}.tile{background:#101014;border-radius:10px;overflow:hidden;aspect-ratio:1/1;cursor:pointer}.tile img{width:100%;height:100%;object-fit:cover;display:block}.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:50;display:none;overflow:hidden;touch-action:none}.lightbox.open{display:block}.lightbox-track{position:absolute;inset:0;display:flex;transform:translate3d(0,0,0);will-change:transform}.lightbox-track.animating{transition:transform 280ms cubic-bezier(.2,.7,.2,1)}.lightbox-slide{flex:0 0 100%;width:100%;height:100%;display:grid;place-items:center;overflow:auto;padding:20px 0 90px}.lightbox-slide img{width:100%;height:auto;max-height:none;object-fit:contain;display:block}.swipe-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;font-size:30px;line-height:1;color:rgba(255,255,255,.42);user-select:none;pointer-events:none}.swipe-arrow.left{left:12px}.swipe-arrow.right{right:12px}.down-hint{position:absolute;left:50%;transform:translateX(-50%);bottom:58px;z-index:2;font-size:22px;color:rgba(255,255,255,.45);display:none;pointer-events:none}.down-hint.show{display:block}.credit{position:absolute;left:0;right:0;bottom:0;padding:14px 16px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.82));font-size:.92rem;z-index:2}.credit a{color:#fff}</style></head>
  <body>${renderFloatingNav('photos')}<div class="frame"><main class="grid" id="grid"></main>
  <div class="status" id="status">Loading photos…</div><pre class="error" id="errorBox" hidden></pre>
  <div class="lightbox" id="lightbox"><div class="swipe-arrow left">‹</div><div class="swipe-arrow right">›</div><div class="down-hint" id="downHint">⌄⌄</div><div class="lightbox-track" id="lightboxTrack"></div><div class="credit" id="lightboxCredit"></div></div>
  <script>${renderFloatingNavScript()}</script><script>const grid=document.getElementById('grid');const status=document.getElementById('status');const errorBox=document.getElementById('errorBox');const lightbox=document.getElementById('lightbox');const lightboxTrack=document.getElementById('lightboxTrack');const lightboxCredit=document.getElementById('lightboxCredit');const downHint=document.getElementById('downHint');let page=1,loading=false,loaded=0,pendingPosts=[],inflightTimer=null,lightboxIndex=-1,allPosts=[];let touchStartY=0;let lightboxTouchStartX=0;let lightboxTouchStartY=0;let lightboxTouchActive=false;let lightboxBaseX=0;function showError(){errorBox.hidden=false;errorBox.textContent='Could not load content right now. Try again shortly.'}function loadSettings(){const d={shared:{tags:'',sort:'trending',rating:'',ratio:'',syncUrl:true},reels:{fitMedia:true,muted:true,onboardingSeen:false},photos:{gridDensity:'comfortable',fitImages:'crop'}};try{const p=JSON.parse(localStorage.getItem('fr_settings_v1')||'{}');return {...d,...p,shared:{...d.shared,...(p.shared||{})},photos:{...d.photos,...(p.photos||{})}}}catch{return d}}function mergeUrlParamsIntoSettings(settings,url){const m=url.searchParams.get('mode');const t=(url.searchParams.get('tags')||'').trim();const r=(url.searchParams.get('rating')||'').trim().toLowerCase();const ra=(url.searchParams.get('ratio')||'').trim().toLowerCase();if(m==='score'||m==='trending')settings.shared.sort=m;if(t)settings.shared.tags=t;if(['s','q','e'].includes(r))settings.shared.rating=r;if(['vertical','landscape'].includes(ra))settings.shared.ratio=ra;return settings}function photoTagsFromUrl(){const settings=mergeUrlParamsIntoSettings(loadSettings(),new URL(window.location.href));const raw=(settings.shared.tags||'').trim().split(/\s+/).filter(Boolean);const rating=(settings.shared.rating||'').trim().toLowerCase();const ratio=(settings.shared.ratio||'').trim().toLowerCase();const tags=[settings.shared.sort==='score'?'order:score':'order:rank','-animated',...raw];if(rating==='s'||rating==='q'||rating==='e')tags.push('rating:'+rating);if(ratio==='vertical')tags.push('ratio:<1');if(ratio==='landscape')tags.push('ratio:>1');return tags.join(' ');}function mapApiPost(post){const artists=post&&post.tags&&Array.isArray(post.tags.artist)?post.tags.artist.filter(Boolean):[];return{id:post.id,mediaUrl:post.file&&post.file.url?post.file.url:'',previewUrl:(post.preview&&post.preview.url)||(post.sample&&post.sample.url)||(post.file&&post.file.url)||'',ext:String(post.file&&post.file.ext?post.file.ext:'').toLowerCase(),sourceUrl:'https://e621.net/posts/'+post.id,artistText:artists.length?artists.join(', '):'Unknown artist'};}function buildLightboxSlide(post){const slide=document.createElement('div');slide.className='lightbox-slide';const image=document.createElement('img');image.alt='Expanded image '+(post.id||'');image.src=post.mediaUrl||post.previewUrl;image.addEventListener('load',()=>{downHint.classList.toggle('show',image.naturalHeight>image.naturalWidth*1.45);},{once:true});slide.appendChild(image);return slide;}function updateLightboxCredit(post){lightboxCredit.textContent='';const artist=document.createTextNode('Artist: '+post.artistText+' • ');const link=document.createElement('a');link.href=post.sourceUrl;link.target='_blank';link.rel='noreferrer noopener';link.textContent='View post';lightboxCredit.append(artist,link);}function setLightboxTrack(offsetPx,animated){lightboxTrack.classList.toggle('animating',Boolean(animated));lightboxTrack.style.transform='translate3d('+offsetPx+'px,0,0)';}function currentBase(){return allPosts[lightboxIndex-1]?-window.innerWidth:0;}function renderLightboxAt(index){if(index<0||index>=allPosts.length)return;lightboxIndex=index;const prev=allPosts[index-1]||null;const current=allPosts[index];const next=allPosts[index+1]||null;lightboxTrack.innerHTML='';if(prev)lightboxTrack.appendChild(buildLightboxSlide(prev));lightboxTrack.appendChild(buildLightboxSlide(current));if(next)lightboxTrack.appendChild(buildLightboxSlide(next));lightboxBaseX=currentBase();setLightboxTrack(lightboxBaseX,false);updateLightboxCredit(current);}function openLightbox(index){if(index<0||index>=allPosts.length)return;renderLightboxAt(index);lightbox.classList.add('open');}function closeLightbox(){lightbox.classList.remove('open');lightboxTrack.innerHTML='';lightboxIndex=-1;downHint.classList.remove('show');}function settleMove(delta){if(lightboxIndex<0)return;const next=lightboxIndex+delta;if(next<0||next>=allPosts.length){setLightboxTrack(lightboxBaseX,true);return;}const target=delta>0?lightboxBaseX-window.innerWidth:lightboxBaseX+window.innerWidth;setLightboxTrack(target,true);setTimeout(()=>{renderLightboxAt(next);},280);}function flushFromList(maxItems){let added=0;while(pendingPosts.length&&added<maxItems){const p=pendingPosts.shift();const src=p&&(p.previewUrl||p.mediaUrl);if(!src)continue;const postIndex=allPosts.push(p)-1;const t=document.createElement('article');t.className='tile';t.dataset.index=String(postIndex);const i=document.createElement('img');i.loading='lazy';i.src=src;i.alt='e621 image '+(p.id||'');t.appendChild(i);grid.appendChild(t);loaded++;added++;}status.textContent=loaded>0?('Loaded '+loaded+' photos • queue '+pendingPosts.length):'Loading photos…';}async function fetchNextListPage(){if(loading)return;loading=true;errorBox.hidden=true;status.textContent='Loading photos list…';const upstreamUrl=new URL('https://e621.net/posts.json');upstreamUrl.searchParams.set('limit','24');upstreamUrl.searchParams.set('page',String(page));upstreamUrl.searchParams.set('tags',photoTagsFromUrl());upstreamUrl.searchParams.set('_client','FurryReel/1.0 (contact: support@furryreel.com)');try{const res=await fetch(upstreamUrl.toString(),{headers:{Accept:'application/json'}});let payload=null;try{payload=await res.json()}catch(parseErr){throw new Error('Could not parse e621 response as JSON. status='+res.status+' '+res.statusText+' url='+upstreamUrl.toString())}if(!res.ok){throw new Error('Direct e621 error: http='+res.status+' details='+(payload&&payload.reason?payload.reason:'(none)')+' request='+upstreamUrl.toString())}const posts=Array.isArray(payload.posts)?payload.posts:[];const usable=posts.map(mapApiPost).filter((p)=>['jpg','jpeg','png','webp'].includes(p.ext)&&Boolean(p.mediaUrl||p.previewUrl));pendingPosts.push(...usable);if(!usable.length&&loaded===0){status.textContent='No static image posts on this page; auto-trying next page…';page++;scheduleFetch(350);loading=false;return;}flushFromList(18);page++;}catch(err){console.error('photo-grid load failed',{message:String(err&&err.message?err.message:err)});status.textContent='Could not load content right now. Try again shortly.';showError();}finally{loading=false;}}function scheduleFetch(delayMs){if(inflightTimer)clearTimeout(inflightTimer);inflightTimer=setTimeout(()=>{fetchNextListPage()},delayMs);}grid.addEventListener('click',(event)=>{const tile=event.target.closest('.tile');if(!tile)return;openLightbox(Number(tile.dataset.index||'-1'));});lightbox.addEventListener('click',(event)=>{if(event.target===lightbox||event.target===lightboxCredit)closeLightbox();});document.addEventListener('keydown',(event)=>{if(!lightbox.classList.contains('open'))return;if(event.key==='Escape')closeLightbox();if(event.key==='ArrowDown'||event.key==='ArrowRight')settleMove(1);if(event.key==='ArrowUp'||event.key==='ArrowLeft')settleMove(-1);});lightbox.addEventListener('touchstart',(event)=>{if(!lightbox.classList.contains('open'))return;lightboxTouchActive=true;lightboxTouchStartX=event.touches[0].clientX;lightboxTouchStartY=event.touches[0].clientY;lightboxBaseX=currentBase();lightboxTrack.classList.remove('animating');},{passive:true});lightbox.addEventListener('touchmove',(event)=>{if(!lightboxTouchActive)return;const dx=event.touches[0].clientX-lightboxTouchStartX;const dy=event.touches[0].clientY-lightboxTouchStartY;if(Math.abs(dx)>=Math.abs(dy)){event.preventDefault();setLightboxTrack(lightboxBaseX+dx,false);}},{passive:false});lightbox.addEventListener('touchend',(event)=>{if(!lightboxTouchActive)return;lightboxTouchActive=false;const dx=event.changedTouches[0].clientX-lightboxTouchStartX;const dy=event.changedTouches[0].clientY-lightboxTouchStartY;const threshold=window.innerWidth*0.4;if(Math.abs(dx)>=Math.abs(dy)){if(dx<=-threshold){settleMove(1);return;}if(dx>=threshold){settleMove(-1);return;}setLightboxTrack(lightboxBaseX,true);return;}setLightboxTrack(lightboxBaseX,true);},{passive:true});const io=new IntersectionObserver((e)=>{if(!e[0].isIntersecting)return;if(pendingPosts.length>8){flushFromList(18);return;}scheduleFetch(1400);},{rootMargin:'1000px'});const sentinel=document.createElement('div');grid.after(sentinel);io.observe(sentinel);fetchNextListPage();</script></div></body></html>`;
}


function renderSettingsPage(url) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Settings | e621 Reels</title><style>body.settings-page{margin:0;background:#0b0b10;color:#fff;font-family:Inter,system-ui,sans-serif;padding:20px}.settings-page .fr-nav-fallback{position:fixed;top:8px;left:8px;right:8px;display:flex;gap:8px;flex-wrap:wrap;z-index:55;padding:8px;border-radius:10px;background:rgba(12,12,18,.92);border:1px solid rgba(255,255,255,.18)}.settings-page .fr-nav-fallback a{color:#fff;text-decoration:none;padding:8px 10px;border-radius:8px}.settings-page .settings-shell{max-width:920px;margin:72px auto 20px;display:grid;gap:14px}.settings-page .settings-card{border:1px solid rgba(255,255,255,.16);border-radius:16px;background:#14141b;padding:16px}label{display:grid;gap:6px;margin-bottom:10px}input,select,button{font:inherit}input,select{background:#0e0e13;color:#fff;border:1px solid rgba(255,255,255,.2);padding:10px;border-radius:10px}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.settings-actions{display:flex;gap:10px;flex-wrap:wrap}.btn{border:1px solid rgba(255,255,255,.2);background:#1a1a24;color:#fff;border-radius:10px;padding:10px 12px;cursor:pointer}.primary{background:linear-gradient(135deg,#ff4d98,#ff7b4d);border:none}a{color:#ff73af}</style></head><body class="settings-page">${renderFloatingNav('settings')}<main class="settings-shell"><h1>Settings</h1><form id="settingsForm"><section class="settings-card"><h2>Shared search and filters</h2><label>Tags/search query<input id="sharedTags"/></label><div class="row"><label>Sort mode<select id="sharedSort"><option value="trending">Trending</option><option value="score">Top scored</option></select></label><label>Rating<select id="sharedRating"><option value="">Any</option><option value="s">Safe</option><option value="q">Questionable</option><option value="e">Explicit</option></select></label></div><div class="row"><label>Aspect ratio<select id="sharedRatio"><option value="">Any</option><option value="vertical">Vertical</option><option value="landscape">Landscape</option></select></label><label>Exclude tags (optional)<input id="sharedExclude" placeholder="tag1 tag2"/></label></div><button class="btn" type="button" id="resetShared">Reset shared filters</button></section><section class="settings-card"><h2>Reels settings</h2><div class="row"><label>Media fit<select id="reelsFit"><option value="cover">Fullscreen / cover</option><option value="contain">Contain</option></select></label><label>Default mute<select id="reelsMute"><option value="true">Muted</option><option value="false">Unmuted</option></select></label></div><div class="settings-actions"><button class="btn" type="button" id="resetOnboarding">Show quick controls again</button><button class="btn" type="button" id="resetReels">Reset Reels settings</button></div></section><section class="settings-card"><h2>Photos settings</h2><div class="row"><label>Grid density<select id="photosDensity"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label>Image fit<select id="photosFit"><option value="crop">Crop</option><option value="contain">Contain</option></select></label></div><button class="btn" type="button" id="resetPhotos">Reset Photos settings</button></section><section class="settings-card"><h2>Privacy/display settings</h2><label><input type="checkbox" id="syncUrl"/> Sync filters to URL for sharing</label><p>When enabled, tags/filters can appear in your URL and browser history. <a href="/privacy" data-page-nav>Read privacy policy</a>.</p></section><div class="settings-actions"><button class="btn primary" type="submit">Save & Apply</button><a class="btn" href="/" data-page-nav>View Reels</a><a class="btn" href="/photos" data-page-nav>View Photos</a></div></form></main><script>${renderFloatingNavScript()}</script><script>const DEFAULTS={shared:{tags:'',sort:'trending',rating:'',ratio:'',syncUrl:true,excludeTags:''},reels:{fitMedia:true,muted:true,onboardingSeen:false},photos:{gridDensity:'comfortable',fitImages:'crop'}};/* Loads saved settings with safe defaults. */function loadSettings(){try{const p=JSON.parse(localStorage.getItem('fr_settings_v1')||'{}');return {...DEFAULTS,...p,shared:{...DEFAULTS.shared,...(p.shared||{})},reels:{...DEFAULTS.reels,...(p.reels||{})},photos:{...DEFAULTS.photos,...(p.photos||{})}}}catch{return structuredClone(DEFAULTS)}}/* Saves one canonical settings object for all pages. */function saveSettings(settings){localStorage.setItem('fr_settings_v1',JSON.stringify(settings))}/* Lets SEO URL params override defaults when present. */function mergeUrlParamsIntoSettings(settings,url){const m=url.searchParams.get('mode');const t=(url.searchParams.get('tags')||'').trim();const r=(url.searchParams.get('rating')||'').trim().toLowerCase();const ra=(url.searchParams.get('ratio')||'').trim().toLowerCase();if(m==='score'||m==='trending')settings.shared.sort=m;if(t)settings.shared.tags=t;if(['s','q','e'].includes(r))settings.shared.rating=r;if(['vertical','landscape'].includes(ra))settings.shared.ratio=ra;return settings}/* Builds shareable URLs using current shared filters. */function applySettingsToUrl(settings,targetPath){const u=new URL(location.origin+targetPath);if(settings.shared.sort==='score')u.searchParams.set('mode','score');if(settings.shared.tags)u.searchParams.set('tags',settings.shared.tags);if(settings.shared.rating)u.searchParams.set('rating',settings.shared.rating);if(settings.shared.ratio)u.searchParams.set('ratio',settings.shared.ratio);return u.toString()}/* Reset helpers keep each section independent. */function resetSharedSettings(s){s.shared={...DEFAULTS.shared}}function resetReelsSettings(s){s.reels={...DEFAULTS.reels}}function resetPhotosSettings(s){s.photos={...DEFAULTS.photos}}let settings=mergeUrlParamsIntoSettings(loadSettings(),new URL(location.href));const q=(id)=>document.getElementById(id);function bind(){q('sharedTags').value=settings.shared.tags||'';q('sharedSort').value=settings.shared.sort||'trending';q('sharedRating').value=settings.shared.rating||'';q('sharedRatio').value=settings.shared.ratio||'';q('sharedExclude').value=settings.shared.excludeTags||'';q('reelsFit').value=settings.reels.fitMedia?'contain':'cover';q('reelsMute').value=String(settings.reels.muted!==false);q('photosDensity').value=settings.photos.gridDensity||'comfortable';q('photosFit').value=settings.photos.fitImages||'crop';q('syncUrl').checked=settings.shared.syncUrl!==false}bind();q('resetShared').onclick=()=>{resetSharedSettings(settings);bind()};q('resetReels').onclick=()=>{resetReelsSettings(settings);bind()};q('resetPhotos').onclick=()=>{resetPhotosSettings(settings);bind()};q('resetOnboarding').onclick=()=>{settings.reels.onboardingSeen=false;saveSettings(settings)};q('settingsForm').addEventListener('submit',(e)=>{e.preventDefault();settings.shared.tags=q('sharedTags').value.trim();settings.shared.sort=q('sharedSort').value;settings.shared.rating=q('sharedRating').value;settings.shared.ratio=q('sharedRatio').value;settings.shared.excludeTags=q('sharedExclude').value.trim();settings.reels.fitMedia=q('reelsFit').value==='contain';settings.reels.muted=q('reelsMute').value==='true';settings.photos.gridDensity=q('photosDensity').value;settings.photos.fitImages=q('photosFit').value;settings.shared.syncUrl=q('syncUrl').checked;saveSettings(settings);const from=new URLSearchParams(location.search).get('from');if(from==='photos'){location.href=settings.shared.syncUrl?applySettingsToUrl(settings,'/photos'):'/photos';return;}location.href=settings.shared.syncUrl?applySettingsToUrl(settings,'/'):'/';});</script></body></html>`;
}

function renderAboutPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>About | e621 Reels</title><style>body{margin:0;background:#0b0b10;color:#fff;font-family:Inter,system-ui,sans-serif;padding:20px}.global-header{display:flex;justify-content:flex-end;position:sticky;top:0;z-index:30}.global-menu-toggle{border:1px solid rgba(255,255,255,.16);background:#111;color:#fff;border-radius:10px;width:42px;height:42px;display:grid;place-items:center;cursor:pointer}.global-drawer{position:fixed;right:0;top:0;bottom:0;width:min(80vw,290px);display:grid;gap:6px;padding:82px 12px 20px;background:#141418;border-left:1px solid rgba(255,255,255,.18);transform:translateX(110%);transition:transform .22s ease;z-index:40}.global-drawer.open{transform:translateX(0)}.global-drawer a{color:#fff;text-decoration:none;padding:10px 12px;border-radius:10px}.global-drawer a:hover{background:rgba(255,255,255,.08)}a{color:#ff73af}.card{max-width:860px;margin:40px auto;padding:24px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:#14141b}p{line-height:1.55}body.page-transitioning{opacity:0;transition:opacity .22s ease}</style></head><body>${renderFloatingNav('about')}<div class="card"><h1>About this app</h1><p>This site is 100% AI-coded and built as an open source experiment. The purpose of the project is to explore what can be made with AI-assisted development, while keeping the result transparent, reusable and freely available.</p><p>I do not claim ownership over the underlying AI-generated code, third-party APIs, external services, or any platform data used by this site. This project is intended to be used as a learning resource, source reference, template, remix, or starting point for anyone who wants to build something similar. My view is that if something is made entirely through AI-generated code, it should be shared freely for public use and the general good.</p><p>That said, this position does not extend to AI-generated art. I believe AI-generated art is harmful, disrespectful to working artists, and a stain on creative communities globally. Code and technical scaffolding can be freely shared and reused; the exploitation of artists’ work without consent is a separate issue and should be treated with serious criticism.</p><p>This project is 100% open source. You are free to inspect it, learn from it, fork it, modify it, improve it, or use it as a base for your own work. View the source on <a href="https://github.com/lo-w-ol/e621reels/" target="_blank" rel="noopener noreferrer">GitHub</a>.</p><p>Use the burger menu on each page to switch between Reels, Photos, and this About page.</p></div><script>${renderFloatingNavScript()}</script></body></html>`;
}




const PRIVACY_CONTACT_EMAIL = 'owo_pounces_on@proton.me';

function renderPrivacyPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Privacy Policy | e621 Reels</title><style>body{margin:0;background:#0b0b10;color:#fff;font-family:Inter,system-ui,sans-serif;padding:20px}.global-header{display:flex;justify-content:flex-end;position:sticky;top:0;z-index:30}.global-menu-toggle{border:1px solid rgba(255,255,255,.16);background:#111;color:#fff;border-radius:10px;width:42px;height:42px;display:grid;place-items:center;cursor:pointer}.global-drawer{position:fixed;right:0;top:0;bottom:0;width:min(80vw,290px);display:grid;gap:6px;padding:82px 12px 20px;background:#141418;border-left:1px solid rgba(255,255,255,.18);transform:translateX(110%);transition:transform .22s ease;z-index:40}.global-drawer.open{transform:translateX(0)}.global-drawer a{color:#fff;text-decoration:none;padding:10px 12px;border-radius:10px}.global-drawer a:hover{background:rgba(255,255,255,.08)}.card{max-width:860px;margin:40px auto;padding:24px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:#14141b}h2{margin-top:24px}p,li{line-height:1.55}a{color:#ff73af}code{font-family:ui-monospace,Menlo,Consolas,monospace}body.page-transitioning{opacity:0;transition:opacity .22s ease}.updated{opacity:.8;font-size:.92rem}</style></head><body>${renderFloatingNav('privacy')}<div class="card"><h1>Privacy Policy</h1><p class="updated"><strong>Effective date:</strong> 2026-05-26</p><p>This Privacy Policy explains how this site handles information. It is written for risk reduction and transparency, not as a promise of complete legal compliance.</p><h2>Operator and contact</h2><p>This deployment is operated by an independent site operator. Contact: <a href="mailto:${PRIVACY_CONTACT_EMAIL}">${PRIVACY_CONTACT_EMAIL}</a>.</p><h2>Plain-language summary</h2><ul><li>No user accounts.</li><li>No first-party analytics SDK.</li><li>No ads.</li><li>No intentional sale/share of personal information.</li><li>No intentional user-profile database.</li><li>Uses third-party e621 API/content/media and Cloudflare infrastructure.</li></ul><h2>Who controls this site</h2><p>e621 Reels is an independent viewer interface. The operator of this deployment is the data controller only for information directly processed by this site.</p><h2>Data this site intentionally does not collect</h2><ul><li>No user accounts.</li><li>No first-party analytics SDKs or ad trackers.</li><li>No intentional sale of personal information.</li><li>No intentional storage of sensitive personal profile data.</li></ul><h2>How requests work</h2><ul><li>Reels, photos, and tag autocomplete are requested directly from <code>https://e621.net</code> from your browser.</li><li>The Cloudflare Worker serves app shell assets (HTML/CSS/JS) and does not proxy those content API requests in normal operation.</li></ul><h2>Third-party processing</h2><p>When you load content, your browser communicates directly with e621. e621 may receive and process standard request metadata such as IP address, user agent, referrer, and query tags according to their own terms and privacy policy.</p><h2>Cookies and local storage</h2><p>This site does not intentionally set tracking cookies. Browser or infrastructure-level technical storage may still occur (for example cache, session, and security functions outside this app logic).</p><h2>Legal bases and regional rights</h2><p>Where applicable law requires it, processing is limited to legitimate interests in delivering requested content and maintaining basic security/reliability. Depending on your jurisdiction (for example EEA/UK/California), you may have rights to access, deletion, correction, objection, portability, and non-discrimination. Because this site is designed to minimize first-party personal data, fulfillment may be limited to data actually controlled by this site.</p><h2>Children</h2><p>This site is not directed to children and is intended for audiences legally permitted to view the underlying content in their jurisdiction.</p><h2>Policy updates</h2><p>This policy may be updated from time to time. Material changes will be reflected by updating the effective date on this page.</p><h2>Important legal notice</h2><p>This page is a general transparency notice, not legal advice, and cannot guarantee immunity from legal claims. For formal compliance tailored to your business, consult a licensed attorney.</p><h2>Open source transparency</h2><p>The code is open source for inspection and audit on <a href="https://github.com/lo-w-ol/e621reels/" target="_blank" rel="noopener noreferrer">GitHub</a>.</p></div><script>${renderFloatingNavScript()}</script></body></html>`;
}

function renderFloatingNav(activePage) {
  return `<nav class="fr-nav-fallback" aria-label="Primary"><a href="/"${activePage === 'reels' ? ' aria-current="page"' : ''}>Reels</a><a href="/photos"${activePage === 'photos' ? ' aria-current="page"' : ''}>Photos</a><a href="/settings"${activePage === 'settings' ? ' aria-current="page"' : ''}>Settings</a><a href="/about"${activePage === 'about' ? ' aria-current="page"' : ''}>About</a><a href="/privacy"${activePage === 'privacy' ? ' aria-current="page"' : ''}>Privacy</a></nav><fr-floating-nav data-active="${activePage}"></fr-floating-nav>`;
}

function renderFloatingNavScript() {
  return `(() => {if (customElements.get('fr-floating-nav')) return;class FrFloatingNav extends HTMLElement {connectedCallback() {const active = this.getAttribute('data-active') || '';const shadow = this.attachShadow({ mode: 'open' });shadow.innerHTML = \`<style>:host{position:fixed;top:calc(env(safe-area-inset-top,0px) + 12px);right:calc(env(safe-area-inset-right,0px) + 12px);z-index:60}.fr-floating-nav__btn{width:46px;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.24);background:rgba(16,16,22,.82);color:#fff;cursor:pointer;font:600 22px/1 system-ui}.fr-floating-nav__btn:focus-visible{outline:2px solid #ffd36b;outline-offset:2px}.fr-floating-nav__panel{position:absolute;top:54px;right:0;min-width:180px;padding:8px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(12,12,18,.96);backdrop-filter:blur(10px);display:none;box-shadow:0 14px 36px rgba(0,0,0,.44)}.fr-floating-nav__panel[aria-hidden="false"]{display:grid;gap:4px}.fr-floating-nav__link{text-decoration:none;color:#fff;padding:10px 12px;border-radius:10px;font:500 14px/1.3 Inter,system-ui,sans-serif}.fr-floating-nav__link:hover,.fr-floating-nav__link:focus-visible{background:rgba(255,255,255,.1);outline:none}.fr-floating-nav__link[data-current="true"]{background:rgba(255,47,120,.2);border:1px solid rgba(255,47,120,.45)}@media (min-width:760px){.fr-floating-nav__btn{width:42px;height:42px}}</style><button type="button" class="fr-floating-nav__btn" aria-expanded="false" aria-label="Open navigation menu">☰</button><div class="fr-floating-nav__panel" aria-hidden="true" role="menu"><a class="fr-floating-nav__link" href="/" data-link="reels">Reels</a><a class="fr-floating-nav__link" href="/photos" data-link="photos">Photos</a><a class="fr-floating-nav__link" href="/settings" data-link="settings">Settings</a><a class="fr-floating-nav__link" href="/about" data-link="about">About</a><a class="fr-floating-nav__link" href="/privacy" data-link="privacy">Privacy</a></div>\`;const btn=shadow.querySelector('.fr-floating-nav__btn');const panel=shadow.querySelector('.fr-floating-nav__panel');shadow.querySelectorAll('.fr-floating-nav__link').forEach((link)=>{if(link.getAttribute('data-link')===active){link.setAttribute('data-current','true');link.setAttribute('aria-current','page');}});const close=()=>{panel.setAttribute('aria-hidden','true');btn.setAttribute('aria-expanded','false');};const open=()=>{panel.setAttribute('aria-hidden','false');btn.setAttribute('aria-expanded','true');};btn.addEventListener('click',(e)=>{e.stopPropagation();(panel.getAttribute('aria-hidden')==='true')?open():close();});shadow.addEventListener('keydown',(e)=>{if(e.key==='Escape')close();});document.addEventListener('click',(e)=>{if(!e.composedPath().includes(this))close();});shadow.querySelectorAll('.fr-floating-nav__link').forEach((anchor)=>anchor.addEventListener('click',(event)=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();close();const href=anchor.href;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){window.location.href=href;return;}if(document.startViewTransition){document.startViewTransition(()=>{window.location.href=href;});return;}window.location.href=href;}));const fallback=document.querySelector('.fr-nav-fallback');if(fallback)fallback.setAttribute('hidden','hidden');}}customElements.define('fr-floating-nav', FrFloatingNav);})();`;
}

function buildSeo(url) {
  const mode = url.searchParams.get('mode') === 'score' ? 'score' : 'trending';
  const tags = sanitizeTags(url.searchParams.get('tags') || '');
  const rating = sanitizeRating(url.searchParams.get('rating'));
  const ratio = sanitizeRatioFilter(url.searchParams.get('ratio'));
  const canonical = new URL(url.toString());
  canonical.protocol = 'https:';
  canonical.host = 'furryreel.com';
  canonical.port = '';
  canonical.pathname = '/';
  canonical.search = '';
  canonical.hash = '';
  if (mode !== 'trending') canonical.searchParams.set('mode', mode);
  if (tags.length) canonical.searchParams.set('tags', tags.join(' '));
  if (rating) canonical.searchParams.set('rating', rating);
  if (ratio) canonical.searchParams.set('ratio', ratio);

  const humanTags = tags.map(formatTagLabel);
  const modeLabel = mode === 'score' ? 'top scored' : 'trending';
  const ratingLabel = rating ? `Rated ${rating.toUpperCase()}` : 'All ratings';
  const ratioLabel = ratio === 'vertical' ? 'portrait / vertical only' : ratio === 'landscape' ? 'landscape only' : 'any aspect ratio';
  const titleParts = [];
  if (humanTags.length) titleParts.push(humanTags.join(', '));
  titleParts.push(mode === 'score' ? 'Top scored furry reels' : 'Trending furry reels');
  const title = titleParts.join(' • ') + ' | FurryReel';
  const description = humanTags.length
    ? `Browse ${modeLabel} animated furry reels for ${humanTags.join(', ')} on FurryReel. Swipe through indexed video posts, GIFs, and image previews with ${ratingLabel.toLowerCase()} and ${ratioLabel}.`
    : `Browse ${modeLabel} animated furry reels on FurryReel. Explore indexable e621-powered video posts, GIFs, and image previews built for fast swiping on furryreel.com with ${ratioLabel}.`;
  const heading = humanTags.length
    ? `${humanTags.join(', ')} furry reels`
    : 'FurryReel animated furry feed';
  const indexingText = `FurryReel serves a crawlable landing page, canonical URLs, sitemap.xml, robots.txt, and structured metadata so search engines can index this app experience.`;

  return {
    title,
    description,
    heading,
    indexingText,
    canonicalUrl: canonical.toString(),
    initialModeForClient: mode,
    initialTagsForClient: tags.join(' '),
    initialRatingForClient: rating,
    initialRatioForClient: ratio,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: canonical.toString(),
      isPartOf: {
        '@type': 'WebSite',
        name: 'FurryReel',
        url: 'https://furryreel.com/',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://furryreel.com/?tags={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
      about: tags.length ? humanTags : ['animated', 'furry'],
      genre: ['animation', 'short-form video'],
    },
  };
}

function buildLandingLinks() {
  const links = [
    { href: '/', label: 'Trending animated furry reels' },
    { href: '/?mode=score', label: 'Top scored furry reels' },
    { href: '/?tags=wolf', label: 'Wolf furry reels' },
    { href: '/?tags=fox', label: 'Fox furry reels' },
    { href: '/?tags=dragon', label: 'Dragon furry reels' },
    { href: '/?tags=canine', label: 'Canine furry reels' },
  ];

  return links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('');
}

function renderRobotsTxt() {
  return ['User-agent: *', 'Allow: /', 'Sitemap: https://furryreel.com/sitemap.xml'].join('\n');
}

function renderSitemapXml() {
  const urls = [
    'https://furryreel.com/',
    'https://furryreel.com/?mode=score',
    'https://furryreel.com/?tags=wolf',
    'https://furryreel.com/?tags=fox',
    'https://furryreel.com/?tags=dragon',
    'https://furryreel.com/?tags=canine',
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map((entry) => `  <url><loc>${escapeHtml(entry)}</loc></url>`)
    .join('\n')}
</urlset>`;
}
