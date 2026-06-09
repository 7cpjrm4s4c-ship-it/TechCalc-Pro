import { state, saveProcesses, makeProcessRecord, clearLegacyPoints } from './state.js';
import { calculate } from './logic.js';
import { toggleNumericSign } from '../../core/renderer.js';

function clearGeneratedPath() {
  state.set({ activePath: [], points: [] }, { notify: false });
}

function commitDomFields(rootEl) {
  rootEl.querySelectorAll('[data-field]').forEach(el => {
    if (el?.dataset?.field) state.set({ [el.dataset.field]: el.value }, { notify: false });
  });
}

function addProcess(rootEl) {
  commitDomFields(rootEl);
  const s = { ...state.get(), activeProcessId: null };
  const result = calculate(s);
  const record = makeProcessRecord({ input: s, result });
  const processes = [record, ...(s.processes ?? [])];
  saveProcesses(processes);
  clearLegacyPoints();
  state.set({ processes, activeProcessId: null, activePath: [], points: [] });
}

function updateProcess(rootEl, event) {
  event?.preventDefault?.();
  commitDomFields(rootEl);
  const s = state.get();
  if (!s.activeProcessId) return;
  const existing = (s.processes ?? []).find(item => item.id === s.activeProcessId);
  if (!existing) return;
  const result = calculate(s);
  const record = makeProcessRecord({ input: { ...s, activeProcessId: existing.id }, result, id: existing.id, existing });
  const processes = (s.processes ?? []).map(item => item.id === existing.id ? record : item);
  saveProcesses(processes);
  clearLegacyPoints();
  document.activeElement?.blur?.();
  state.set({ processes, activeProcessId: record.id, activePath: record.path, points: [] });
}

function clearDiagram() {
  clearLegacyPoints();
  state.set({ label: '', tempC: '', rhPercent: '', targetTempC: '', targetRhPercent: '', activeProcessId: null, activePath: [], points: [] });
}

function selectProcess(selectedId) {
  const current = state.get();
  if (current.activeProcessId === selectedId) {
    state.set({ activeProcessId: null, activePath: [], points: [] });
    return;
  }
  const process = (current.processes ?? []).find(item => item.id === selectedId);
  if (!process) return;
  state.set({ ...(process.input ?? {}), process: process.process || process.input?.process || 'heat', activeProcessId: process.id, activePath: process.path ?? [] });
}

function removeProcess(id) {
  const current = state.get();
  const processes = (current.processes ?? []).filter(process => process.id !== id);
  saveProcesses(processes);
  const wasActive = current.activeProcessId === id;
  state.set({ processes, activeProcessId: wasActive ? null : current.activeProcessId, activePath: wasActive ? [] : current.activePath });
}

export function bindHxDiagramActions(rootEl) {
  if (!rootEl || rootEl.__tcHxDiagramBound) return;
  rootEl.__tcHxDiagramBound = true;

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

  rootEl.addEventListener('pointerdown', event => {
    const target = event.target;

    const update = target.closest?.('[data-hx-update]');
    if (update && rootEl.contains(update)) {
      updateProcess(rootEl, event);
      return;
    }
  }, true);

  rootEl.addEventListener('click', event => {
    const target = event.target;

    const processButton = target.closest?.('[data-segment="process"]');
    if (processButton && rootEl.contains(processButton)) {
      event.preventDefault();
      event.stopPropagation();
      state.set({ process: processButton.dataset.value, activePath: [], points: [] });
      return;
    }

    const signButton = target.closest?.('[data-hx-sign]');
    if (signButton && rootEl.contains(signButton)) {
      event.preventDefault();
      const id = signButton.dataset.hxSign;
      const input = rootEl.querySelector(`[data-field="${id}"]`);
      const next = toggleNumericSign(input?.value);
      state.set({ [id]: next, activePath: [], points: [] });
      return;
    }

    const addButton = target.closest?.('[data-hx-add]');
    if (addButton && rootEl.contains(addButton)) {
      event.preventDefault();
      if (addButton.hasAttribute('disabled')) return;
      addProcess(rootEl);
      return;
    }

    const updateButton = target.closest?.('[data-hx-update]');
    if (updateButton && rootEl.contains(updateButton)) {
      event.preventDefault();
      return;
    }

    const clearButton = target.closest?.('[data-hx-clear]');
    if (clearButton && rootEl.contains(clearButton)) {
      event.preventDefault();
      clearDiagram();
      return;
    }

    const removeButton = target.closest?.('[data-hx-remove-process]');
    if (removeButton && rootEl.contains(removeButton)) {
      event.preventDefault();
      event.stopPropagation();
      removeProcess(removeButton.dataset.hxRemoveProcess);
      return;
    }

    const row = target.closest?.('[data-hx-select-process]');
    if (row && rootEl.contains(row)) {
      event.preventDefault();
      event.stopPropagation();
      selectProcess(row.dataset.hxSelectProcess);
      return;
    }

    const current = state.get();
    if (!current.activeProcessId) return;
    const ignored = target.closest?.('[data-hx-select-process], [data-hx-remove-process], [data-hx-add], [data-hx-update], [data-hx-clear], [data-field], [data-segment], input, select, textarea, button, label, .segmented');
    if (!ignored) state.set({ activeProcessId: null, activePath: [], points: [] });
  }, true);
}
