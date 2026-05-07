import { createModuleState } from '../../core/state.js';

const STORAGE_KEY = 'techcalc:hx-diagram:points';

function loadPoints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePoints(points) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points ?? []));
}

export const state = createModuleState({
  label: 'Zustand 1',
  tempC: '22',
  rhPercent: '50',
  volumeFlowM3h: '1000',
  points: loadPoints()
});
