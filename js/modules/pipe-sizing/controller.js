import { state } from './state.js';
import { calculate } from './logic.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { fmt } from '../../utils/calculations.js';

export function savedPipeStats(item = {}){
  return [
    { label: 'System', value: item.result?.system || '—' },
    { label: 'Dimension', value: item.result?.dn ? `DN ${item.result.dn}` : '—' },
    { label: 'Druckverlust', value: item.result?.pressureLoss ? fmt(item.result.pressureLoss) : '—', unit: item.result?.pressureLoss ? 'Pa/m' : '' },
    { label: 'Massenstrom', value: item.result?.massFlowKgh || '—', unit: item.result?.massFlowKgh ? 'kg/h' : '' },
    { label: 'Volumenstrom', value: item.result?.volumeFlowM3h || '—', unit: item.result?.volumeFlowM3h ? 'm³/h' : '' }
  ];
}

export function buildPipeRecord(currentState, result, items, id, name, existing = null){
  const copy = { ...currentState };
  delete copy.savedPipes;
  delete copy.activePipeId;
  delete copy.expandedPipeId;
  return {
    id,
    name: name || currentState.pipeName?.trim() || existing?.name || `Rohrauslegung ${items.length + 1}`,
    state: copy,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: result && !result.noDimension
      ? {
          system: result.system?.label,
          dn: result.dn,
          velocity: result.velocity,
          pressureLoss: result.pressureLoss,
          massFlowKgh: currentState.flowUnit === 'kg/h' ? currentState.flowValue : currentState.massFlowKgh,
          volumeFlowM3h: currentState.flowUnit === 'm³/h' ? currentState.flowValue : currentState.volumeFlowM3h
        }
      : {
          massFlowKgh: currentState.flowUnit === 'kg/h' ? currentState.flowValue : currentState.massFlowKgh,
          volumeFlowM3h: currentState.flowUnit === 'm³/h' ? currentState.flowValue : currentState.volumeFlowM3h
        }
  };
}

export function hydrateSavedPipe(item, currentState) {
  return item?.state ? {
    ...item.state,
    savedPipes: currentState.savedPipes || [],
    activePipeId: item.id,
    expandedPipeId: currentState.expandedPipeId || null,
    pipeName: item.name || item.state?.pipeName || ''
  } : {};
}

export const pipeSizingSavedController = createLineSectionController({
  state,
  listKey: 'savedPipes',
  activeIdKey: 'activePipeId',
  nameKey: 'pipeName',
  expandedIdKey: 'expandedPipeId',
  recordPrefix: 'pipe',
  cardTitle: 'Rohrauslegung speichern',
  nameLabel: 'Bezeichnung',
  nameInputId: 'pipeName',
  namePlaceholder: 'z. B. Hauptleitung Technik',
  emptyText: 'Noch keine Rohrauslegungen gespeichert.',
  accent: 'blue',
  dynamicAttr: 'saved-records',
  dynamicDataAttr: 'data-pipe-dynamic',
  title: item => item.name || 'Rohrauslegung',
  stats: savedPipeStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildPipeRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrateSavedPipe(item, currentState)
});

export function pipeSaveCard(s){
  return pipeSizingSavedController.renderCard(s);
}

export function bindPipeSizingActions(root) {
  pipeSizingSavedController.bind(root);
}
