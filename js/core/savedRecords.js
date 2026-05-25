import { esc, inlineStats } from './renderer.js';

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
    return `<article class="line-section-card saved-record-card is-collapsed ${isSameId(activeId, item.id) ? 'is-active' : ''}" data-line-card ${loadAttr}="${esc(item.id)}">
      <div class="line-section-card__head saved-record-card__head">
        <div class="line-section-card__title saved-record-card__title"><strong>${esc(itemTitle)}</strong>${itemSubtitle ? `<small>${esc(itemSubtitle)}</small>` : ''}</div>
        <button type="button" class="line-section-card__toggle saved-record-card__toggle" ${toggleAttr} aria-expanded="false" aria-label="Details aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete saved-record-card__delete" ${deleteAttr}="${esc(item.id)}" aria-label="Eintrag löschen">×</button>
      </div>
      <div class="line-section-card__body saved-record-card__body">${inlineStats(itemStats)}</div>
    </article>`;
  }).join('')}</div>`;
}

export function bindSavedRecordList(root, {
  loadAttr = 'data-saved-load',
  toggleAttr = 'data-saved-toggle',
  deleteAttr = 'data-saved-delete',
  onLoad,
  onDelete
} = {}) {
  root.querySelectorAll(`[${toggleAttr}]`).forEach(toggle => {
    toggle.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const card = toggle.closest('[data-line-card]');
      const collapsed = card?.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });

  root.querySelectorAll(`[${loadAttr}]`).forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest(`[${deleteAttr}]`) || event.target.closest(`[${toggleAttr}]`)) return;
      event.preventDefault();
      event.stopPropagation();
      onLoad?.(card.getAttribute(loadAttr), card, event);
    });
  });

  root.querySelectorAll(`[${deleteAttr}]`).forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      onDelete?.(button.getAttribute(deleteAttr), button, event);
    });
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
  root.addEventListener('click', event => {
    const current = state.get ? state.get() : {};
    if (!current?.[activeIdKey]) return;
    const baseIgnore = '[data-line-card], .saved-record-card, .line-section-card, .tc-save-actions, input, select, textarea, button, label, .segmented, .segmented button';
    const selector = ignoreSelector ? `${baseIgnore}, ${ignoreSelector}` : baseIgnore;
    if (event.target.closest(selector)) return;
    const patch = { [activeIdKey]: null, ...(nameKey ? { [nameKey]: '' } : {}), ...clearPatch };
    if (typeof onClear === 'function') onClear(patch, event);
    else state.set(patch);
  });
}
