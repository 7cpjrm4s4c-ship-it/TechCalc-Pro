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

function setSettingsOpen(open) {
  if (!settingsPanel || !settingsButton) return;
  settingsPanel.hidden = !open;
  settingsButton.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('settings-open', open);
}

setSettingsOpen(false);

settingsButton?.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  setSettingsOpen(settingsPanel.hidden);
});

closeSettings?.addEventListener('click', event => {
  event.preventDefault();
  setSettingsOpen(false);
});

settingsPanel?.addEventListener('click', event => {
  event.stopPropagation();
});

document.addEventListener('click', event => {
  if (settingsPanel?.hidden) return;
  if (event.target.closest('#settingsButton') || event.target.closest('#settingsPanel')) return;
  setSettingsOpen(false);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setSettingsOpen(false);
});

// Während das Einstellungsmenü offen ist, darf auf Mobilgeräten nur der
// Menüinhalt scrollen. Der App-Hintergrund bleibt fixiert.
document.addEventListener('touchmove', event => {
  if (!document.body.classList.contains('settings-open')) return;
  if (event.target.closest('.settings-panel__body')) return;
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
