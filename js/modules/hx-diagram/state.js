import { createModuleState } from '../../core/state.js';

const STORAGE_KEY = 'techcalc:hx-diagram:processes';
const LEGACY_POINTS_KEY = 'techcalc:hx-diagram:points';

function normalizeRh(value) {
  const n = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return '0';
  return String(Math.min(100, Math.max(0, Math.round(n * 100) / 100)));
}

function normalizeProcesses(processes) {
  return (Array.isArray(processes) ? processes : []).map(process => ({
    ...process,
    points: Array.isArray(process.points) ? process.points.map(point => ({ ...point, rhPercent: normalizeRh(point.rhPercent) })) : []
  }));
}

function loadProcesses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) return normalizeProcesses(parsed);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProcesses(processes ?? [])));
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
