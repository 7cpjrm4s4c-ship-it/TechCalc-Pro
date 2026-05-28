import { bindSavedRecordList, replaceRecord, removeRecord, isSameId } from './savedRecords.js';
import { preserveActionScroll, preserveSavedRecordScroll } from './scrollManager.js';
import { markCommittedAction } from './formActions.js';

function bindScopedOnce(root, key, eventName, listener, options) {
  root.__tcSavedCalculationBindings = root.__tcSavedCalculationBindings || new Set();
  const bindingKey = `${key}:${eventName}`;
  if (root.__tcSavedCalculationBindings.has(bindingKey)) return;
  root.__tcSavedCalculationBindings.add(bindingKey);
  root.addEventListener(eventName, listener, options);
}

function matchesSelector(target, selector, root) {
  if (!selector || !target?.closest) return null;
  const el = target.closest(selector);
  return el && root.contains(el) ? el : null;
}

export function bindSavedCalculationActions(root, {
  state,
  calculate,
  snapshot,
  clearInputs,
  saveSelector,
  updateSelector,
  loadAttr,
  toggleAttr = 'data-line-toggle',
  deleteAttr,
  preserveSaveScroll = false
} = {}) {
  if (!root || !state || typeof state.get !== 'function' || typeof state.set !== 'function') return;

  const key = `savedCalculation:${saveSelector}|${updateSelector}|${loadAttr}|${deleteAttr}`;

  bindScopedOnce(root, key, 'click', event => {
    const saveButton = matchesSelector(event.target, saveSelector, root);
    if (saveButton) {
      event.preventDefault();
      event.stopPropagation();
      markCommittedAction(root);
      const run = () => {
        const current = state.get();
        const record = snapshot({ ...current, activeCalculationId: null }, calculate(current));
        state.set({ savedCalculations: [record, ...(current.savedCalculations || [])], activeCalculationId: null, name: '' });
      };
      preserveSaveScroll ? preserveActionScroll(run) : run();
      return;
    }

    const updateButton = matchesSelector(event.target, updateSelector, root);
    if (updateButton) {
      event.preventDefault();
      event.stopPropagation();
      markCommittedAction(root);
      const run = () => {
        const current = state.get();
        const id = current.activeCalculationId;
        if (!id) return;
        const saved = current.savedCalculations || [];
        const existing = saved.find(item => isSameId(item.id, id));
        if (!existing) return;
        const record = { ...snapshot(current, calculate(current)), id, createdAt: existing.createdAt || new Date().toISOString() };
        state.set({ savedCalculations: replaceRecord(saved, id, record), activeCalculationId: id, name: record.name });
      };
      preserveActionScroll(run);
    }
  }, true);

  bindSavedRecordList(root, {
    loadAttr,
    toggleAttr,
    deleteAttr,
    preserveLoadScroll: false,
    onLoad: (id, card, event) => {
      const current = state.get();
      const item = (current.savedCalculations || []).find(entry => isSameId(entry.id, id));
      if (!item?.state) return;
      markCommittedAction(root);
      preserveSavedRecordScroll(() => {
        if (isSameId(current.activeCalculationId, item.id)) {
          state.set(clearInputs(current));
          return;
        }
        state.set({ ...item.state, savedCalculations: current.savedCalculations || [], activeCalculationId: item.id, name: item.name || item.state.name || '' });
      }, { anchor: card, event });
    },
    onDelete: id => {
      const current = state.get();
      markCommittedAction(root);
      preserveActionScroll(() => state.set({
        savedCalculations: removeRecord(current.savedCalculations || [], id),
        activeCalculationId: isSameId(current.activeCalculationId, id) ? null : current.activeCalculationId
      }));
    }
  });
}
