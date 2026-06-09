import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { toggleNumericSign } from '../../core/renderer.js';
import { state, normalizeSavedProcesses, clearLegacyPoints } from './state.js';
import { calculate } from './logic.js';
import { buildHxProcessRecord, hxProcessStats } from './results.js';

function clearGeneratedPath() {
  state.set({ activePath: [], points: [] }, { notify: false });
}

function normalizeProcessSnapshot(snapshot = {}) {
  const savedProcesses = normalizeSavedProcesses(snapshot);
  return { ...snapshot, savedProcesses, processes: savedProcesses };
}

export function savedProcessPatch(item, currentState = {}) {
  const normalized = normalizeProcessSnapshot(currentState);
  return {
    ...(item.input || {}),
    label: item.input?.label || item.name || item.label || '',
    process: item.process || item.input?.process || 'heat',
    savedProcesses: normalized.savedProcesses,
    processes: normalized.savedProcesses,
    activeProcessId: item.id,
    activePath: Array.isArray(item.path) ? item.path : [],
    expandedProcessId: currentState.expandedProcessId || null,
    points: []
  };
}

export const hxProcessController = createLineSectionController({
  state,
  listKey: 'savedProcesses',
  activeIdKey: 'activeProcessId',
  nameKey: 'label',
  expandedIdKey: 'expandedProcessId',
  recordPrefix: 'hx-process',
  cardTitle: 'Gespeicherte Prozesse',
  nameLabel: 'Bezeichnung',
  nameInputId: 'hxProcessName',
  namePlaceholder: 'z. B. Außenluft Winter',
  emptyText: 'Noch keine Prozesse gespeichert',
  accent: 'cyan',
  dynamicAttr: 'saved-processes',
  dynamicDataAttr: 'data-hx-dynamic',
  title: item => item?.name || item?.label || 'h,x-Prozess',
  stats: hxProcessStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildHxProcessRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => savedProcessPatch(item, currentState)
});

export function hxProcessCard(snapshot = {}) {
  return hxProcessController.renderCard(normalizeProcessSnapshot(snapshot));
}

function clearDiagram() {
  clearLegacyPoints();
  state.set({
    label: '',
    tempC: '',
    rhPercent: '',
    targetTempC: '',
    targetRhPercent: '',
    activeProcessId: null,
    activePath: [],
    points: []
  }, { action: 'hx:clear' });
}

function bindHxDelegation(rootEl) {
  if (!rootEl || rootEl.__tcHxDiagramActionsBound) return;
  rootEl.__tcHxDiagramActionsBound = true;

  rootEl.addEventListener('input', event => {
    const field = event.target?.closest?.('[data-field]');
    if (!field || !rootEl.contains(field)) return;
    clearGeneratedPath();
  }, true);

  rootEl.addEventListener('change', event => {
    const field = event.target?.closest?.('[data-field]');
    if (!field || !rootEl.contains(field)) return;
    clearGeneratedPath();
  }, true);

  rootEl.addEventListener('click', event => {
    const target = event.target;

    const processButton = target.closest?.('[data-segment="process"]');
    if (processButton && rootEl.contains(processButton)) {
      event.preventDefault();
      event.stopPropagation();
      state.set({ process: processButton.dataset.value, activePath: [], points: [] }, { action: 'hx:process' });
      return;
    }

    const signButton = target.closest?.('[data-hx-sign]');
    if (signButton && rootEl.contains(signButton)) {
      event.preventDefault();
      event.stopPropagation();
      const id = signButton.dataset.hxSign;
      const input = rootEl.querySelector(`[data-field="${id}"]`);
      const next = toggleNumericSign(input?.value);
      state.set({ [id]: next, activePath: [], points: [] }, { action: 'hx:toggle-sign' });
      return;
    }

    const clearButton = target.closest?.('[data-hx-clear]');
    if (clearButton && rootEl.contains(clearButton)) {
      event.preventDefault();
      event.stopPropagation();
      clearDiagram();
      return;
    }
  }, true);
}

export function bindHxDiagramActions(rootEl) {
  const current = state.get();
  const normalized = normalizeProcessSnapshot(current);
  if (normalized.savedProcesses !== current.savedProcesses || normalized.processes !== current.processes) {
    state.set({ savedProcesses: normalized.savedProcesses, processes: normalized.savedProcesses }, { action: 'hx:migrate-saved-records', notify: false });
  }
  bindHxDelegation(rootEl);
  hxProcessController.bind(rootEl);
}
