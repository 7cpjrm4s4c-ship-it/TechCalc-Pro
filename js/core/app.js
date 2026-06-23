import { modules } from './registry.js';
import { initRouter, currentRoute, navigate } from './router.js';
import { renderNavigation, renderQuickAccessSettings } from './navigation.js';
import dashboardConfig from '../modules/dashboard/config.js';
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
import { initializeReleaseNotesController } from '../platform/shell/releaseNotesController.js';
import { initializeFeedbackController } from '../platform/shell/feedbackController.js';
import { initializeServiceWorkerController } from '../platform/shell/serviceWorkerController.js';
import { initializePerformanceController, markPerformance, measurePerformance, startPerformanceSpan } from '../platform/shell/performanceController.js';

const APP_VERSION = '1.3.1-beta.2';
initializePerformanceController({ appVersion: APP_VERSION });
const appInitStartMark = markPerformance('app:init:start', { appVersion: APP_VERSION });

const lazyModules = [
  { config: dashboardConfig, path: '../modules/dashboard/index.js' },
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
    const finishLoad = startPerformanceSpan('module:lazy-load', { moduleId: config.id });
    loaded = import(path)
      .then(mod => { finishLoad({ status: 'ok' }); return mod.default || mod; })
      .catch(error => {
        moduleCache.delete(config.id);
        preloadedModuleIds.delete(config.id);
        finishLoad({ status: 'error', error: error?.message || String(error) });
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
  const finish = startPerformanceSpan('module:switch', { moduleId: id });
  return Promise.resolve(moduleRuntime.mount(id))
    .then(result => { finish({ moduleId: id, status: 'ok' }); return result; })
    .catch(error => { finish({ moduleId: id, status: 'error', error: error?.message || String(error) }); throw error; });
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

initializeFeedbackController({
  appVersion: APP_VERSION,
  getRoute: currentRoute
});

initializeReleaseNotesController({ appVersion: APP_VERSION });

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

initializeServiceWorkerController({ appVersion: APP_VERSION });
const appInitEndMark = markPerformance('app:init:end', { appVersion: APP_VERSION });
measurePerformance('app:init', appInitStartMark, appInitEndMark, { appVersion: APP_VERSION });
