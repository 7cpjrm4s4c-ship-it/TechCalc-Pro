import { modules } from '../runtime/registry.js';
import { currentRoute } from './router.js';
import { loadPreferences, setModuleOrder } from '../ux/preferences.js';
import { esc } from '../ui/renderer.js';

const MOBILE_QUERY = '(max-width: 767px)';

export function orderedModuleIds(preferences, allModules) {
  const available = allModules.map(module => module.id);
  const preferred = preferences.moduleOrder?.length ? preferences.moduleOrder : preferences.mobileQuickAccess;
  return [...new Set([...(preferred || []), ...available])].filter(id => available.includes(id));
}

export function renderNavigation(activeId = currentRoute()) {
  const nav = document.getElementById('primaryNav');
  const overflow = document.getElementById('overflowMenu');
  if (!nav || !overflow) return;
  const preferences = loadPreferences();
  const allModules = orderedModuleIds(preferences, modules.all()).map(id => modules.get(id));
  const isMobile = matchMedia(MOBILE_QUERY).matches;
  const visibleIds = allModules.slice(0, isMobile ? 4 : Math.max(1, calcDesktopSlots() - 1)).map(module => module.id);
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

  const allModules = orderedModuleIds(loadPreferences(), modules.all()).map(id => modules.get(id));
  host.innerHTML = `
    <div class="module-order-list" role="list" aria-label="Reihenfolge aller Module">
      ${allModules.map((module, index) => renderOrderCard(module, index, allModules.length)).join('')}
    </div>
  `;
  host.querySelectorAll('[data-order-move]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.closest('[data-order-id]').dataset.orderId;
      const ids = allModules.map(module => module.id);
      const index = ids.indexOf(id);
      const target = index + (button.dataset.orderMove === 'up' ? -1 : 1);
      if (target < 0 || target >= ids.length) return;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      setModuleOrder(ids);
      rerenderNavigationSettings();
      host.querySelector(`[data-order-id="${id}"] [data-order-move="${button.dataset.orderMove}"]`)?.focus();
      announceOrder(id, target);
    });
  });
  bindOrderDrag(host);
}

function bindPrimaryNav(nav, overflow) {
  // Module buttons are handled once, globally, in app.js. Keeping navigation
  // itself passive prevents duplicate pointer/click flows that can mark a module
  // active while cancelling the content render.
  nav.querySelector('[data-overflow]')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = overflow.hidden;
    overflow.hidden = !willOpen;
    event.currentTarget.setAttribute('aria-expanded', String(willOpen));
    event.currentTarget.setAttribute('aria-label', `Weitere Module ${willOpen ? 'schließen' : 'öffnen'}`);
  });
  document.removeEventListener('click', closeOverflowOnOutsideClick);
  document.addEventListener('click', closeOverflowOnOutsideClick);
}

function closeOverflowOnOutsideClick(event) {
  const overflow = document.getElementById('overflowMenu');
  if (!overflow || overflow.hidden) return;
  if (!event.target.closest('.module-nav, #overflowMenu')) {
    overflow.hidden = true;
    const trigger = document.querySelector('#primaryNav [data-overflow]');
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.setAttribute('aria-label', 'Weitere Module öffnen');
  }
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
  overflow.querySelectorAll('[data-set-quick]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const id = button.dataset.setQuick;
      const all = orderedModuleIds(loadPreferences(), modules.all());
      const next = [...all.filter(item => item !== id)];
      next.splice(Math.min(3, next.length), 0, id);
      setModuleOrder(next);
      overflow.hidden = true;
      renderNavigation(currentRoute());
      renderQuickAccessSettings();
    });
  });
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
    <button class="module-tab module-tab--overflow ${activeInOverflow ? 'is-overflow-active' : ''}" data-overflow type="button" aria-label="Weitere Module ${expanded ? 'schließen' : 'öffnen'}" aria-expanded="${expanded ? 'true' : 'false'}">
      Mehr
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

function renderOrderCard(module, index, length) {
  if (!module) return '';
  return `
    <div class="module-order-card" role="listitem" data-order-id="${esc(module.id)}" data-accent="${esc(module.accent)}">
      <span class="module-order-grip" aria-hidden="true">⠿</span>
      <span class="module-order-card__number">${String(index + 1).padStart(2, '0')}</span>
      <span class="module-order-card__text"><strong>${esc(module.title)}</strong><small>${esc(module.group)}</small></span>
      ${index < 4 ? '<span class="module-order-card__badge">Schnellzugriff</span>' : ''}
      <span class="module-order-card__actions">
        <button type="button" data-order-move="up" aria-label="${esc(module.title)} nach oben" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-order-move="down" aria-label="${esc(module.title)} nach unten" ${index === length - 1 ? 'disabled' : ''}>↓</button>
      </span>
    </div>
  `;
}

function announceOrder(id, index) {
  const status = document.getElementById('moduleOrderStatus');
  const module = modules.get(id);
  if (status && module) status.textContent = `${module.title} an Position ${index + 1}.`;
}

function bindOrderDrag(host) {
  const list = host.querySelector('.module-order-list');
  const scroller = host.closest('.settings-panel__body');
  let drag = null;

  function reorderAt(x, y) {
    const target = document.elementFromPoint(x, y)?.closest('.module-order-card');
    if (!target || target === drag.card || target.parentElement !== list) return;
    const middle = target.getBoundingClientRect().top + target.offsetHeight / 2;
    list.insertBefore(drag.card, y < middle ? target : target.nextSibling);
  }

  function scrollWhileDragging() {
    if (!drag?.active || !scroller) return;
    const bounds = scroller.getBoundingClientRect();
    const edge = 48;
    const speed = drag.y < bounds.top + edge ? -14 : drag.y > bounds.bottom - edge ? 14 : 0;
    if (speed) {
      scroller.scrollTop += speed;
      reorderAt(drag.x, drag.y);
    }
    drag.frame = requestAnimationFrame(scrollWhileDragging);
  }

  host.addEventListener('pointerdown', event => {
    const card = event.target.closest('.module-order-card');
    if (!card || !list.contains(card) || event.target.closest('button')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.pointerType !== 'mouse' && !event.target.closest('.module-order-grip')) return;
    const rect = card.getBoundingClientRect();
    drag = { card, id: card.dataset.orderId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY, offsetY: event.clientY - rect.top, active: false, frame: 0, ghost: null };
    host.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  host.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!drag.active) {
      if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 5) return;
      drag.active = true;
      drag.card.classList.add('is-dragging');
      drag.ghost = drag.card.cloneNode(true);
      drag.ghost.removeAttribute('data-order-id');
      drag.ghost.classList.remove('is-dragging');
      drag.ghost.classList.add('module-order-ghost');
      drag.ghost.setAttribute('aria-hidden', 'true');
      drag.ghost.inert = true;
      drag.ghost.style.width = `${drag.card.getBoundingClientRect().width}px`;
      drag.ghost.style.left = `${drag.card.getBoundingClientRect().left}px`;
      document.body.append(drag.ghost);
      drag.frame = requestAnimationFrame(scrollWhileDragging);
    }
    drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
    reorderAt(event.clientX, event.clientY);
  });

  function finish(event, save) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { card, id, active, ghost, frame } = drag;
    if (frame) cancelAnimationFrame(frame);
    ghost?.remove();
    card.classList.remove('is-dragging');
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    drag = null;
    if (!active) return;
    if (save) {
      const ids = [...list.children].map(item => item.dataset.orderId);
      setModuleOrder(ids);
      rerenderNavigationSettings();
      announceOrder(id, ids.indexOf(id));
    } else renderQuickAccessSettings();
  }

  host.addEventListener('pointerup', event => finish(event, true));
  host.addEventListener('pointercancel', event => finish(event, false));
}

function rerenderNavigationSettings() {
  renderQuickAccessSettings();
  renderNavigation(currentRoute());
}

function calcDesktopSlots() {
  return Math.max(5, Math.floor(window.innerWidth / 340));
}
