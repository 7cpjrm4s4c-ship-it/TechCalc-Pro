import { modules } from './registry.js';
import { initRouter, currentRoute, navigate } from './router.js';
import { renderNavigation, renderQuickAccessSettings } from './navigation.js';
import heatingCoolingConfig from '../modules/heating-cooling/config.js';
import ventilationConfig from '../modules/ventilation/config.js';
import pipeSizingConfig from '../modules/pipe-sizing/config.js';
import unitConverterConfig from '../modules/unit-converter/config.js';
import heatRecoveryConfig from '../modules/heat-recovery/config.js';
import hxDiagramConfig from '../modules/hx-diagram/config.js';
import drinkingWaterConfig from '../modules/drinking-water/config.js';
import pressureHoldingConfig from '../modules/pressure-holding/config.js';
import bufferStorageConfig from '../modules/buffer-storage/config.js';
import wastewaterConfig from '../modules/wastewater/config.js';
import rainwaterConfig from '../modules/rainwater/config.js';
import { restoreSessionSnapshot, saveSessionSnapshot } from './projectStorage.js';
import { createModuleLifecycleAdapter } from './moduleLifecycleAdapter.js';
import { createModuleRuntime } from './moduleRuntime.js';
import { trackGlobalEventListener } from './eventManager.js';
import { initializeThemeController } from '../platform/shell/themeController.js';
import { initializeSettingsController } from '../platform/shell/settingsController.js';

const lazyModules = [
  { config: heatingCoolingConfig, path: '../modules/heating-cooling/index.js' },
  { config: ventilationConfig, path: '../modules/ventilation/index.js' },
  { config: pressureHoldingConfig, path: '../modules/pressure-holding/index.js' },
  { config: bufferStorageConfig, path: '../modules/buffer-storage/index.js' },
  { config: heatRecoveryConfig, path: '../modules/heat-recovery/index.js' },
  { config: hxDiagramConfig, path: '../modules/hx-diagram/index.js' },
  { config: pipeSizingConfig, path: '../modules/pipe-sizing/index.js' },
  { config: unitConverterConfig, path: '../modules/unit-converter/index.js' },
  { config: drinkingWaterConfig, path: '../modules/drinking-water/index.js' },
  { config: wastewaterConfig, path: '../modules/wastewater/index.js' },
  { config: rainwaterConfig, path: '../modules/rainwater/index.js' },
];

const moduleCache = new Map();
const preloadedModuleIds = new Set();

function loadLazyModule(config, path) {
  let loaded = moduleCache.get(config.id);
  if (!loaded) {
    loaded = import(path)
      .then(mod => mod.default || mod)
      .catch(error => {
        moduleCache.delete(config.id);
        preloadedModuleIds.delete(config.id);
        throw error;
      });
    moduleCache.set(config.id, loaded);
  }
  return loaded;
}

function preloadLazyModule(config, path) {
  if (!config?.id || preloadedModuleIds.has(config.id)) return;
  preloadedModuleIds.add(config.id);
  loadLazyModule(config, path).catch(error => {
    console.warn(`Modul konnte nicht vorgeladen werden: ${config.id}`, error);
  });
}

function scheduleLazyModulePreload() {
  const preload = () => lazyModules.forEach(({ config, path }) => preloadLazyModule(config, path));
  if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 1500 });
  else window.setTimeout(preload, 250);
}

const currentRouteConfig = lazyModules.find(({ config }) => config.id === currentRoute());
if (currentRouteConfig) preloadLazyModule(currentRouteConfig.config, currentRouteConfig.path);

function registerLazyModule({ config, path, module: eagerModule }) {
  if (eagerModule) {
    modules.register({ config, mount: createModuleLifecycleAdapter(config.id, eagerModule.mount) });
    return;
  }

  modules.register({
    config,
    async mount(root) {
      const renderToken = root?.dataset?.renderToken || '';
      const module = await loadLazyModule(config, path);
      if (renderToken && root?.dataset?.renderToken !== renderToken) {
        return () => {};
      }
      if (!module || typeof module.mount !== 'function') {
        throw new Error(`Modul ${config.id} konnte nicht initialisiert werden.`);
      }
      return createModuleLifecycleAdapter(config.id, module.mount)(root);
    }
  });
}

lazyModules.forEach(registerLazyModule);

restoreSessionSnapshot();
trackGlobalEventListener(window, 'pageshow', event => {
  if (event.persisted) restoreSessionSnapshot();
});

function persistSessionBeforeLeaving() {
  saveSessionSnapshot();
}

trackGlobalEventListener(window, 'pagehide', persistSessionBeforeLeaving, { capture: true });
trackGlobalEventListener(window, 'beforeunload', persistSessionBeforeLeaving, { capture: true });
trackGlobalEventListener(document, 'visibilitychange', () => {
  if (document.visibilityState === 'hidden') persistSessionBeforeLeaving();
});
trackGlobalEventListener(document, 'click', event => {
  const link = event.target.closest?.('a[href]');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  const target = link.getAttribute('target') || '';
  const external = target === '_blank' || /^https?:\/\//i.test(href);
  if (external) persistSessionBeforeLeaving();
}, { capture: true });


const NAV_INTERACTIVE_SELECTOR = '.module-nav [data-module-id], #overflowMenu [data-module-id]';
const NAV_MOVE_TOLERANCE_PX = 10;
let navPointerGesture = null;
let navLastTapWasScroll = false;
let navLastTapAt = 0;

function navPoint(event) {
  if (!event) return null;
  return { x: Number(event.clientX || 0), y: Number(event.clientY || 0), pointerId: event.pointerId };
}

function moduleNavButtonFromEvent(event) {
  return event.target?.closest?.(NAV_INTERACTIVE_SELECTOR) || null;
}

function commitGlobalModuleNav(button, event) {
  if (!button?.dataset?.moduleId) return false;
  const id = button.dataset.moduleId;
  const root = document.getElementById('app');
  const isMountedActive = root?.dataset?.activeModuleId === id && !root?.hasAttribute?.('aria-busy');
  const isPendingActive = root?.dataset?.pendingModuleId === id && root?.hasAttribute?.('aria-busy');
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();

  const overflow = document.getElementById('overflowMenu');
  if (overflow) overflow.hidden = true;
  if (isMountedActive || isPendingActive) return true;
  navigate(id);
  return true;
}

function onGlobalNavPointerDown(event) {
  const button = moduleNavButtonFromEvent(event);
  if (!button) return;
  const point = navPoint(event);
  navPointerGesture = point ? { ...point, button, moved: false } : null;
  navLastTapWasScroll = false;
}

function onGlobalNavPointerMove(event) {
  if (!navPointerGesture) return;
  if (navPointerGesture.pointerId !== undefined && event.pointerId !== undefined && navPointerGesture.pointerId !== event.pointerId) return;
  const point = navPoint(event);
  if (!point) return;
  const dx = Math.abs(point.x - navPointerGesture.x);
  const dy = Math.abs(point.y - navPointerGesture.y);
  if (dx > NAV_MOVE_TOLERANCE_PX || dy > NAV_MOVE_TOLERANCE_PX) {
    navPointerGesture.moved = true;
    navLastTapWasScroll = true;
    navLastTapAt = Date.now();
  }
}

function onGlobalNavPointerCancel() {
  navPointerGesture = null;
  navLastTapWasScroll = true;
  navLastTapAt = Date.now();
}

function onGlobalNavPointerUp(event) {
  const button = moduleNavButtonFromEvent(event);
  if (!button) return;
  if (navPointerGesture?.moved) {
    navPointerGesture = null;
    navLastTapWasScroll = true;
    navLastTapAt = Date.now();
    return;
  }
  navPointerGesture = null;
  // Deliberately do not navigate on pointerup. The click event is the single
  // route-change entry point for mouse, touch and keyboard activation. Keeping
  // pointerup passive prevents a route from being marked active before the
  // module content mount has actually completed.
}

function onGlobalNavClick(event) {
  const button = moduleNavButtonFromEvent(event);
  if (!button) return;
  if (navLastTapWasScroll && Date.now() - navLastTapAt < 550) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    navLastTapWasScroll = false;
    return;
  }
  navLastTapWasScroll = false;
  commitGlobalModuleNav(button, event);
}

trackGlobalEventListener(document, 'pointerdown', onGlobalNavPointerDown, true);
trackGlobalEventListener(document, 'pointermove', onGlobalNavPointerMove, { capture: true, passive: true });
trackGlobalEventListener(document, 'pointercancel', onGlobalNavPointerCancel, true);
trackGlobalEventListener(document, 'pointerup', onGlobalNavPointerUp, true);
trackGlobalEventListener(document, 'click', onGlobalNavClick, true);


const app = document.getElementById('app');
const moduleRuntime = createModuleRuntime({
  root: app,
  modules,
  renderNavigation,
  loadingView() {
    return '<div class="card tc-module-loading" role="status">Modul wird geladen...</div>';
  },
  loadingDelayMs: 180
});

function render(id){
  if (!modules.get(id)) return Promise.resolve(false);
  return moduleRuntime.mount(id);
}
initRouter(render);
renderQuickAccessSettings();
scheduleLazyModulePreload();

trackGlobalEventListener(document, 'techcalc-project-loaded', () => {
  render(currentRoute());
});

let pdfExportReady;
function ensurePdfExport() {
  if (!pdfExportReady) {
    pdfExportReady = import('./pdfExport.js')
      .then(({ initPdfExport }) => initPdfExport({ modules, currentRoute }))
      .catch(error => {
        pdfExportReady = null;
        console.error('PDF export initialization failed:', error);
      });
  }
  return pdfExportReady;
}

let resizeRaf = 0;
trackGlobalEventListener(window, 'resize', () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    renderNavigation(currentRoute());
  });
}, { passive: true });

const settingsPanel = document.getElementById('settingsPanel');

initializeThemeController({ root: settingsPanel || document });

const APP_VERSION = '1.3.0-rc.1';
const FEEDBACK_ENDPOINT = 'https://formspree.io/f/meedowlv';

function initFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  if (!form) return;
  const status = document.getElementById('feedbackStatus');
  const submit = document.getElementById('feedbackSubmit');

  function setStatus(message, type = '') {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  }

  function buildPayload() {
    const data = new FormData(form);
    data.set('version', APP_VERSION);
    data.set('route', currentRoute());
    data.set('userAgent', navigator.userAgent || '');
    data.set('timestamp', new Date().toISOString());
    return data;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('', '');
    if (!form.reportValidity()) return;

    submit.disabled = true;
    submit.textContent = 'Sende …';
    setStatus('Feedback wird gesendet …', 'pending');

    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        body: buildPayload(),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree HTTP ${response.status}`);
      form.reset();
      const subject = document.getElementById('feedbackSubject');
      if (subject) subject.value = 'TechCalc Pro Feedback';
      setStatus('Feedback wurde gesendet. Danke!', 'success');
    } catch (error) {
      console.error('Feedback konnte nicht gesendet werden:', error);
      setStatus('Feedback konnte nicht direkt gesendet werden. Bitte später erneut versuchen.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Feedback senden';
    }
  });
}

initFeedbackForm();

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[char]));
}

function parseReleaseNotes(markdown = '') {
  const lines = markdown.split(/\r?\n/);
  const notes = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,3}\s+(?:TechCalc\s+Pro\s+)?(?:Version\s+)?([0-9]+\.[0-9]+\.[0-9]+(?:[-.]rc\.?\d+)?)\s*(?:[-–]\s*(.*))?$/i);
    if (heading) {
      current = { version: heading[1], title: heading[2] || '', items: [] };
      notes.push(current);
      continue;
    }
    if (!current) continue;
    const item = line.replace(/^[-*]\s+/, '').trim();
    if (item && !item.startsWith('#')) current.items.push(item);
  }

  return notes;
}

function renderReleaseNotes(notes) {
  const host = document.getElementById('releaseNotesDynamic');
  if (!host) return;
  if (!notes?.length) {
    host.innerHTML = '<p>Release Notes konnten nicht geladen werden.</p>';
    return;
  }
  host.innerHTML = notes.slice(0, 18).map(note => `
    <div class="release-note">
      <strong>${escapeHtml(note.version)}${note.title ? ` · ${escapeHtml(note.title)}` : ''}</strong>
      <small>${escapeHtml(note.items.slice(0, 4).join(' '))}</small>
    </div>
  `).join('');
}

async function loadReleaseNotes() {
  const versionHost = document.querySelector('[data-app-version-current]');
  if (versionHost) versionHost.textContent = APP_VERSION;

  try {
    const response = await fetch(`./RELEASE_NOTES.md?v=${encodeURIComponent(APP_VERSION)}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) throw new Error(`Release Notes HTTP ${response.status}`);
    const markdown = await response.text();
    renderReleaseNotes(parseReleaseNotes(markdown));
  } catch (error) {
    console.warn('Release Notes konnten nicht dynamisch geladen werden.', error);
    const fallback = document.getElementById('releaseNotesFallback');
    if (fallback) renderReleaseNotes(parseReleaseNotes(fallback.textContent || ''));
  }
}

loadReleaseNotes();

// Bind PDF export and project actions as soon as the app is ready.
// The menu may be opened and a button tapped before lazy initialization has finished.
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => ensurePdfExport());
} else {
  setTimeout(() => ensurePdfExport(), 0);
}

initializeSettingsController({ settingsPanel, ensurePdfExport });

const header = document.querySelector('.app-header');
function updateHeaderTransparency(){
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}
trackGlobalEventListener(window, 'scroll', updateHeaderTransparency, { passive: true });
updateHeaderTransparency();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'TECHCALC_CACHE_UPDATED') return;
    const cacheName = event.data.cache || 'updated';
    sessionStorage.setItem('techcalc-active-cache', cacheName);
    // Kein automatischer Reload: Beim Zurückwechseln aus dem PDF-Export dürfen
    // aktuelle Berechnungsergebnisse in der Session nicht verloren gehen.
  });

  trackGlobalEventListener(window, 'load', () => {
    navigator.serviceWorker.register(`./service-worker.js?v=${encodeURIComponent(APP_VERSION)}`).then(registration => registration.update());
  });
}
