const STORAGE_KEY = 'techcalc-preferences';

const defaults = {
  mobileQuickAccess: ['heating-cooling', 'ventilation', 'pipe-sizing', 'unit-converter'],
};

function unique(ids) {
  return [...new Set((ids || []).filter(Boolean))];
}

function readStoredPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Einstellungen konnten nicht geladen werden.', error);
    return {};
  }
}

function writeStoredPreferences(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Einstellungen konnten nicht gespeichert werden.', error);
  }
}

let preferences = { ...defaults, ...readStoredPreferences() };
preferences.mobileQuickAccess = unique(preferences.mobileQuickAccess).slice(0, 4);

export function loadPreferences() {
  return { ...preferences, mobileQuickAccess: [...preferences.mobileQuickAccess] };
}

export function savePreferences(prefs) {
  preferences = { ...preferences, ...prefs };
  preferences.mobileQuickAccess = unique(preferences.mobileQuickAccess).slice(0, 4);
  writeStoredPreferences(preferences);
}

export function setMobileQuickAccess(ids) {
  savePreferences({ mobileQuickAccess: unique(ids).slice(0, 4) });
}
