import { logger } from '../diagnostics/logger.js';
const STORAGE_KEY = 'techcalc-preferences';

const defaults = {
  mobileQuickAccess: ['heating-cooling', 'ventilation', 'pipe-sizing', 'unit-converter'],
  moduleOrder: [],
};

function unique(ids) {
  return [...new Set((Array.isArray(ids) ? ids : []).filter(id => typeof id === 'string' && id))];
}
function readStoredPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    logger.warn('Einstellungen konnten nicht geladen werden.', error, { module: 'preferences' });
    return {};
  }
}
function writeStoredPreferences(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    logger.warn('Einstellungen konnten nicht gespeichert werden.', error, { module: 'preferences' });
  }
}

let preferences = { ...defaults, ...readStoredPreferences() };
preferences.mobileQuickAccess = unique(preferences.mobileQuickAccess).slice(0, 4);
preferences.moduleOrder = unique(preferences.moduleOrder);

export function loadPreferences() {
  return { ...preferences, mobileQuickAccess: [...preferences.mobileQuickAccess], moduleOrder: [...preferences.moduleOrder] };
}
export function savePreferences(prefs) {
  preferences = { ...preferences, ...prefs };
  preferences.mobileQuickAccess = unique(preferences.mobileQuickAccess).slice(0, 4);
  preferences.moduleOrder = unique(preferences.moduleOrder);
  if (preferences.moduleOrder.length) preferences.mobileQuickAccess = preferences.moduleOrder.slice(0, 4);
  writeStoredPreferences(preferences);
}

export function setMobileQuickAccess(ids) {
  const first = unique(ids).slice(0, 4);
  const remaining = preferences.moduleOrder.filter(id => !first.includes(id));
  savePreferences({ moduleOrder: [...first, ...remaining], mobileQuickAccess: first });
}

export function setModuleOrder(ids) {
  savePreferences({ moduleOrder: unique(ids) });
}
