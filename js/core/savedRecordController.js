import { bindSavedRecordList, createRecordId, isSameId, removeRecord, replaceRecord } from './savedRecords.js';
import { preserveActionScroll, preserveSavedRecordScroll, preserveSavedRecordMutation } from './scrollManager.js';
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
  expandedIdKey = null,
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
    const wasExpanded = expandedIdKey ? isSameId(current[expandedIdKey], id) : false;
    return {
      ...current,
      [listKey]: removeRecord(list, id),
      [activeIdKey]: wasActive ? null : current[activeIdKey],
      ...(expandedIdKey ? { [expandedIdKey]: wasExpanded ? null : current[expandedIdKey] } : {}),
      ...(nameKey && wasActive ? { [nameKey]: '' } : {}),
      ...patch
    };
  }

  if (action === 'toggle-expanded') {
    if (!expandedIdKey) return current;
    return {
      ...current,
      [expandedIdKey]: isSameId(current[expandedIdKey], id) ? null : id,
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


function recordIdFromElement(element, attrs = {}) {
  const loadAttr = attrs.loadAttr || 'data-saved-load';
  const toggleAttr = attrs.toggleAttr || 'data-saved-toggle';
  const deleteAttr = attrs.deleteAttr || 'data-saved-delete';
  const selector = `[${loadAttr}], [${toggleAttr}], [${deleteAttr}], [data-line-card]`;
  const carrier = element?.closest?.(selector) || element;
  let id = carrier?.getAttribute?.(loadAttr)
    || carrier?.getAttribute?.(toggleAttr)
    || carrier?.getAttribute?.(deleteAttr)
    || carrier?.getAttribute?.('data-saved-record-id')
    || carrier?.dataset?.savedRecordId
    || '';
  if (!id) {
    const card = element?.closest?.(`[${loadAttr}], [data-saved-record-id], [data-line-card]`);
    id = card?.getAttribute?.(loadAttr) || card?.getAttribute?.('data-saved-record-id') || card?.dataset?.savedRecordId || '';
  }
  return id;
}

export function createSavedRecordActions({
  root,
  state,
  calculate,
  snapshot,
  hydrate,
  clear,
  listKey,
  activeIdKey,
  expandedIdKey = null,
  nameKey = null,
  recordPrefix = 'record',
  beforeCreate = null,
  beforeUpdate = null,
  afterCreatePatch = null,
  attrs = {},
  preserveSaveScroll = true,
  preserveLoadScroll = true
} = {}) {
  const requireContext = () => {
    if (!state || typeof state.get !== 'function' || typeof state.set !== 'function') return null;
    if (!listKey || !activeIdKey) return null;
    return state.get() || {};
  };

  const save = () => {
    beforeCreate?.({ root, state });
    const current = requireContext();
    if (!current) return;
    const run = () => {
      const latest = state.get() || current;
      const record = createSavedRecord({
        prefix: recordPrefix,
        current: { ...latest, [activeIdKey]: null },
        calculate,
        snapshot
      });
      const patch = typeof afterCreatePatch === 'function' ? afterCreatePatch(latest, record) : {};
      state.set(savedRecordReducer(latest, {
        listKey,
        activeIdKey,
        expandedIdKey,
        nameKey,
        action: 'create',
        record,
        patch
      }), { action: 'saved-record:create' });
    };
    preserveSaveScroll ? preserveActionScroll(run) : run();
  };

  const update = () => {
    beforeUpdate?.({ root, state });
    const current = requireContext();
    if (!current) return;
    const run = () => {
      const latest = state.get() || current;
      const id = latest[activeIdKey];
      if (!id) return;
      const existing = arrayValue(latest[listKey]).find(item => isSameId(item.id, id));
      if (!existing) return;
      const record = createSavedRecord({ prefix: recordPrefix, current: latest, calculate, snapshot, existing });
      state.set(savedRecordReducer(latest, {
        listKey,
        activeIdKey,
        expandedIdKey,
        nameKey,
        action: 'update',
        id,
        record
      }), { action: 'saved-record:update' });
    };
    preserveActionScroll(run);
  };

  const load = ({ element, event } = {}) => {
    const id = recordIdFromElement(element, attrs);
    if (!id) return;
    const current = requireContext();
    if (!current) return;
    const item = arrayValue(current[listKey]).find(entry => isSameId(entry.id, id));
    if (!item) return;
    const apply = () => {
      const latest = state.get() || current;
      const patch = typeof hydrate === 'function' ? hydrate(item, latest) : { ...(item.state || item.inputState || item) };
      state.set(savedRecordReducer(latest, {
        listKey,
        activeIdKey,
        expandedIdKey,
        nameKey,
        action: 'load',
        id: item.id,
        record: item,
        patch
      }), { action: 'saved-record:load' });
    };
    const card = element?.closest?.('[data-line-card], [data-saved-record-card]') || element;
    preserveLoadScroll ? preserveSavedRecordScroll(apply, { anchor: card, event }) : apply();
  };

  const remove = ({ element, event } = {}) => {
    const id = recordIdFromElement(element, attrs);
    if (!id) return;
    const current = requireContext();
    if (!current) return;
    const patch = typeof clear === 'function' && isSameId(current[activeIdKey], id) ? clear(current) : {};
    const anchor = element?.closest?.('[data-line-card], [data-saved-record-card]') || element;
    preserveSavedRecordScroll(() => state.set(savedRecordReducer(current, {
      listKey,
      activeIdKey,
      expandedIdKey,
      nameKey,
      action: 'delete',
      id,
      patch
    }), { action: 'saved-record:delete' }), { anchor, event });
  };

  const toggle = ({ element, event } = {}) => {
    const id = recordIdFromElement(element, attrs);
    if (!id) return;
    const current = requireContext();
    if (!current) return;
    const anchor = element?.closest?.('[data-line-card], [data-saved-record-card]') || element;
    preserveSavedRecordMutation(() => state.set(savedRecordReducer(current, {
      listKey,
      activeIdKey,
      expandedIdKey,
      action: 'toggle-expanded',
      id
    }), { action: 'saved-record:toggle' }), { anchor, event });
  };

  return { save, update, load, delete: remove, toggle };
}
