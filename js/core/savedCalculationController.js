import { bindSavedRecordWorkflow } from './savedRecordController.js';

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
  return bindSavedRecordWorkflow(root, {
    state,
    calculate,
    snapshot: (current, result, existing) => ({
      ...snapshot(current, result),
      ...(existing ? { id: existing.id, createdAt: existing.createdAt } : {})
    }),
    hydrate: (item, current) => {
      if (!item?.state) return {};
      if (String(current.activeCalculationId ?? '') === String(item.id ?? '')) {
        return typeof clearInputs === 'function' ? clearInputs(current) : { activeCalculationId: null, name: '' };
      }
      return { ...item.state, activeCalculationId: item.id, name: item.name || item.state.name || '' };
    },
    clear: current => (typeof clearInputs === 'function' ? clearInputs(current) : {}),
    listKey: 'savedCalculations',
    activeIdKey: 'activeCalculationId',
    nameKey: 'name',
    recordPrefix: 'calculation',
    saveSelector,
    updateSelector,
    loadAttr,
    toggleAttr,
    deleteAttr,
    preserveSaveScroll,
    preserveLoadScroll: false
  });
}
