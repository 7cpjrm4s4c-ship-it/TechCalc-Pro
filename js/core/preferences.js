const KEY = 'techcalc.preferences.v1';

const defaults = {
  mobileQuickAccess: ['heating-cooling', 'ventilation', 'pipe-sizing', 'unit-converter'],
};

export function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY)) || {};
    return { ...defaults, ...stored };
  } catch {
    return { ...defaults };
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(KEY, JSON.stringify({ ...loadPreferences(), ...prefs }));
}

export function setMobileQuickAccess(ids) {
  savePreferences({ mobileQuickAccess: unique(ids).slice(0, 4) });
}

function unique(ids) {
  return [...new Set(ids.filter(Boolean))];
}
