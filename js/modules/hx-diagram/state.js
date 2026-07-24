import { createModuleState } from '../../core/state.js';

function createId() {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch { /* ignore */ }
  return `hx-process-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadProcesses() {
  return [];
}

export function normalizeSavedProcesses(snapshot = {}) {
  const saved = Array.isArray(snapshot.savedProcesses) ? snapshot.savedProcesses : [];
  const legacy = Array.isArray(snapshot.processes) ? snapshot.processes : [];
  return saved.length ? saved : legacy;
}

export function saveProcesses(processes) {
  const next = Array.isArray(processes) ? processes : [];
  state.set({ savedProcesses: next, processes: next }, { notify: false });
}

export function makeProcessRecord({ input, result, id = null, existing = null }) {
  const recordId = id || input.activeProcessId || existing?.id || createId();
  return {
    id: recordId,
    label: String(input.label || existing?.label || 'Zustand'),
    process: result.selectedProcess || input.process || existing?.process || 'heat',
    processLabel: result.changeType,
    input: {
      label: String(input.label || existing?.input?.label || 'Zustand'),
      airVolumeM3h: String(input.airVolumeM3h ?? ''),
      tempC: String(input.tempC ?? ''),
      rhPercent: String(input.rhPercent ?? ''),
      targetTempC: String(input.targetTempC ?? ''),
      targetRhPercent: String(input.targetRhPercent ?? ''),
      heatingSupplyTempC: String(input.heatingSupplyTempC ?? ''),
      heatingReturnTempC: String(input.heatingReturnTempC ?? ''),
      coolingSupplyTempC: String(input.coolingSupplyTempC ?? ''),
      coolingReturnTempC: String(input.coolingReturnTempC ?? ''),
      process: result.selectedProcess || input.process || existing?.input?.process || 'heat'
    },
    path: result.processPath,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function clearLegacyPoints() { /* no persistent legacy data */ }

export const state = createModuleState({
  airVolumeM3h: '',
  tempC: '',
  rhPercent: '',
  targetTempC: '',
  targetRhPercent: '',
  heatingSupplyTempC: '',
  heatingReturnTempC: '',
  coolingSupplyTempC: '',
  coolingReturnTempC: '',
  process: 'heat',
  activeProcessId: null,
  activePath: [],
  savedProcesses: loadProcesses(),
  processes: loadProcesses(),
  expandedProcessId: null,
  points: []
});