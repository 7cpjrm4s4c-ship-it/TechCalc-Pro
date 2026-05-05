import { modules } from './registry.js';
import { initRouter } from './router.js';
import { renderNavigation, renderQuickAccessSettings } from './navigation.js';
import heatingCooling from '../modules/heating-cooling/index.js';
import ventilation from '../modules/ventilation/index.js';
import pipeSizing from '../modules/pipe-sizing/index.js';
import unitConverter from '../modules/unit-converter/index.js';

[heatingCooling, ventilation, pipeSizing, unitConverter].forEach(module => modules.register(module.config.id, module));

const app = document.getElementById('app');
function render(id){ const module = modules.get(id); renderNavigation(id); module.mount(app); app.focus({ preventScroll:true }); }
initRouter(render);
renderQuickAccessSettings();
window.addEventListener('resize', () => renderNavigation(location.hash.replace('#','')));

const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
settingsButton.addEventListener('click', () => { settingsPanel.hidden = !settingsPanel.hidden; settingsButton.setAttribute('aria-expanded', String(!settingsPanel.hidden)); });
closeSettings.addEventListener('click', () => { settingsPanel.hidden = true; settingsButton.setAttribute('aria-expanded','false'); });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
