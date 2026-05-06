import { modules } from './registry.js';
import { currentRoute, navigate } from './router.js';
import { loadPreferences, setMobileQuickAccess } from './preferences.js';

const MOBILE_QUERY = '(max-width: 767px)';

export function renderNavigation(activeId = currentRoute()) {
  const nav = document.getElementById('primaryNav');
  const overflow = document.getElementById('overflowMenu');
  if (!nav || !overflow) return;

  const allModules = modules.all();
  const isMobile = matchMedia(MOBILE_QUERY).matches;
  const preferences = loadPreferences();
  const visibleIds = isMobile
    ? normalizeMobileQuickAccess(preferences.mobileQuickAccess, allModules)
    : getDesktopVisibleIds(allModules);

  const visibleModules = visibleIds.map(id => modules.get(id)).filter(Boolean);
  const overflowModules = allModules.filter(module => !visibleIds.includes(module.id));
  const activeInOverflow = overflowModules.some(module => module.id === activeId);

  nav.innerHTML = [
    ...visibleModules.map(module => renderTab(module, activeId)),
    renderOverflowButton(activeInOverflow, overflow.hidden === false),
  ].join('');

  bindPrimaryNav(nav, overflow);
  renderOverflowMenu(overflow, overflowModules, activeId);
}

export function renderQuickAccessSettings() {
  const host = document.getElementById('quickAccessSettings');
  if (!host) return;

  const allModules = modules.all();
  const selectedIds = normalizeMobileQuickAccess(loadPreferences().mobileQuickAccess, allModules);

  host.innerHTML = `
    <div class="quick-access-list">
      ${selectedIds.map((id, index) => renderQuickAccessRow(modules.get(id), index, selectedIds.length)).join('')}
    </div>
    <div class="quick-access-pool">
      <strong>Weitere Module</strong>
      ${allModules.map(module => renderQuickAccessToggle(module, selectedIds)).join('')}
    </div>
  `;

  host.querySelectorAll('[data-quick-remove]').forEach(button => {
    button.addEventListener('click', () => {
      const next = selectedIds.filter(id => id !== button.dataset.quickRemove);
      setMobileQuickAccess(fillToFour(next, allModules));
      rerenderNavigationSettings();
    });
  });

  host.querySelectorAll('[data-quick-add]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.quickAdd;
      let next;

      if (input.checked) {
        // If four quick slots are already used, selecting an additional module
        // replaces the last slot instead of disabling the option. This keeps
        // the +/settings menu usable on mobile without a prior remove step.
        next = selectedIds.includes(id)
          ? [...selectedIds]
          : [...selectedIds.slice(0, 3), id];
      } else {
        next = selectedIds.filter(item => item !== id);
      }

      setMobileQuickAccess(fillToFour(next, allModules));
      rerenderNavigationSettings();
    });
  });

  host.querySelectorAll('[data-quick-move]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const direction = button.dataset.quickMove === 'up' ? -1 : 1;
      const target = index + direction;
      if (target < 0 || target >= selectedIds.length) return;
      const next = [...selectedIds];
      [next[index], next[target]] = [next[target], next[index]];
      setMobileQuickAccess(next);
      rerenderNavigationSettings();
    });
  });
}

function bindPrimaryNav(nav, overflow) {
  nav.querySelectorAll('[data-module-id]').forEach(button => {
    button.addEventListener('click', () => {
      overflow.hidden = true;
      navigate(button.dataset.moduleId);
    });
  });

  nav.querySelector('[data-overflow]')?.addEventListener('click', event => {
    event.stopPropagation();
    overflow.hidden = !overflow.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!overflow.hidden));
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.module-nav')) overflow.hidden = true;
  }, { once: true });
}

function renderOverflowMenu(overflow, overflowModules, activeId) {
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

function getDesktopVisibleIds(allModules) {
  const slots = Math.max(2, calcDesktopSlots() - 1); // one slot is reserved for +
  return allModules
    .filter(module => module.defaultVisible)
    .slice(0, slots)
    .map(module => module.id);
}

function normalizeMobileQuickAccess(preferredIds, allModules) {
  const availableIds = allModules.map(module => module.id);
  const selected = [...new Set((preferredIds ?? []).filter(id => availableIds.includes(id)))];

  for (const id of availableIds) {
    if (selected.length >= 4) break;
    if (!selected.includes(id)) selected.push(id);
  }

  return selected.slice(0, 4);
}

function fillToFour(ids, allModules) {
  return normalizeMobileQuickAccess(ids, allModules);
}

function renderTab(module, activeId) {
  return `
    <button class="module-tab ${module.id === activeId ? 'is-active' : ''}" data-module-id="${escapeAttr(module.id)}" data-accent="${escapeAttr(module.accent)}" type="button">
      ${escapeHtml(module.shortTitle)}
    </button>
  `;
}

function renderOverflowButton(activeInOverflow, expanded) {
  return `
    <button class="module-tab module-tab--overflow ${activeInOverflow ? 'is-overflow-active' : ''}" data-overflow type="button" aria-label="Weitere Module öffnen" aria-expanded="${expanded ? 'true' : 'false'}">
      +
    </button>
  `;
}

function renderOverflowItem(module, activeId) {
  return `
    <button type="button" data-module-id="${escapeAttr(module.id)}" data-accent="${escapeAttr(module.accent)}" class="overflow-menu__item ${module.id === activeId ? 'is-active' : ''}">
      <span>${escapeHtml(module.title)}</span>
      <small>${escapeHtml(module.group)}</small>
    </button>
  `;
}

function renderQuickAccessRow(module, index, length) {
  if (!module) return '';
  return `
    <div class="settings-row" data-module-id="${escapeAttr(module.id)}">
      <span>${escapeHtml(module.shortTitle)}</span>
      <span class="settings-row__actions">
        <button class="mini-button" type="button" data-quick-move="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="mini-button" type="button" data-quick-move="down" data-index="${index}" ${index === length - 1 ? 'disabled' : ''}>↓</button>
        <button class="mini-button" type="button" data-quick-remove="${escapeAttr(module.id)}">Entfernen</button>
      </span>
    </div>
  `;
}

function renderQuickAccessToggle(module, selectedIds) {
  const selected = selectedIds.includes(module.id);
  return `
    <label class="settings-check">
      <input type="checkbox" data-quick-add="${escapeAttr(module.id)}" ${selected ? 'checked' : ''}>
      <span>${escapeHtml(module.title)}</span>
    </label>
  `;
}

function rerenderNavigationSettings() {
  renderQuickAccessSettings();
  renderNavigation(currentRoute());
}

function calcDesktopSlots() {
  return Math.max(5, Math.floor(window.innerWidth / 340));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}
