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
    renderOverflowButton(activeInOverflow, !overflow.hidden),
  ].join('');

  renderOverflowMenu(overflow, overflowModules, activeId, visibleIds, isMobile);
  bindPrimaryNav(nav, overflow);
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

  overflow.querySelectorAll('[data-module-id]').forEach(button => {
    button.addEventListener('click', () => {
      overflow.hidden = true;
      navigate(button.dataset.moduleId);
    });
  });

  overflow.querySelectorAll('[data-set-quick]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const id = button.dataset.setQuick;
      const next = [...visibleIds.filter(item => item !== id)];
      if (next.length >= 4) next[3] = id;
      else next.push(id);
      setMobileQuickAccess(normalizeMobileQuickAccess(next, modules.all()));
      overflow.hidden = true;
      renderNavigation(currentRoute());
      renderQuickAccessSettings();
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

function renderOverflowItem(module, activeId, isMobile) {
  return `
    <div class="overflow-menu__row ${module.id === activeId ? 'is-active' : ''}">
      <button type="button" data-module-id="${escapeAttr(module.id)}" data-accent="${escapeAttr(module.accent)}" class="overflow-menu__item">
        <span>${escapeHtml(module.shortTitle)}</span>
        <small>${escapeHtml(module.title)} · ${escapeHtml(module.group)}</small>
      </button>
      ${isMobile ? `<button type="button" class="overflow-menu__quick" data-set-quick="${escapeAttr(module.id)}" aria-label="${escapeAttr(module.title)} als Schnellzugriff setzen">Fixieren</button>` : ''}
    </div>
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
