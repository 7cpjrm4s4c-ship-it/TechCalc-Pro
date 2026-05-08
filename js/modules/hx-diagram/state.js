import { createModuleState } from '../../core/state.js';

const STORAGE_KEY = 'techcalc:hx-diagram:processes';
const LEGACY_POINTS_KEY = 'techcalc:hx-diagram:points';

function loadProcesses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // continue with legacy fallback
  }

  try {
    const legacyRaw = localStorage.getItem(LEGACY_POINTS_KEY);
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : [];
    if (Array.isArray(legacy) && legacy.length) {
      return [{
        id: crypto.randomUUID(),
        label: 'Importierter Zustandsverlauf',
        process: 'legacy',
        processLabel: 'Importiert',
        points: legacy
      }];
    }
  } catch {
    // ignore legacy errors
  }

  return [];
}

export function saveProcesses(processes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(processes ?? []));
}

export const state = createModuleState({
  label: 'Zustand 1',
  tempC: '-10',
  rhPercent: '90',
  targetTempC: '21',
  targetRhPercent: '50',
  process: 'adiabatic',
  processes: loadProcesses(),
  activeProcessId: '',
  previewSuppressed: false
});
