import { modules } from './registry.js';
import { initRouter, currentRoute } from './router.js';
import { renderNavigation, renderQuickAccessSettings } from './navigation.js';
import { initPdfExport } from './pdfExport.js';
import heatingCooling from '../modules/heating-cooling/index.js';
import ventilation from '../modules/ventilation/index.js';
import pipeSizing from '../modules/pipe-sizing/index.js';
import unitConverter from '../modules/unit-converter/index.js';
import heatRecovery from '../modules/heat-recovery/index.js';
import hxDiagram from '../modules/hx-diagram/index.js';

[heatingCooling, ventilation, heatRecovery, hxDiagram, pipeSizing, unitConverter].forEach(module => modules.register(module));

const app = document.getElementById('app');
function render(id){
  const module = modules.get(id);
  if (!module) return;
  renderNavigation(id);
  module.mount(app);
  app.focus({ preventScroll:true });
}
initRouter(render);
renderQuickAccessSettings();
initPdfExport({ modules, currentRoute });
window.addEventListener('resize', () => renderNavigation(currentRoute()));

const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');

let settingsScrollY = 0;
let lastFocusedElement = null;

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
  settingsPanel?.querySelectorAll('.settings-submenu[open]').forEach(details => {
    if (details !== except) details.open = false;
  });
}

function setSettingsOpen(open) {
  if (!settingsPanel || !settingsButton) return;

  if (open) {
    lastFocusedElement = document.activeElement;
    settingsPanel.hidden = false;
    settingsPanel.removeAttribute('hidden');
    settingsButton.setAttribute('aria-expanded', 'true');
    settingsPanel.setAttribute('aria-modal', 'true');
    lockPageScroll();
    requestAnimationFrame(() => {
      settingsPanel.querySelector('.settings-panel__body')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      closeSettings?.focus?.({ preventScroll: true });
    });
    return;
  }

  settingsPanel.hidden = true;
  settingsPanel.setAttribute('hidden', '');
  settingsButton.setAttribute('aria-expanded', 'false');
  settingsPanel.removeAttribute('aria-modal');
  closeAllSubmenus();
  unlockPageScroll();
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

// Defensive cleanup in case an older cached build left the app locked.
unlockPageScroll();
setSettingsOpen(false);

settingsButton?.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  setSettingsOpen(settingsPanel?.hidden !== false);
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
      const body = settingsPanel.querySelector('.settings-panel__body');
      if (!body) return;
      const panelRect = body.getBoundingClientRect();
      const detailsRect = details.getBoundingClientRect();
      const delta = detailsRect.top - panelRect.top - 6;
      body.scrollTo({ top: body.scrollTop + delta, behavior: 'smooth' });
    });
  });
});

document.addEventListener('click', event => {
  if (settingsPanel?.hidden) return;
  if (event.target.closest('#settingsButton') || event.target.closest('#settingsPanel')) return;
  setSettingsOpen(false);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setSettingsOpen(false);
});

// iOS/Safari: background remains locked; only the settings drawer body may scroll.
document.addEventListener('touchmove', event => {
  if (!document.body.classList.contains('settings-open')) return;
  const scrollHost = event.target.closest('.settings-panel__body');
  if (scrollHost) {
    const canScroll = scrollHost.scrollHeight > scrollHost.clientHeight;
    if (canScroll) return;
  }
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
    const stored = sessionStorage.getItem('techcalc-active-cache');
    if (stored !== cacheName) {
      sessionStorage.setItem('techcalc-active-cache', cacheName);
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(registration => registration.update());
  });
}
