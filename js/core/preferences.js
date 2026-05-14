const defaults = {
  mobileQuickAccess: ['heating-cooling', 'ventilation', 'pipe-sizing', 'unit-converter'],
};

let preferences = { ...defaults };

export function loadPreferences() {
  return { ...preferences };
}

export function savePreferences(prefs) {
  preferences = { ...preferences, ...prefs };
}

export function setMobileQuickAccess(ids) {
  savePreferences({ mobileQuickAccess: unique(ids).slice(0, 4) });
}

function unique(ids) {
  return [...new Set(ids.filter(Boolean))];
}
