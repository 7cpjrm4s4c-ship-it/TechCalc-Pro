import { card, stack } from '../../core/renderer.js';
import { registerCentralActions } from '../../core/eventPipeline.js';
import { createRecordId, isSameId, replaceRecord, removeRecord, renderSavedRecordList, bindEditModeClear } from '../../core/savedRecords.js';

function escapeAttribute(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function createLineSectionController({
  state,
  listKey = 'lineSections',
  activeIdKey = 'activeLineSectionId',
  nameKey = 'activeLineSectionName',
  expandedIdKey = 'expandedLineSectionId',
  recordPrefix = 'line',
  cardTitle = 'Leitungsabschnitte',
  nameLabel = 'Bezeichnung',
  nameInputId = 'lineSectionName',
  namePlaceholder = 'z. B. Verteilerabgang Nord',
  emptyText = 'Noch keine Leitungsabschnitte angelegt',
  accent = 'blue',
  dynamicAttr = 'line-sections',
  stats = () => [],
  title = item => item?.name || 'Abschnitt',
  currentResult = () => ({}),
  buildRecord,
  hydrateRecord,
  debounceMs = 700
} = {}) {
  let memory = [];

  const read = () => {
    const fromStore = state?.get?.()?.[listKey];
    if (Array.isArray(fromStore)) return [...fromStore];
    return Array.isArray(memory) ? [...memory] : [];
  };

  const write = items => {
    memory = Array.isArray(items) ? [...items] : [];
    try {
      const current = state?.get?.() || {};
      if (Array.isArray(current[listKey])) {
        state.set({ [listKey]: [...memory] }, { action: `${recordPrefix}:external-write`, notify: false });
      }
    } catch { /* keep import/export compatible */ }
  };

  const renderRows = snapshot => renderSavedRecordList(Array.isArray(snapshot?.[listKey]) ? snapshot[listKey] : read(), {
    activeId: snapshot?.[activeIdKey],
    expandedId: snapshot?.[expandedIdKey],
    emptyText,
    loadAttr: 'data-line-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-line-delete',
    title,
    stats
  });

  const renderCard = (snapshot = state?.get?.() || {}) => card(cardTitle, stack([
    `<div class="field"><label for="${nameInputId}">${nameLabel}</label><div class="control"><input id="${nameInputId}" type="text" placeholder="${escapeAttribute(namePlaceholder)}" autocomplete="off" value="${escapeAttribute(snapshot?.[nameKey] || '')}"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button" data-tc-action="line:save" data-line-save ${snapshot?.[activeIdKey] ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-tc-action="line:update" data-line-update ${snapshot?.[activeIdKey] ? '' : 'disabled'}>Aktualisieren</button></div>`,
    `<div data-hc-dynamic="${dynamicAttr}">${renderRows(snapshot)}</div>`
  ].join('')), accent);

  const updateControls = (root, snapshot = state?.get?.() || {}) => {
    const nameInput = root?.querySelector?.(`#${nameInputId}`);
    if (nameInput && document.activeElement !== nameInput) nameInput.value = snapshot?.[nameKey] || '';
    const saveButton = root?.querySelector?.('[data-line-save]');
    const updateButton = root?.querySelector?.('[data-line-update]');
    if (saveButton) saveButton.disabled = Boolean(snapshot?.[activeIdKey]);
    if (updateButton) updateButton.disabled = !snapshot?.[activeIdKey];
  };

  const bind = root => {
    if (!root || !state) return;
    bindEditModeClear(root, { state, activeIdKey, nameKey });

    const persist = (items, patch = {}, action = 'line:update') => {
      const next = Array.isArray(items) ? [...items] : [];
      memory = next;
      state.set({ [listKey]: next, ...patch }, { action });
    };

    const shouldSkipDuplicateAction = action => {
      const key = '__tcLastLineSectionAction';
      const now = Date.now();
      const last = root[key] || {};
      if (last.action === action && now - Number(last.at || 0) < debounceMs) return true;
      root[key] = { action, at: now };
      return false;
    };

    const saveCurrent = ({ root: actionRoot } = {}) => {
      if (shouldSkipDuplicateAction('line:save')) return;
      const host = actionRoot || root;
      const name = host.querySelector(`#${nameInputId}`)?.value?.trim() || '';
      const currentState = state.get();
      const items = read();
      const id = createRecordId(recordPrefix);
      const item = buildRecord?.({ currentState: { ...currentState, [activeIdKey]: null, [nameKey]: name }, result: currentResult(), items, id, name }) || null;
      if (!item) return;
      persist([item, ...items], { [activeIdKey]: null, [nameKey]: '', [expandedIdKey]: state.get()?.[expandedIdKey] }, 'line:save');
    };

    const updateCurrent = ({ root: actionRoot } = {}) => {
      if (shouldSkipDuplicateAction('line:update')) return;
      const host = actionRoot || root;
      const currentState = state.get();
      const id = currentState?.[activeIdKey];
      if (!id) return;
      const name = host.querySelector(`#${nameInputId}`)?.value?.trim() || '';
      const items = read();
      const existing = items.find(x => String(x.id) === String(id));
      if (!existing) return;
      const item = buildRecord?.({ currentState, result: currentResult(), items, id, name, existing }) || null;
      if (!item) return;
      persist(replaceRecord(items, id, item), { [activeIdKey]: id, [nameKey]: item.name, [expandedIdKey]: state.get()?.[expandedIdKey] }, 'line:update');
    };

    const load = id => {
      const item = read().find(entry => isSameId(entry.id, id));
      if (!item) return;
      if (isSameId(state.get()?.[activeIdKey], id)) {
        state.set({ [activeIdKey]: null, [nameKey]: '', [expandedIdKey]: state.get()?.[expandedIdKey] }, { action: 'line:deselect' });
        return;
      }
      const hydrated = hydrateRecord?.({ item, currentState: state.get() }) || {};
      state.set({ ...hydrated, [expandedIdKey]: state.get()?.[expandedIdKey] }, { action: 'line:select' });
    };

    const deleteLine = id => {
      const next = removeRecord(read(), id);
      const patch = isSameId(state.get()?.[activeIdKey], id)
        ? { [activeIdKey]: null, [nameKey]: '', [expandedIdKey]: null }
        : (isSameId(state.get()?.[expandedIdKey], id) ? { [expandedIdKey]: null } : {});
      persist(next, patch, 'line:delete');
    };

    const toggle = element => {
      const cardEl = element?.closest?.('[data-line-card]');
      if (!cardEl) return;
      const id = cardEl.getAttribute('data-line-select');
      if (!id) return;
      const currentExpanded = state.get()?.[expandedIdKey];
      const willOpen = !isSameId(currentExpanded, id);
      state.set({ [expandedIdKey]: willOpen ? id : null }, { action: 'line:toggle' });
    };

    registerCentralActions(root, {
      'line:save': saveCurrent,
      'line:update': updateCurrent,
      'saved:load': ({ element }) => load(element?.getAttribute('data-line-select') || element?.closest?.('[data-line-select]')?.getAttribute('data-line-select')),
      'saved:delete': ({ element }) => deleteLine(element?.getAttribute('data-line-delete')),
      'saved:toggle': ({ element }) => toggle(element)
    });
  };

  return { read, write, renderRows, renderCard, updateControls, bind };
}

export default createLineSectionController;
