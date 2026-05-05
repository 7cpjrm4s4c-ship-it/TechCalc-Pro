import { modules } from './registry.js';
import { navigate } from './router.js';
import { loadPreferences, setMobileQuickAccess } from './preferences.js';

export function renderNavigation(activeId){
  const nav = document.getElementById('primaryNav');
  const overflow = document.getElementById('overflowMenu');
  const all = modules.all();
  const isMobile = matchMedia('(max-width: 767px)').matches;
  const quick = loadPreferences().mobileQuickAccess;
  const visibleIds = isMobile ? quick : all.filter(m => m.defaultVisible !== false).slice(0, Math.max(1, calcDesktopSlots()-1)).map(m=>m.id);
  const overflowModules = all.filter(m => !visibleIds.includes(m.id));
  const activeInOverflow = overflowModules.some(m => m.id === activeId);
  nav.innerHTML = visibleIds.map(id => tab(modules.get(id), activeId)).join('') + `<button class="module-tab ${activeInOverflow?'is-overflow-active':''}" data-overflow type="button">+</button>`;
  nav.querySelectorAll('[data-module-id]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.moduleId)));
  nav.querySelector('[data-overflow]').addEventListener('click', () => { overflow.hidden = !overflow.hidden; });
  overflow.innerHTML = overflowModules.map(m => `<button type="button" data-module-id="${m.id}">${m.title}</button>`).join('') || '<button type="button" disabled>Keine weiteren Module</button>';
  overflow.querySelectorAll('[data-module-id]').forEach(btn => btn.addEventListener('click', () => { overflow.hidden = true; navigate(btn.dataset.moduleId); }));
}
function tab(module, activeId){ return `<button class="module-tab ${module.id===activeId?'is-active':''}" data-module-id="${module.id}" type="button">${module.shortTitle ?? module.title}</button>`; }
function calcDesktopSlots(){ return Math.max(5, Math.floor(window.innerWidth / 260)); }
export function renderQuickAccessSettings(){
  const host = document.getElementById('quickAccessSettings');
  const prefs = loadPreferences();
  host.innerHTML = modules.all().map(m => `<label><span>${m.title}</span><input type="checkbox" value="${m.id}" ${prefs.mobileQuickAccess.includes(m.id)?'checked':''}></label>`).join('');
  host.querySelectorAll('input').forEach(input => input.addEventListener('change', () => {
    const selected = [...host.querySelectorAll('input:checked')].map(i=>i.value).slice(0,4);
    setMobileQuickAccess(selected);
    renderNavigation(location.hash.replace('#',''));
  }));
}
