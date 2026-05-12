import { createModuleState } from '../../core/state.js';

const STORAGE_KEY = 'techcalc:hx-diagram:processes';
const LEGACY_POINTS_KEY = 'techcalc:hx-diagram:points';

function createId() {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch { /* ignore */ }
  return `hx-process-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadProcesses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'object') : [];
  } catch {
    return [];
  }
}

export function saveProcesses(processes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(processes ?? [])); } catch { /* localStorage may be unavailable */ }
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

export function clearLegacyPoints() {
  try { localStorage.removeItem(LEGACY_POINTS_KEY); } catch { /* ignore */ }
}

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
