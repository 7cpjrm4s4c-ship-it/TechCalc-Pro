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

export function saveProcesses(processes) {
  state.set({ processes: Array.isArray(processes) ? processes : [] }, { notify: false });
}

export function makeProcessRecord({ input, result }) {
  return {
    id: input.activeProcessId || createId(),
    label: String(input.label || 'Zustand'),
    process: result.selectedProcess || input.process || 'heat',
    processLabel: result.changeType,
    input: {
      label: String(input.label || 'Zustand'),
      tempC: String(input.tempC ?? ''),
      rhPercent: String(input.rhPercent ?? ''),
      targetTempC: String(input.targetTempC ?? ''),
      targetRhPercent: String(input.targetRhPercent ?? ''),
      process: result.selectedProcess || input.process || 'heat'
    },
    path: result.processPath,
    createdAt: new Date().toISOString()
  };
}

export function clearLegacyPoints() { /* no persistent legacy data */ }

export const state = createModuleState({
  label: 'Zustand 1',
  tempC: '-10',
  rhPercent: '90',
  targetTempC: '21',
  targetRhPercent: '50',
  process: 'adiabatic',
  activeProcessId: null,
  activePath: [],
  processes: loadProcesses(),
  points: []
});
