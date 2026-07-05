const MAX_LOG_ENTRIES = 300;
const LOG_KEY = 'tc-scroll-debug-log';
const ENABLE_QUERY = /(?:^|[?&])scrollDebug=1(?:&|$)/;

let enabled = false;
let seq = 0;
let lastUserEvent = null;
let lastFocusEvent = null;
let lastProgrammaticScroll = null;
let lastScrollY = 0;
let badge = null;
let jumpCount = 0;

function now() {
  return Math.round(performance?.now?.() || Date.now());
}

function route() {
  try {
    return document.getElementById('app')?.dataset?.activeModuleId || location.hash?.replace(/^#\/?/, '') || 'unknown';
  } catch { return 'unknown'; }
}

function shortSelector(element) {
  if (!element || element === window || element === document) return String(element === window ? 'window' : element === document ? 'document' : 'unknown');
  try {
    const parts = [];
    let node = element;
    while (node && node.nodeType === 1 && parts.length < 4) {
      let part = node.tagName.toLowerCase();
      if (node.id) part += `#${node.id}`;
      const dataKeys = ['field', 'moduleId', 'savedLoad', 'savedDelete', 'bufferSelect', 'rainwaterSelect', 'wrgSelect', 'hxSelect', 'lineSelect'];
      for (const key of dataKeys) {
        if (node.dataset?.[key] !== undefined) {
          part += `[data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}${node.dataset[key] ? `="${String(node.dataset[key]).slice(0, 32)}"` : ''}]`;
          break;
        }
      }
      if (node.classList?.length) part += `.${[...node.classList].slice(0, 3).join('.')}`;
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(' > ');
  } catch { return 'selector-error'; }
}

function readLogs() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}

function writeLogs(entries) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(-MAX_LOG_ENTRIES))); } catch { /* ignore quota */ }
}

function addLog(type, detail = {}) {
  if (!enabled) return;
  const entry = {
    seq: ++seq,
    t: now(),
    type,
    module: route(),
    y: Math.round(window.scrollY || document.documentElement?.scrollTop || 0),
    active: shortSelector(document.activeElement),
    lastUserEvent,
    lastFocusEvent,
    lastProgrammaticScroll,
    ...detail
  };
  const entries = readLogs();
  entries.push(entry);
  writeLogs(entries);
  if (type === 'scroll-jump') jumpCount += 1;
  updateBadge();
  try { console.debug('[TechCalc ScrollDebug]', entry); } catch { /* console optional */ }
}

function updateBadge() {
  if (!badge) return;
  badge.textContent = `ScrollDebug ${jumpCount}`;
}

function createBadge() {
  if (badge || !document.body) return;
  badge = document.createElement('button');
  badge.type = 'button';
  badge.textContent = 'ScrollDebug 0';
  badge.setAttribute('aria-label', 'Scroll debug log exportieren');
  Object.assign(badge.style, {
    position: 'fixed',
    zIndex: '2147483647',
    left: '10px',
    bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
    font: '600 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    padding: '8px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,.25)',
    background: 'rgba(255,255,255,.92)',
    color: '#111',
    boxShadow: '0 4px 16px rgba(0,0,0,.18)'
  });
  badge.addEventListener('click', async () => {
    const text = window.tcScrollDebugExport?.() || '[]';
    try {
      await navigator.clipboard?.writeText(text);
      badge.textContent = 'kopiert';
      setTimeout(updateBadge, 900);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.inset = '12px';
      area.style.zIndex = '2147483647';
      area.style.width = 'calc(100vw - 24px)';
      area.style.height = '45vh';
      document.body.appendChild(area);
      area.focus();
      area.select();
    }
  });
  document.body.appendChild(badge);
}

function patchProgrammaticScroll() {
  const originalScrollTo = window.scrollTo;
  if (typeof originalScrollTo === 'function' && !originalScrollTo.__tcScrollDebugPatched) {
    const patched = function patchedScrollTo(...args) {
      lastProgrammaticScroll = { t: now(), api: 'window.scrollTo', args: safeArgs(args) };
      addLog('programmatic-scroll', lastProgrammaticScroll);
      return originalScrollTo.apply(this, args);
    };
    patched.__tcScrollDebugPatched = true;
    window.scrollTo = patched;
  }

  const originalElementScrollTo = Element.prototype.scrollTo;
  if (typeof originalElementScrollTo === 'function' && !originalElementScrollTo.__tcScrollDebugPatched) {
    const patched = function patchedElementScrollTo(...args) {
      lastProgrammaticScroll = { t: now(), api: 'element.scrollTo', target: shortSelector(this), args: safeArgs(args) };
      addLog('programmatic-scroll', lastProgrammaticScroll);
      return originalElementScrollTo.apply(this, args);
    };
    patched.__tcScrollDebugPatched = true;
    Element.prototype.scrollTo = patched;
  }

  const originalScrollIntoView = Element.prototype.scrollIntoView;
  if (typeof originalScrollIntoView === 'function' && !originalScrollIntoView.__tcScrollDebugPatched) {
    const patched = function patchedScrollIntoView(...args) {
      lastProgrammaticScroll = { t: now(), api: 'scrollIntoView', target: shortSelector(this), args: safeArgs(args) };
      addLog('scroll-into-view', lastProgrammaticScroll);
      return originalScrollIntoView.apply(this, args);
    };
    patched.__tcScrollDebugPatched = true;
    Element.prototype.scrollIntoView = patched;
  }

  const focusProto = HTMLElement?.prototype;
  const originalFocus = focusProto?.focus;
  if (typeof originalFocus === 'function' && !originalFocus.__tcScrollDebugPatched) {
    const patched = function patchedFocus(...args) {
      lastFocusEvent = { t: now(), api: 'focus', target: shortSelector(this), args: safeArgs(args) };
      addLog('focus-call', lastFocusEvent);
      return originalFocus.apply(this, args);
    };
    patched.__tcScrollDebugPatched = true;
    focusProto.focus = patched;
  }
}

function safeArgs(args) {
  try {
    return args.map(arg => {
      if (arg == null || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'boolean') return arg;
      if (typeof arg === 'object') return JSON.parse(JSON.stringify(arg));
      return String(arg);
    });
  } catch { return ['unserializable']; }
}

function bindObservers() {
  lastScrollY = Math.round(window.scrollY || document.documentElement?.scrollTop || 0);

  const markUser = event => {
    lastUserEvent = {
      t: now(),
      type: event.type,
      target: shortSelector(event.target),
      x: Math.round(event.clientX || event.touches?.[0]?.clientX || event.changedTouches?.[0]?.clientX || 0),
      y: Math.round(event.clientY || event.touches?.[0]?.clientY || event.changedTouches?.[0]?.clientY || 0)
    };
    addLog('user-event', { event: lastUserEvent });
  };

  ['pointerdown', 'click', 'keydown', 'touchstart'].forEach(type => {
    document.addEventListener(type, markUser, { capture: true, passive: type !== 'keydown' });
  });

  document.addEventListener('focusin', event => {
    lastFocusEvent = { t: now(), api: 'focusin', target: shortSelector(event.target) };
    addLog('focusin', lastFocusEvent);
  }, true);

  window.addEventListener('scroll', () => {
    const y = Math.round(window.scrollY || document.documentElement?.scrollTop || 0);
    const delta = y - lastScrollY;
    const sinceUser = lastUserEvent ? now() - lastUserEvent.t : 999999;
    const sinceProgrammatic = lastProgrammaticScroll ? now() - lastProgrammaticScroll.t : 999999;
    const sinceFocus = lastFocusEvent ? now() - lastFocusEvent.t : 999999;
    if (Math.abs(delta) >= 24 && (sinceUser < 900 || sinceProgrammatic < 900 || sinceFocus < 900)) {
      addLog('scroll-jump', { from: lastScrollY, to: y, delta, sinceUser, sinceProgrammatic, sinceFocus });
    }
    lastScrollY = y;
  }, { passive: true, capture: true });
}

export function initializeScrollDiagnostics(options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__tcScrollDiagnosticsInitialized) return;
  const forced = options.force === true;
  enabled = forced || ENABLE_QUERY.test(location.search || '') || localStorage.getItem('tc-scroll-debug') === '1';
  window.__tcScrollDebugEnable = () => {
    localStorage.setItem('tc-scroll-debug', '1');
    location.reload();
  };
  window.__tcScrollDebugDisable = () => {
    localStorage.removeItem('tc-scroll-debug');
    localStorage.removeItem(LOG_KEY);
    location.reload();
  };
  window.tcScrollDebugExport = () => JSON.stringify(readLogs(), null, 2);
  window.tcScrollDebugClear = () => { localStorage.removeItem(LOG_KEY); seq = 0; jumpCount = 0; updateBadge(); };
  if (!enabled) return;
  window.__tcScrollDiagnosticsInitialized = true;
  writeLogs([]);
  addLog('diagnostics-start', { ua: navigator.userAgent, version: options.version || 'unknown' });
  patchProgrammaticScroll();
  bindObservers();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createBadge, { once: true });
  else createBadge();
}
