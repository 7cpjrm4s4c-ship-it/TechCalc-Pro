import { createModuleState } from '../../core/state.js';

const STORAGE_KEY = 'techcalc:hx-diagram:points';

function loadPoints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(point => point && typeof point === 'object') : [];
  } catch {
    return [];
  }
}

export function savePoints(points) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(points ?? [])); } catch { /* localStorage may be unavailable in private mode */ }
}

export const state = createModuleState({
  label: 'Zustand 1',
  tempC: '-10',
  rhPercent: '90',
  targetTempC: '21',
  targetRhPercent: '50',
  process: 'adiabatic',
  points: loadPoints()
});
