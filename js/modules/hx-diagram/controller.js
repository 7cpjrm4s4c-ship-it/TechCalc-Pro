import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { registerCentralActions } from '../../core/eventPipeline.js';
import { toggleNumericSign } from '../../core/renderer.js';
import { state, normalizeSavedProcesses, clearLegacyPoints } from './state.js';
import { calculate } from './logic.js';
import { buildHxProcessRecord, hxProcessStats } from './results.js';

function clearGeneratedPath() {
  state.set({ activePath: [], points: [] }, { notify: false });
}

function commitFieldValue(rootEl, id, value, action = 'hx:field-commit') {
  if (!id) return;
  const input = rootEl?.querySelector?.(`[data-field="${id}"]`);
  if (input) {
    input.value = value;
    input.dispatchEvent?.(new Event('input', { bubbles: true }));
  }
  state.set({ [id]: value, activePath: [], points: [] }, { action });
}

function normalizeProcessSnapshot(snapshot = {}) {
  const savedProcesses = normalizeSavedProcesses(snapshot);
  return { ...snapshot, savedProcesses, processes: savedProcesses };
}

function commitVisibleFields(rootEl) {
  if (!rootEl?.querySelectorAll) return;
  const patch = {};
  rootEl.querySelectorAll('[data-field]').forEach(el => {
    if (el?.dataset?.field) patch[el.dataset.field] = el.value;
  });
  if (Object.keys(patch).length) state.set(patch, { action: 'hx:commit-visible-fields', notify: false });
}

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function readSavedProcessesFromState(snapshot = state.get()) {
  return normalizeSavedProcesses(snapshot).map(item => ({ ...item }));
}

export function updateActiveProcessFromDialog(rootEl) {
  commitVisibleFields(rootEl);
  const current = normalizeProcessSnapshot(state.get());
  const id = current.activeProcessId;
  if (!id) return null;
  const items = readSavedProcessesFromState(current);
  const existing = items.find(item => sameId(item.id, id));
  if (!existing) return null;
  const name = rootEl?.querySelector?.('#hxProcessName')?.value?.trim() || current.label || existing.name || existing.label || 'h,x-Prozess';
  const nextState = { ...current, label: name };
  const result = calculate(nextState);
  const record = buildHxProcessRecord(nextState, result, items, id, name, existing);
  const next = items.map(item => sameId(item.id, id) ? record : item);
  state.set({
    savedProcesses: next,
    processes: next,
    label: record.input?.label || record.name || name,
    process: record.process || record.input?.process || current.process || 'heat',
    activeProcessId: record.id,
    activePath: Array.isArray(record.path) ? record.path : [],
    expandedProcessId: current.expandedProcessId || null,
    points: []
  }, { action: 'hx:line:update' });
  return record;
}

export function deleteSavedProcessById(id) {
  const current = normalizeProcessSnapshot(state.get());
  const next = readSavedProcessesFromState(current).filter(item => !sameId(item.id, id));
  const wasActive = sameId(current.activeProcessId, id);
  const wasExpanded = sameId(current.expandedProcessId, id);
  state.set({
    savedProcesses: next,
    processes: next,
    activeProcessId: wasActive ? null : current.activeProcessId,
    label: wasActive ? '' : current.label,
    activePath: wasActive ? [] : (Array.isArray(current.activePath) ? current.activePath : []),
    expandedProcessId: wasExpanded || wasActive ? null : current.expandedProcessId,
    points: []
  }, { action: 'hx:line:delete' });
  return next;
}

function bindHxProcessActionOverrides(rootEl) {
  registerCentralActions(rootEl, {
    'hx:clear': ({ root }) => clearDiagram(root || rootEl),
    'line:update': ({ root }) => updateActiveProcessFromDialog(root || rootEl),
    'saved:delete': ({ element }) => {
      const id = element?.getAttribute?.('data-line-delete') || element?.closest?.('[data-line-delete]')?.getAttribute?.('data-line-delete');
      if (id) deleteSavedProcessById(id);
    }
  });
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

function clearDiagram(rootEl = null) {
  clearLegacyPoints();
  const patch = {
    label: '',
    tempC: '',
    rhPercent: '',
    targetTempC: '',
    targetRhPercent: '',
    activeProcessId: null,
    activePath: [],
    points: []
  };
  if (rootEl?.querySelectorAll) {
    ['tempC', 'rhPercent', 'targetTempC', 'targetRhPercent', 'hxProcessName'].forEach(id => {
      const field = rootEl.querySelector(`#${id}, [data-field="${id}"]`);
      if (field) field.value = '';
    });
  }
  state.set(patch, { action: 'hx:clear' });
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
      commitVisibleFields(rootEl);
      const current = state.get();
      const nextProcess = processButton.dataset.value || current.process || 'heat';
      const nextState = { ...current, process: nextProcess };
      const hasCompleteInput = [nextState.tempC, nextState.rhPercent, nextState.targetTempC, nextState.targetRhPercent]
        .every(value => String(value ?? '').trim() !== '');
      const nextResult = hasCompleteInput ? calculate(nextState) : null;
      const previewPath = nextResult?.processPath || [];
      state.set({
        process: nextProcess,
        activePath: previewPath,
        points: []
      }, { action: 'hx:process' });
      return;
    }

    const signButton = target.closest?.('[data-hx-sign]');
    if (signButton && rootEl.contains(signButton)) {
      event.preventDefault();
      event.stopPropagation();
      const id = signButton.dataset.hxSign;
      const input = rootEl.querySelector(`[data-field="${id}"]`);
      const currentValue = input?.value ?? state.get?.()?.[id] ?? '';
      const next = toggleNumericSign(currentValue);
      commitFieldValue(rootEl, id, next, 'hx:toggle-sign');
      try { input?.focus?.({ preventScroll: true }); input?.select?.(); } catch { /* optional focus restore */ }
      return;
    }

    const clearButton = target.closest?.('[data-hx-clear]');
    if (clearButton && rootEl.contains(clearButton)) {
      event.preventDefault();
      event.stopPropagation();
      clearDiagram(rootEl);
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
  bindHxProcessActionOverrides(rootEl);
}

