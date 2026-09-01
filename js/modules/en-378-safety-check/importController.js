import { getModuleStore } from '../../core/centralStore.js';
import { buildEN378StateFromFGasesSnapshot, validateFGasesSystemSnapshot } from './snapshotImport.js';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export const IMPORT_ACTION = 'en378:import-f-gases-snapshot';

export function listFGasesSavedSystems() {
  const fgasesStore = getModuleStore('f-gases-check');
  const fgasesState = fgasesStore?.get?.() || {};
  return Array.isArray(fgasesState.savedSystems) ? fgasesState.savedSystems : [];
}

export function hasAnyFGasesSavedSystem() {
  return listFGasesSavedSystems().length > 0;
}

export function hasMultipleFGasesSavedSystems() {
  return listFGasesSavedSystems().length > 1;
}

export function buildFGasesImportOptions() {
  const systems = listFGasesSavedSystems();
  return Object.freeze([
    Object.freeze({ value: '', label: systems.length ? 'Anlage auswählen' : 'Keine gespeicherte F-Gase-Anlage vorhanden' }),
    ...systems.map((item, index) => Object.freeze({
      value: String(item.id || index),
      label: item.name || item.title || `F-Gase-Anlage ${index + 1}`
    }))
  ]);
}

export function getFGasesSavedSystemById(id) {
  const systems = listFGasesSavedSystems();
  return systems.find((item, index) => String(item.id || index) === String(id || '')) || null;
}

function selectImportCandidate(currentState = {}) {
  const selectedId = currentState.fGasesSnapshotId || '';
  const selected = selectedId ? getFGasesSavedSystemById(selectedId) : null;
  if (selected) return selected;
  const systems = listFGasesSavedSystems();
  return systems.length === 1 ? systems[0] : null;
}

export function buildFGasesImportPatch(currentState = {}) {
  const candidate = selectImportCandidate(currentState);
  if (!candidate) {
    return Object.freeze({
      importStatus: 'rejected',
      importErrors: Object.freeze(['Es wurde keine gespeicherte F-Gase-Anlage ausgewählt.'])
    });
  }

  const snapshot = candidate.systemSnapshot || candidate.importedSnapshot || candidate.snapshot || null;
  const validation = validateFGasesSystemSnapshot(snapshot || {});
  if (!validation.isValid) {
    return Object.freeze({
      fGasesSnapshotId: String(candidate.id || ''),
      importStatus: 'rejected',
      importErrors: Object.freeze(['Der gespeicherte Anlagenstand kann nicht importiert werden.'])
    });
  }

  return Object.freeze({
    fGasesSnapshotId: String(candidate.id || ''),
    ...buildEN378StateFromFGasesSnapshot(clone(snapshot), currentState)
  });
}

export function bindFGasesSnapshotImport(root, moduleState) {
  if (!root || !moduleState?.set) return;
  root.addEventListener('click', event => {
    const button = event.target?.closest?.(`[data-tc-action="${IMPORT_ACTION}"]`);
    if (!button || !root.contains(button)) return;
    event.preventDefault();
    event.stopPropagation();
    const patch = buildFGasesImportPatch(moduleState.get?.() || {});
    moduleState.set(patch, { action: IMPORT_ACTION, notify: true });
  });
}

export default Object.freeze({
  IMPORT_ACTION,
  listFGasesSavedSystems,
  hasAnyFGasesSavedSystem,
  hasMultipleFGasesSavedSystems,
  buildFGasesImportOptions,
  getFGasesSavedSystemById,
  buildFGasesImportPatch,
  bindFGasesSnapshotImport
});
