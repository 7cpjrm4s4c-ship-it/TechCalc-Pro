import { card, stack } from '../../core/renderer.js';
import { registerCentralActions, commitAllFields } from '../../core/eventPipeline.js';
import { preserveSavedRecordMutation } from '../../core/scrollManager.js';
import { PlatformFocusManager } from '../../core/focusManager.js';
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
  dynamicDataAttr = 'data-line-dynamic',
  stats = () => [],
  title = item => item?.name || 'Abschnitt',
  subtitle = null,
  currentResult = () => ({}),
  buildRecord,
  hydrateRecord,
  afterCreatePatch = null,
  afterUpdatePatch = null,
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
    subtitle,
    stats
  });

  const renderCard = (snapshot = state?.get?.() || {}) => card(cardTitle, stack([
    `<div class="field"><label for="${nameInputId}">${nameLabel}</label><div class="control"><input id="${nameInputId}" data-field="${nameKey}" type="text" placeholder="${escapeAttribute(namePlaceholder)}" autocomplete="off" value="${escapeAttribute(snapshot?.[nameKey] || '')}"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button" data-tc-action="line:save" data-line-save ${snapshot?.[activeIdKey] ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-tc-action="line:update" data-line-update ${snapshot?.[activeIdKey] ? '' : 'disabled'}>Aktualisieren</button></div>`,
    `<div ${dynamicDataAttr}="${dynamicAttr}" data-hc-dynamic="${dynamicAttr}">${renderRows(snapshot)}</div>`
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
      const commit = () => {
        memory = next;
        state.set({ [listKey]: next, ...patch }, { action });
      };
      return PlatformFocusManager.preserveFocusDuring(root, () => preserveSavedRecordMutation(commit));
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
      const extraPatch = typeof afterCreatePatch === 'function' ? (afterCreatePatch(currentState, item) || {}) : {};
      persist([item, ...items], { [activeIdKey]: null, [nameKey]: '', [expandedIdKey]: state.get()?.[expandedIdKey], ...extraPatch }, 'line:save');
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
      const extraPatch = typeof afterUpdatePatch === 'function' ? (afterUpdatePatch(currentState, item) || {}) : {};
      persist(replaceRecord(items, id, item), { [activeIdKey]: id, [nameKey]: item.name, [expandedIdKey]: state.get()?.[expandedIdKey], ...extraPatch }, 'line:update');
    };

    const load = (id, element = null) => {
      const item = read().find(entry => isSameId(entry.id, id));
      if (!item) return;

      const cardEl = element?.closest?.('[data-line-card]')
        || root.querySelector?.(`[data-line-card][data-line-select="${escapeAttribute(id)}"]`);
      const domActive = Boolean(cardEl?.classList?.contains('is-active'));
      const stateActive = isSameId(state.get()?.[activeIdKey], id);

      // Phase 36I: State/UI drift guard. If the state says the row is active
      // but the DOM does not show it as active, the first user tap must repair
      // the visual state by selecting again, not deselecting.
      if (stateActive && domActive) {
        PlatformFocusManager.preserveFocusDuring(root, () => preserveSavedRecordMutation(() => state.set({ [activeIdKey]: null, [nameKey]: '', [expandedIdKey]: state.get()?.[expandedIdKey] }, { action: 'line:deselect' })));
        return;
      }

      const hydrated = hydrateRecord?.({ item, currentState: state.get() }) || {};
      PlatformFocusManager.preserveFocusDuring(root, () => preserveSavedRecordMutation(() => state.set({ ...hydrated, [activeIdKey]: id, [expandedIdKey]: state.get()?.[expandedIdKey] }, { action: stateActive ? 'line:resync-active' : 'line:select' })));
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
      const domCollapsed = cardEl.classList.contains('is-collapsed');

      // Phase 36I: State/UI drift guard. If the state says expanded but the DOM
      // row is collapsed, the first user tap must open the row, not close it.
      const willOpen = domCollapsed ? true : !isSameId(currentExpanded, id);

      PlatformFocusManager.preserveFocusDuring(root, () => preserveSavedRecordMutation(() => state.set({ [expandedIdKey]: willOpen ? id : null }, { action: 'line:toggle' })));
    };

    const lineActionKey = (action, id = '') => `${action}:${id || ''}`;

    const markHandledLineAction = (action, id = '') => {
      root.__tcLineSectionHandledAction = {
        key: lineActionKey(action, id),
        at: Date.now()
      };
    };

    const wasHandledLineAction = (action, id = '') => {
      const last = root.__tcLineSectionHandledAction || {};
      return last.key === lineActionKey(action, id) && Date.now() - Number(last.at || 0) < 700;
    };

    const handleLineAction = (element, event) => {
      const action = element?.dataset?.tcAction || '';
      if (!action || !root.contains(element)) return false;
      if (action !== 'line:save' && action !== 'line:update' && action !== 'saved:load' && action !== 'saved:delete' && action !== 'saved:toggle') return false;

      const id = element?.getAttribute?.('data-line-select')
        || element?.getAttribute?.('data-line-delete')
        || element?.getAttribute?.('data-line-toggle')
        || element?.closest?.('[data-line-select]')?.getAttribute?.('data-line-select')
        || element?.closest?.('[data-line-delete]')?.getAttribute?.('data-line-delete')
        || element?.closest?.('[data-line-toggle]')?.getAttribute?.('data-line-toggle')
        || '';

      if (event?.type === 'click' && wasHandledLineAction(action, id)) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        event?.stopImmediatePropagation?.();
        return true;
      }

      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      commitAllFields(root, state, { action: `${action}:pre-commit`, notify: false });

      if (action === 'line:save') saveCurrent({ root, element, event });
      else if (action === 'line:update') updateCurrent({ root, element, event });
      else if (action === 'saved:load') load(id, element);
      else if (action === 'saved:delete') deleteLine(id);
      else if (action === 'saved:toggle') toggle(element);

      markHandledLineAction(action, id);
      return true;
    };

    root.__tcLineSectionDirectContext = { handleLineAction };
    if (!root.__tcLineSectionDirectActionBound) {
      root.__tcLineSectionDirectActionBound = true;
      const direct = event => {
        const element = event.target?.closest?.('[data-tc-action]');
        if (!element || !root.contains(element)) return;
        const action = element.dataset.tcAction || '';
        const id = element.getAttribute('data-line-select') || element.getAttribute('data-line-delete') || element.getAttribute('data-line-toggle') || element.closest?.('[data-line-select]')?.getAttribute('data-line-select') || '';
        const key = `${action}:${id}`;
        const now = Date.now();
        const last = root.__tcLineSectionDirectLast || {};
        if (last.key === key && now - Number(last.at || 0) < 350) {
          event.preventDefault?.();
          event.stopPropagation?.();
          event.stopImmediatePropagation?.();
          return;
        }
        const handler = root.__tcLineSectionDirectContext?.handleLineAction;
        if (typeof handler === 'function' && handler(element, event)) root.__tcLineSectionDirectLast = { key, at: now };
      };
      root.addEventListener('pointerdown', direct, true);
    }

    registerCentralActions(root, {
      'line:save': ({ element, event }) => handleLineAction(element, event),
      'line:update': ({ element, event }) => handleLineAction(element, event),
      'saved:load': ({ element, event }) => handleLineAction(element, event),
      'saved:delete': ({ element, event }) => handleLineAction(element, event),
      'saved:toggle': ({ element, event }) => handleLineAction(element, event)
    });
  };

  return { read, write, renderRows, renderCard, updateControls, bind };
}

export default createLineSectionController;
