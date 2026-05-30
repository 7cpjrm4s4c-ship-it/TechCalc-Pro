import { modules } from './registry.js';
import { currentRoute, navigate } from './router.js';
import { loadPreferences, setMobileQuickAccess } from './preferences.js';
import { esc } from './renderer.js';

const MOBILE_QUERY = '(max-width: 767px)';

export function renderNavigation(activeId = currentRoute()) {
  const nav = document.getElementById('primaryNav');
  const overflow = document.getElementById('overflowMenu');
  if (!nav || !overflow) return;

  const allModules = modules.all();
  const isMobile = matchMedia(MOBILE_QUERY).matches;
  const preferences = loadPreferences();
  const visibleIds = isMobile
    ? normalizeQuickAccess(preferences.mobileQuickAccess, allModules, 4)
    : normalizeQuickAccess(preferences.mobileQuickAccess, allModules, Math.max(1, calcDesktopSlots() - 1));

  const visibleModules = visibleIds.map(id => modules.get(id)).filter(Boolean);
  const overflowModules = allModules.filter(module => !visibleIds.includes(module.id));
  const activeInOverflow = overflowModules.some(module => module.id === activeId);

  nav.innerHTML = [
    ...visibleModules.map(module => renderTab(module, activeId)),
    renderOverflowButton(activeInOverflow, !overflow.hidden),
  ].join('');

  renderOverflowMenu(overflow, overflowModules, activeId, visibleIds, isMobile);
  bindPrimaryNav(nav, overflow);
}

export function renderQuickAccessSettings() {
  const host = document.getElementById('quickAccessSettings');
  if (!host) return;

  const allModules = modules.all();
  const selectedIds = normalizeQuickAccess(loadPreferences().mobileQuickAccess, allModules, 4);

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

function navigateFromButton(button, overflow, event) {
  if (!button?.dataset?.moduleId) return;
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (overflow) overflow.hidden = true;
  navigate(button.dataset.moduleId);
}

function bindModuleNavButton(button, overflow) {
  if (!button || button.__tcNavBound) return;
  button.__tcNavBound = true;
  let handledAt = 0;
  const handle = event => {
    const now = Date.now();
    if ((event.type === 'click' || event.type === 'touchend') && now - handledAt < 500) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      return;
    }
    handledAt = now;
    navigateFromButton(button, overflow, event);
  };
  button.addEventListener('pointerup', handle, true);
  button.addEventListener('touchend', handle, { capture: true, passive: false });
  button.addEventListener('click', handle, true);
}

function bindPrimaryNav(nav, overflow) {
  nav.querySelectorAll('[data-module-id]').forEach(button => bindModuleNavButton(button, overflow));

  nav.querySelector('[data-overflow]')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = overflow.hidden;
    overflow.hidden = !willOpen;
    event.currentTarget.setAttribute('aria-expanded', String(willOpen));
  });

  document.removeEventListener('click', closeOverflowOnOutsideClick);
  document.addEventListener('click', closeOverflowOnOutsideClick);
}

function closeOverflowOnOutsideClick(event) {
  const overflow = document.getElementById('overflowMenu');
  if (!overflow || overflow.hidden) return;
  if (!event.target.closest('.module-nav')) overflow.hidden = true;
}

function renderOverflowMenu(overflow, overflowModules, activeId, visibleIds, isMobile) {
  const content = overflowModules.length
    ? overflowModules.map(module => renderOverflowItem(module, activeId, isMobile)).join('')
    : '<div class="overflow-menu__empty">Alle Module sind in der Navigation sichtbar.</div>';

  overflow.innerHTML = `
    <div class="overflow-menu__card">
      <div class="overflow-menu__head">
        <strong>Weitere Module</strong>
        <small>${isMobile ? 'Nicht ausgewählte Schnellzugriffe' : 'Weitere Werkzeuge'}</small>
      </div>
      <div class="overflow-menu__list">
        ${content}
      </div>
    </div>
  `;

  overflow.querySelectorAll('[data-module-id]').forEach(button => bindModuleNavButton(button, overflow));

  overflow.querySelectorAll('[data-set-quick]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const id = button.dataset.setQuick;
      const next = [...visibleIds.filter(item => item !== id)];
      if (next.length >= 4) next[3] = id;
      else next.push(id);
      setMobileQuickAccess(normalizeQuickAccess(next, modules.all(), 4));
      overflow.hidden = true;
      renderNavigation(currentRoute());
      renderQuickAccessSettings();
    });
  });
}

function normalizeQuickAccess(preferredIds, allModules, limit = 4) {
  const availableIds = allModules.map(module => module.id);
  const selected = [...new Set((preferredIds ?? []).filter(id => availableIds.includes(id)))];

  for (const id of availableIds) {
    if (selected.length >= limit) break;
    if (!selected.includes(id)) selected.push(id);
  }

  return selected.slice(0, limit);
}

function fillToFour(ids, allModules) {
  return normalizeQuickAccess(ids, allModules, 4);
}

function renderTab(module, activeId) {
  return `
    <button class="module-tab ${module.id === activeId ? 'is-active' : ''}" data-module-id="${esc(module.id)}" data-accent="${esc(module.accent)}" type="button">
      ${esc(module.shortTitle)}
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

function renderOverflowItem(module, activeId, isMobile) {
  return `
    <div class="overflow-menu__row ${module.id === activeId ? 'is-active' : ''}">
      <button type="button" data-module-id="${esc(module.id)}" data-accent="${esc(module.accent)}" class="overflow-menu__item">
        <span>${esc(module.shortTitle)}</span>
        <small>${esc(module.title)} · ${esc(module.group)}</small>
      </button>
    </div>
  `;
}

function renderQuickAccessRow(module, index, length) {
  if (!module) return '';
  return `
    <div class="settings-row" data-module-id="${esc(module.id)}">
      <span>${esc(module.shortTitle)}</span>
      <span class="settings-row__actions">
        <button class="mini-button" type="button" data-quick-move="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="mini-button" type="button" data-quick-move="down" data-index="${index}" ${index === length - 1 ? 'disabled' : ''}>↓</button>
        <button class="mini-button" type="button" data-quick-remove="${esc(module.id)}">Entfernen</button>
      </span>
    </div>
  `;
}

function renderQuickAccessToggle(module, selectedIds) {
  const selected = selectedIds.includes(module.id);
  return `
    <label class="settings-check">
      <input type="checkbox" data-quick-add="${esc(module.id)}" ${selected ? 'checked' : ''}>
      <span>${esc(module.title)}</span>
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

