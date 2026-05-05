const KEY = 'techcalc.preferences.v1';
const defaults = { mobileQuickAccess: ['heating-cooling','ventilation','pipe-sizing','unit-converter'] };
export function loadPreferences(){ try { return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return defaults; } }
export function savePreferences(prefs){ localStorage.setItem(KEY, JSON.stringify({ ...loadPreferences(), ...prefs })); }
export function setMobileQuickAccess(ids){ savePreferences({ mobileQuickAccess: ids.slice(0,4) }); }
