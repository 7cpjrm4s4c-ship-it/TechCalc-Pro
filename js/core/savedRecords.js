import { esc, inlineStats, preserveViewport } from './renderer.js';
import { markCommittedAction } from './formActions.js';

export function createRecordId(prefix = 'record') {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch { /* ignore */ }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isSameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

export function replaceRecord(items, id, nextRecord) {
  const list = Array.isArray(items) ? items : [];
  return list.map(item => isSameId(item.id, id) ? nextRecord : item);
}

export function removeRecord(items, id) {
  return (Array.isArray(items) ? items : []).filter(item => !isSameId(item.id, id));
}

export function renderSavedRecordList(items = [], {
  activeId = null,
  expandedId = null,
  emptyText = 'Noch keine Einträge gespeichert.',
  loadAttr = 'data-saved-load',
  toggleAttr = 'data-saved-toggle',
  deleteAttr = 'data-saved-delete',
  title = item => item?.name || 'Eintrag',
  subtitle = null,
  stats = null,
  className = ''
} = {}) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return `<div class="empty-state empty-state--compact">${esc(emptyText)}</div>`;
  return `<div class="line-section-list saved-record-list ${esc(className)}">${list.map((item, index) => {
    const itemTitle = title(item, index);
    const itemSubtitle = typeof subtitle === 'function' ? subtitle(item, index) : '';
    const itemStats = typeof stats === 'function' ? stats(item, index) : [];
    const expanded = isSameId(expandedId, item.id);
    return `<article data-tc-action="saved:load" class="line-section-card saved-record-card ${expanded ? '' : 'is-collapsed'} ${isSameId(activeId, item.id) ? 'is-active' : ''}" data-line-card data-saved-record-card data-saved-record-id="${esc(item.id)}" tabindex="0" role="button" ${loadAttr}="${esc(item.id)}">
      <div class="line-section-card__head saved-record-card__head">
        <div class="line-section-card__title saved-record-card__title"><strong>${esc(itemTitle)}</strong>${itemSubtitle ? `<small>${esc(itemSubtitle)}</small>` : ''}</div>
        <button type="button" data-tc-action="saved:toggle" class="line-section-card__toggle saved-record-card__toggle" ${toggleAttr}="${esc(item.id)}" aria-expanded="${expanded ? 'true' : 'false'}" aria-label="Details aufklappen"><span>▾</span></button>
        <button type="button" data-tc-action="saved:delete" class="line-section-card__delete saved-record-card__delete" ${deleteAttr}="${esc(item.id)}" aria-label="Eintrag löschen">×</button>
      </div>
      <div class="line-section-card__body saved-record-card__body">${inlineStats(itemStats)}</div>
    </article>`;
  }).join('')}</div>`;
}


export function renderSavedRecordPanel({
  title = 'Gespeicherte Einträge',
  nameFieldId = 'recordName',
  nameLabel = 'Bezeichnung',
  nameValue = '',
  namePlaceholder = '',
  addAction = 'line:save',
  updateAction = 'line:update',
  addDisabled = false,
  updateDisabled = true,
  addLabel = 'Speichern',
  updateLabel = 'Aktualisieren',
  listHtml = '',
  accent = 'blue'
} = {}) {
  const body = [
    `<div class="field"><label for="${esc(nameFieldId)}">${esc(nameLabel)}</label><div class="control"><input id="${esc(nameFieldId)}" data-field="${esc(nameFieldId)}" value="${esc(nameValue)}" placeholder="${esc(namePlaceholder)}" inputmode="text"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button action-button--secondary" data-tc-action="${esc(addAction)}" data-line-save ${addDisabled ? 'disabled' : ''}>${esc(addLabel)}</button><button type="button" class="action-button" data-tc-action="${esc(updateAction)}" data-line-update ${updateDisabled ? 'disabled' : ''}>${esc(updateLabel)}</button></div>`,
    listHtml || `<div class="empty-state empty-state--compact">Noch keine Einträge gespeichert.</div>`
  ].join('');
  return `<section class="card card--${esc(accent)} tc-card tc-saved-record-panel"><div class="card__title tc-card__header">${esc(title)}</div><div class="card__body tc-card__body">${body}</div></section>`;
}

function bindScopedOnce(root, key, eventName, listener, options) {
  root.__tcSavedRecordBindings = root.__tcSavedRecordBindings || new Set();
  const bindingKey = `${key}:${eventName}`;
  if (root.__tcSavedRecordBindings.has(bindingKey)) return;
  root.__tcSavedRecordBindings.add(bindingKey);
  root.addEventListener(eventName, listener, options);
}

function closestAttr(target, attr, root) {
  const item = target?.closest?.(`[${attr}]`);
  return item && root.contains(item) ? item : null;
}

function shouldIgnoreLoad(event, toggleAttr, deleteAttr) {
  const target = event.target;
  return Boolean(
    target?.closest?.(`[${deleteAttr}]`) ||
    target?.closest?.(`[${toggleAttr}]`) ||
    target?.closest?.('a[href], input, select, textarea, label')
  );
}

function activateLoad({ root, card, event, loadAttr, onLoad, preserveLoadScroll }) {
  const id = card.getAttribute(loadAttr);
  if (!id) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  markCommittedAction(root);
  const run = () => onLoad?.(id, card, event);
  if (preserveLoadScroll) preserveViewport(run, { frames: 8, blurActive: false, anchor: card, event, delays: [0, 40, 100, 220] });
  else run();
}

export function bindSavedRecordList(root, {
  loadAttr = 'data-saved-load',
  toggleAttr = 'data-saved-toggle',
  deleteAttr = 'data-saved-delete',
  closeOthers = true,
  onLoad,
  onDelete,
  preserveLoadScroll = true
} = {}) {
  if (!root) return;
  const key = `${loadAttr}|${toggleAttr}|${deleteAttr}`;

  bindScopedOnce(root, key, 'click', event => {
    const toggle = closestAttr(event.target, toggleAttr, root);
    if (toggle) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      const card = toggle.closest('[data-line-card]');
      const willOpen = card?.classList.contains('is-collapsed');
      if (closeOthers && card) {
        root.querySelectorAll('[data-line-card]').forEach(item => {
          if (item === card) return;
          item.classList.add('is-collapsed');
          item.querySelector(`[${toggleAttr}]`)?.setAttribute('aria-expanded', 'false');
        });
      }
      card?.classList.toggle('is-collapsed', !willOpen);
      toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      return;
    }

    const deleteButton = closestAttr(event.target, deleteAttr, root);
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      markCommittedAction(root);
      onDelete?.(deleteButton.getAttribute(deleteAttr), deleteButton, event);
      return;
    }

    const card = closestAttr(event.target, loadAttr, root);
    if (!card || shouldIgnoreLoad(event, toggleAttr, deleteAttr)) return;
    activateLoad({ root, card, event, loadAttr, onLoad, preserveLoadScroll });
  }, true);

  bindScopedOnce(root, key, 'keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = closestAttr(event.target, loadAttr, root);
    if (!card || shouldIgnoreLoad(event, toggleAttr, deleteAttr)) return;
    activateLoad({ root, card, event, loadAttr, onLoad, preserveLoadScroll });
  });
}

export function bindEditModeClear(root, {
  state,
  activeIdKey,
  nameKey,
  clearPatch = {},
  ignoreSelector = '',
  onClear = null
} = {}) {
  if (!root || !state || !activeIdKey) return;
  const key = `editModeClear:${activeIdKey}:${nameKey || ''}`;
  root.__tcEditModeClearBound = root.__tcEditModeClearBound || new Set();
  if (root.__tcEditModeClearBound.has(key)) return;
  root.__tcEditModeClearBound.add(key);
  root.addEventListener('click', event => {
    const current = state.get ? state.get() : {};
    if (!current?.[activeIdKey]) return;
    const baseIgnore = '[data-line-card], .saved-record-card, .line-section-card, .tc-save-actions, input, select, textarea, button, label, .segmented, .segmented button';
    const selector = ignoreSelector ? `${baseIgnore}, ${ignoreSelector}` : baseIgnore;
    if (event.target.closest(selector)) return;
    const patch = { [activeIdKey]: null, ...(nameKey ? { [nameKey]: '' } : {}), ...clearPatch };
    preserveViewport(() => {
      if (typeof onClear === 'function') onClear(patch, event);
      else state.set(patch);
    }, { frames: 14, event, anchor: event.target?.closest?.('.module-view, main, #app'), delays: [0, 40, 100, 220, 420, 800] });
  });
}
