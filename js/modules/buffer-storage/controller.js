import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { fmt } from '../../utils/calculations.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { mediumLabel, modeLabel } from './results.js';

export function savedBufferStats(item = {}){
  const res = item.result || {};
  return [
    { label: 'Berechnungsart', value: modeLabel(res.mode) },
    { label: 'Normvolumen', value: res.standard ? fmt(res.standard, 0) : '—', unit: res.standard ? 'Liter' : '' },
    { label: 'Volumen', value: res.volume ? fmt(res.volume, 1) : '—', unit: res.volume ? 'Liter' : '' },
    { label: 'Medium', value: res.medium || '—' }
  ];
}

export function buildBufferRecord(currentState, result, items, id, name, existing = null){
  const copy = { ...currentState };
  delete copy.savedBuffers;
  delete copy.savedCalculations;
  delete copy.activeBufferId;
  delete copy.activeCalculationId;
  delete copy.expandedBufferId;

  return {
    id,
    name: name || currentState.plantName?.trim() || existing?.name || `Pufferspeicher ${items.length + 1}`,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    result: {
      mode: currentState.calculationMode,
      volume: result?.decisiveVolume,
      standard: result?.nextStandardVolume,
      medium: mediumLabel(currentState)
    }
  };
}

export function savedBufferPatch(item, currentState = {}){
  const legacy = Array.isArray(currentState.savedCalculations) ? currentState.savedCalculations : [];
  const saved = Array.isArray(currentState.savedBuffers) && currentState.savedBuffers.length ? currentState.savedBuffers : legacy;
  return item?.state ? {
    ...item.state,
    savedBuffers: saved,
    activeBufferId: item.id,
    expandedBufferId: currentState.expandedBufferId || null,
    plantName: item.name || item.state?.plantName || ''
  } : {};
}

export const bufferStorageSavedController = createLineSectionController({
  state,
  listKey: 'savedBuffers',
  activeIdKey: 'activeBufferId',
  nameKey: 'plantName',
  expandedIdKey: 'expandedBufferId',
  recordPrefix: 'buffer',
  cardTitle: 'Berechnung speichern',
  nameLabel: 'Bezeichnung',
  nameInputId: 'plantName',
  namePlaceholder: 'z. B. Kaltwassersatz BT A',
  emptyText: 'Noch keine Pufferspeicher-Berechnungen gespeichert.',
  accent: 'cyan',
  dynamicAttr: 'saved-records',
  dynamicDataAttr: 'data-buffer-dynamic',
  title: item => item.name || 'Pufferspeicher',
  stats: savedBufferStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildBufferRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => savedBufferPatch(item, currentState)
});

function normalizeBufferSnapshot(snapshot = {}){
  const legacy = Array.isArray(snapshot.savedCalculations) ? snapshot.savedCalculations : [];
  const saved = Array.isArray(snapshot.savedBuffers) && snapshot.savedBuffers.length ? snapshot.savedBuffers : legacy;
  return { ...snapshot, savedBuffers: saved };
}

export function bufferSaveCard(s){
  return bufferStorageSavedController.renderCard(normalizeBufferSnapshot(s));
}

export function bindBufferStorageActions(root){
  const current = state.get();
  if ((!Array.isArray(current.savedBuffers) || !current.savedBuffers.length) && Array.isArray(current.savedCalculations) && current.savedCalculations.length) {
    state.set({ savedBuffers: current.savedCalculations }, { action: 'buffer:migrate-saved-records', notify: false });
  }
  bufferStorageSavedController.bind(root);
}
