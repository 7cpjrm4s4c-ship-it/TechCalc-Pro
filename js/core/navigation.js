import { modules } from './registry.js';
import { currentRoute, navigate } from './router.js';
import { loadPreferences, setMobileQuickAccess } from './preferences.js';

export function renderNavigation(activeId = currentRoute()) {
  const nav = document.getElementById('primaryNav');
  const overflow = document.getElementById('overflowMenu');
  if (!nav || !overflow) return;

  const all = modules.all();
  const isMobile = matchMedia('(max-width: 767px)').matches;
  const preferences = loadPreferences();

  const visibleIds = isMobile
    ? normalizeMobileQuickAccess(preferences.mobileQuickAccess, all)
    : getDesktopVisibleIds(all);

  const overflowModules = all.filter(module => !visibleIds.includes(module.id));
  const activeInOverflow = overflowModules.some(module => module.id === activeId);

  nav.innerHTML = [
    ...visibleIds.map(id => renderTab(modules.get(id), activeId)),
    renderOverflowButton(activeInOverflow)
  ].join('');

  nav.querySelectorAll('[data-module-id]').forEach(button => {
    button.addEventListener('click', () => {
      overflow.hidden = true;
      navigate(button.dataset.moduleId);
    });
  });

  nav.querySelector('[data-overflow]')?.addEventListener('click', () => {
    overflow.hidden = !overflow.hidden;
  });

  overflow.innerHTML = overflowModules.length
    ? overflowModules.map(module => renderOverflowItem(module, activeId)).join('')
    : '<button type="button" disabled>Keine weiteren Module</button>';

  overflow.querySelectorAll('[data-module-id]').forEach(button => {
    button.addEventListener('click', () => {
      overflow.hidden = true;
      navigate(button.dataset.moduleId);
    });
  });
}

export function renderQuickAccessSettings() {
  const host = document.getElementById('quickAccessSettings');
  if (!host) return;

  const preferences = loadPreferences();
  host.innerHTML = modules.all().map(module => `
    <label>
      <span>${module.title}</span>
      <input type="checkbox" value="${module.id}" ${preferences.mobileQuickAccess.includes(module.id) ? 'checked' : ''}>
    </label>
  `).join('');

  host.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      const selected = [...host.querySelectorAll('input:checked')]
        .map(item => item.value)
        .slice(0, 4);

      setMobileQuickAccess(selected);
      renderNavigation(currentRoute());
    });
  });
}

function getDesktopVisibleIds(allModules) {
  return allModules
    .filter(module => module.defaultVisible !== false)
    .slice(0, Math.max(1, calcDesktopSlots() - 1))
    .map(module => module.id);
}

function normalizeMobileQuickAccess(preferredIds, allModules) {
  const availableIds = allModules.map(module => module.id);
  const selected = preferredIds.filter(id => availableIds.includes(id));

  for (const id of availableIds) {
    if (selected.length >= 4) break;
    if (!selected.includes(id)) selected.push(id);
  }

  return selected.slice(0, 4);
}

function renderTab(module, activeId) {
  if (!module) return '';
  return `
    <button class="module-tab ${module.id === activeId ? 'is-active' : ''}" data-module-id="${module.id}" type="button">
      ${module.shortTitle ?? module.title}
    </button>
  `;
}

function renderOverflowButton(activeInOverflow) {
  return `
    <button class="module-tab module-tab--overflow ${activeInOverflow ? 'is-overflow-active' : ''}" data-overflow type="button" aria-label="Weitere Module öffnen">
      +
    </button>
  `;
}

function renderOverflowItem(module, activeId) {
  return `
    <button type="button" data-module-id="${module.id}" class="${module.id === activeId ? 'is-active' : ''}">
      ${module.title}
    </button>
  `;
}

function calcDesktopSlots() {
  return Math.max(5, Math.floor(window.innerWidth / 260));
}
