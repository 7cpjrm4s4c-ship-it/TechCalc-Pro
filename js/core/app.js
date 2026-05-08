import { modules } from './registry.js';
import { initRouter, currentRoute } from './router.js';
import { renderNavigation, renderQuickAccessSettings } from './navigation.js';
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
window.addEventListener('resize', () => renderNavigation(currentRoute()));

const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
settingsButton.addEventListener('click', () => { settingsPanel.hidden = !settingsPanel.hidden; settingsButton.setAttribute('aria-expanded', String(!settingsPanel.hidden)); });
closeSettings.addEventListener('click', () => { settingsPanel.hidden = true; settingsButton.setAttribute('aria-expanded','false'); });


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
