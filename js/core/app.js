import { modules } from './registry.js';
import { initRouter, currentRoute } from './router.js';
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
import { restoreSessionSnapshot } from './projectStorage.js';

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
];

const moduleCache = new Map();
function registerLazyModule({ config, path, module: eagerModule }) {
  if (eagerModule) {
    modules.register({ config, mount: eagerModule.mount });
    return;
  }

  modules.register({
    config,
    async mount(root) {
      let loaded = moduleCache.get(config.id);
      if (!loaded) {
        loaded = import(path).then(mod => mod.default || mod);
        moduleCache.set(config.id, loaded);
      }
      const module = await loaded;
      if (!module || typeof module.mount !== 'function') {
        throw new Error(`Modul ${config.id} konnte nicht initialisiert werden.`);
      }
      return module.mount(root);
    }
  });
}

lazyModules.forEach(registerLazyModule);

restoreSessionSnapshot();
window.addEventListener('pageshow', event => {
  if (event.persisted) restoreSessionSnapshot();
});

const app = document.getElementById('app');
let renderToken = 0;
async function render(id){
  const module = modules.get(id);
  if (!module) return;
  const token = ++renderToken;
  renderNavigation(id);
  app.setAttribute('aria-busy', 'true');
  try {
    await module.mount(app);
  } catch (error) {
    console.error(`Modul konnte nicht geladen werden: ${id}`, error);
    app.innerHTML = '<div class="module-error card">Modul konnte nicht geladen werden.</div>';
  } finally {
    if (token === renderToken) {
      app.removeAttribute('aria-busy');
      app.focus({ preventScroll:true });
    }
  }
}
initRouter(render);
renderQuickAccessSettings();

document.addEventListener('techcalc-project-loaded', () => {
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
window.addEventListener('resize', () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    renderNavigation(currentRoute());
  });
}, { passive: true });

const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const settingsBody = settingsPanel?.querySelector('.settings-panel__body');
const THEME_STORAGE_KEY = 'techcalc-theme-mode';

function applyThemeMode(mode = sessionStorage.getItem(THEME_STORAGE_KEY) || 'system') {
  const value = ['dark', 'light', 'system'].includes(mode) ? mode : 'system';
  if (value === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', value);
  }
  sessionStorage.setItem(THEME_STORAGE_KEY, value);
  document.querySelectorAll('.theme-switch__option').forEach(item => {
    const active = item.dataset.theme === value;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
}

applyThemeMode();


// Bind PDF export and project actions as soon as the app is ready.
// The menu may be opened and a button tapped before lazy initialization has finished.
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => ensurePdfExport());
} else {
  setTimeout(() => ensurePdfExport(), 0);
}

let settingsScrollY = 0;
let lastFocusedElement = null;

function isSettingsOpen() {
  return Boolean(settingsPanel?.classList.contains('is-open'));
}

function lockPageScroll() {
  settingsScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.classList.add('settings-open');
  document.body.classList.add('settings-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${settingsScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function unlockPageScroll() {
  document.documentElement.classList.remove('settings-open');
  document.body.classList.remove('settings-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, settingsScrollY || 0);
}

function closeAllSubmenus(except = null) {
  settingsPanel?.querySelectorAll('.settings-submenu').forEach(details => {
    if (details !== except) details.open = false;
  });
}

function setSettingsOpen(open) {
  if (!settingsPanel || !settingsButton) return;

  if (open) {
    closeAllSubmenus();
    lastFocusedElement = document.activeElement;
    settingsPanel.hidden = false;
    settingsPanel.removeAttribute('hidden');
    settingsPanel.classList.add('is-open');
    settingsButton.setAttribute('aria-expanded', 'true');
    settingsPanel.setAttribute('aria-modal', 'true');
    lockPageScroll();
    ensurePdfExport();
    requestAnimationFrame(() => {
      settingsBody?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      closeSettings?.focus?.({ preventScroll: true });
    });
    return;
  }

  closeAllSubmenus();
  settingsPanel.classList.remove('is-open');
  settingsPanel.hidden = true;
  settingsPanel.setAttribute('hidden', '');
  settingsButton.setAttribute('aria-expanded', 'false');
  settingsPanel.removeAttribute('aria-modal');
  unlockPageScroll();
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

// Defensive cleanup in case an older cached build left the app locked.
settingsPanel?.classList.remove('is-open');
unlockPageScroll();
setSettingsOpen(false);

settingsButton?.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  setSettingsOpen(!isSettingsOpen());
});

closeSettings?.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  setSettingsOpen(false);
});

settingsPanel?.addEventListener('click', event => {
  event.stopPropagation();
});

settingsPanel?.querySelectorAll('.settings-submenu').forEach(details => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    closeAllSubmenus(details);
    requestAnimationFrame(() => {
      const body = settingsBody;
      if (!body) return;
      const summary = details.querySelector('summary');
      const bodyRect = body.getBoundingClientRect();
      const detailsRect = details.getBoundingClientRect();
      const summaryRect = summary?.getBoundingClientRect() || detailsRect;
      const bottomOverflow = detailsRect.bottom - bodyRect.bottom + 24;
      const topOverflow = bodyRect.top - summaryRect.top + 10;
      if (topOverflow > 0) body.scrollBy({ top: -topOverflow, behavior: 'smooth' });
      else if (bottomOverflow > 0) body.scrollBy({ top: bottomOverflow, behavior: 'smooth' });
      if (details.offsetHeight > body.clientHeight) summary?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  });
});

settingsPanel?.querySelectorAll('.theme-switch__option').forEach(button => {
  button.addEventListener('click', () => {
    applyThemeMode(button.dataset.theme || 'system');
  });
});

document.addEventListener('click', event => {
  if (!isSettingsOpen()) return;
  if (event.target.closest('#settingsButton') || event.target.closest('#settingsPanel')) return;
  setSettingsOpen(false);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setSettingsOpen(false);
});

// iOS/Safari: lock the app background; only the drawer body is scrollable.
document.addEventListener('touchmove', event => {
  if (!isSettingsOpen()) return;
  const panel = event.target.closest('#settingsPanel');
  const scrollHost = event.target.closest('.settings-panel__body');
  if (panel && scrollHost && scrollHost.scrollHeight > scrollHost.clientHeight) return;
  event.preventDefault();
}, { passive: false });

const header = document.querySelector('.app-header');
function updateHeaderTransparency(){
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}
window.addEventListener('scroll', updateHeaderTransparency, { passive: true });
updateHeaderTransparency();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'TECHCALC_CACHE_UPDATED') return;
    const cacheName = event.data.cache || 'updated';
    sessionStorage.setItem('techcalc-active-cache', cacheName);
    // Kein automatischer Reload: Beim Zurückwechseln aus dem PDF-Export dürfen
    // aktuelle Berechnungsergebnisse in der Session nicht verloren gehen.
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(registration => registration.update());
  });
}
