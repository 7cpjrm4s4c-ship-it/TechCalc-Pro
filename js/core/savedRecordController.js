import { bindSavedRecordList, createRecordId, isSameId, removeRecord, replaceRecord } from './savedRecords.js';
import { preserveActionScroll, preserveSavedRecordScroll } from './scrollManager.js';
import { markCommittedAction } from './formActions.js';

function bindScopedOnce(root, key, eventName, listener, options) {
  root.__tcSavedRecordControllerBindings = root.__tcSavedRecordControllerBindings || new Set();
  const bindingKey = `${key}:${eventName}`;
  if (root.__tcSavedRecordControllerBindings.has(bindingKey)) return;
  root.__tcSavedRecordControllerBindings.add(bindingKey);
  root.addEventListener(eventName, listener, options);
}

function closest(root, target, selector) {
  if (!root || !selector || !target?.closest) return null;
  const element = target.closest(selector);
  return element && root.contains(element) ? element : null;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

export function createSavedRecord({
  prefix = 'record',
  current = {},
  calculate = null,
  snapshot,
  existing = null
} = {}) {
  if (typeof snapshot !== 'function') throw new Error('createSavedRecord requires snapshot()');
  const result = typeof calculate === 'function' ? calculate(current) : undefined;
  const now = new Date().toISOString();
  return {
    id: existing?.id || createRecordId(prefix),
    ...snapshot(current, result, existing),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

export function savedRecordReducer(state, {
  listKey,
  activeIdKey,
  nameKey = null,
  action,
  record = null,
  id = null,
  patch = {},
  clearNameOnCreate = true
} = {}) {
  const current = state || {};
  const list = arrayValue(current[listKey]);

  if (action === 'create') {
    return {
      ...current,
      [listKey]: [record, ...list],
      [activeIdKey]: null,
      ...(nameKey && clearNameOnCreate ? { [nameKey]: '' } : {}),
      ...patch
    };
  }

  if (action === 'update') {
    return {
      ...current,
      [listKey]: replaceRecord(list, id, record),
      [activeIdKey]: id,
      ...(nameKey ? { [nameKey]: record?.name || current[nameKey] || '' } : {}),
      ...patch
    };
  }

  if (action === 'delete') {
    const wasActive = isSameId(current[activeIdKey], id);
    return {
      ...current,
      [listKey]: removeRecord(list, id),
      [activeIdKey]: wasActive ? null : current[activeIdKey],
      ...(nameKey && wasActive ? { [nameKey]: '' } : {}),
      ...patch
    };
  }

  if (action === 'load') {
    return {
      ...current,
      ...patch,
      [listKey]: list,
      [activeIdKey]: id,
      ...(nameKey ? { [nameKey]: patch?.[nameKey] || record?.name || current[nameKey] || '' } : {})
    };
  }

  return current;
}

export function bindSavedRecordWorkflow(root, {
  state,
  calculate,
  snapshot,
  hydrate,
  clear,
  listKey,
  activeIdKey,
  nameKey = null,
  recordPrefix = 'record',
  saveSelector,
  updateSelector,
  loadAttr,
  toggleAttr = 'data-line-toggle',
  deleteAttr,
  ignoreSelector = '',
  preserveSaveScroll = false,
  preserveLoadScroll = false,
  clearOnOutsideClick = false
} = {}) {
  if (!root || !state || typeof state.get !== 'function' || typeof state.set !== 'function') return;
  if (!listKey || !activeIdKey || !loadAttr || !deleteAttr) return;

  const key = `savedRecordWorkflow:${listKey}:${activeIdKey}:${saveSelector || ''}:${updateSelector || ''}:${loadAttr}:${deleteAttr}`;

  bindScopedOnce(root, key, 'click', event => {
    const saveButton = closest(root, event.target, saveSelector);
    if (saveButton) {
      event.preventDefault();
      event.stopPropagation();
      markCommittedAction(root);
      const run = () => {
        const current = state.get();
        const record = createSavedRecord({
          prefix: recordPrefix,
          current: { ...current, [activeIdKey]: null },
          calculate,
          snapshot
        });
        state.set(savedRecordReducer(current, { listKey, activeIdKey, nameKey, action: 'create', record }));
      };
      preserveSaveScroll ? preserveActionScroll(run) : run();
      return;
    }

    const updateButton = closest(root, event.target, updateSelector);
    if (updateButton) {
      event.preventDefault();
      event.stopPropagation();
      markCommittedAction(root);
      const run = () => {
        const current = state.get();
        const id = current[activeIdKey];
        if (!id) return;
        const existing = arrayValue(current[listKey]).find(item => isSameId(item.id, id));
        if (!existing) return;
        const record = createSavedRecord({ prefix: recordPrefix, current, calculate, snapshot, existing });
        state.set(savedRecordReducer(current, { listKey, activeIdKey, nameKey, action: 'update', id, record }));
      };
      preserveActionScroll(run);
    }
  }, true);

  bindSavedRecordList(root, {
    loadAttr,
    toggleAttr,
    deleteAttr,
    preserveLoadScroll,
    onLoad: (id, card, event) => {
      const current = state.get();
      const item = arrayValue(current[listKey]).find(entry => isSameId(entry.id, id));
      if (!item) return;
      markCommittedAction(root);
      const apply = () => {
        const patch = typeof hydrate === 'function' ? hydrate(item, current) : { ...(item.state || item.inputState || item) };
        state.set(savedRecordReducer(current, { listKey, activeIdKey, nameKey, action: 'load', id: item.id, record: item, patch }));
      };
      preserveLoadScroll ? preserveSavedRecordScroll(apply, { anchor: card, event }) : apply();
    },
    onDelete: id => {
      const current = state.get();
      markCommittedAction(root);
      preserveActionScroll(() => state.set(savedRecordReducer(current, {
        listKey,
        activeIdKey,
        nameKey,
        action: 'delete',
        id,
        patch: typeof clear === 'function' && isSameId(current[activeIdKey], id) ? clear(current) : {}
      })));
    }
  });

  if (clearOnOutsideClick) {
    const clearKey = `${key}:outside-clear`;
    bindScopedOnce(root, clearKey, 'click', event => {
      const current = state.get();
      if (!current[activeIdKey]) return;
      const baseIgnore = '[data-line-card], .saved-record-card, .line-section-card, .tc-save-actions, input, select, textarea, button, label, .segmented, .segmented button';
      const selector = ignoreSelector ? `${baseIgnore}, ${ignoreSelector}` : baseIgnore;
      if (event.target?.closest?.(selector)) return;
      const patch = typeof clear === 'function' ? clear(current) : {};
      preserveActionScroll(() => state.set({ ...patch, [activeIdKey]: null, ...(nameKey ? { [nameKey]: '' } : {}) }));
    });
  }
}
