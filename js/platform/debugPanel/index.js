import { card, esc } from '../../core/renderer.js';

const MAX_EVENTS = 40;
const STORE_KEY = '__tcDebugEvents';

function events() {
  window[STORE_KEY] = Array.isArray(window[STORE_KEY]) ? window[STORE_KEY] : [];
  return window[STORE_KEY];
}

function timeStamp() {
  try {
    return new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
}

export function isDebugEnabled() {
  try {
    return Boolean(window.__TC_DEBUG_CARD__);
  } catch {
    return false;
  }
}

export function enableDebugCard(value = true) {
  try {
    window.__TC_DEBUG_CARD__ = Boolean(value);
  } catch { /* noop */ }
}

export function addDebugEvent(type, payload = {}) {
  if (!isDebugEnabled()) return;
  const list = events();
  list.unshift({
    at: timeStamp(),
    type: String(type || 'event'),
    payload: payload && typeof payload === 'object' ? payload : { value: payload }
  });
  if (list.length > MAX_EVENTS) list.length = MAX_EVENTS;
}

export function clearDebugEvents() {
  try {
    window[STORE_KEY] = [];
  } catch { /* noop */ }
}

function payloadRows(payload = {}) {
  return Object.entries(payload || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `<div class="tc-debug-row"><span>${esc(key)}</span><strong>${esc(typeof value === 'object' ? JSON.stringify(value) : value)}</strong></div>`)
    .join('');
}

export function renderDebugCard() {
  const list = events();
  const body = [
    `<div class="tc-debug-actions">
      <button type="button" class="action-button action-button--secondary" data-tc-action="debug:clear">Debug leeren</button>
      <span class="tc-help">Nur sichtbar, wenn Debug Card aktiv ist.</span>
    </div>`,
    list.length
      ? `<div class="tc-debug-list">${list.map(item => `
        <div class="tc-debug-event">
          <div class="tc-debug-head"><strong>${esc(item.type)}</strong><span>${esc(item.at)}</span></div>
          ${payloadRows(item.payload)}
        </div>
      `).join('')}</div>`
      : '<div class="empty-state">Noch keine Debug Events.</div>'
  ].join('');
  return card('Debug Events', body, 'purple');
}

export function bindDebugPanel(root) {
  if (!root || root.__tcDebugPanelBound) return;
  root.__tcDebugPanelBound = true;
  root.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-tc-action="debug:clear"]');
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    clearDebugEvents();
    root.querySelectorAll('[data-debug-panel]').forEach(panel => {
      panel.innerHTML = renderDebugCard();
    });
  }, true);
}

export default {
  addDebugEvent,
  bindDebugPanel,
  clearDebugEvents,
  enableDebugCard,
  isDebugEnabled,
  renderDebugCard
};
