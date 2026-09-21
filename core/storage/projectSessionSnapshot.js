const SESSION_SNAPSHOT_KEY = 'techcalc-session-snapshot';

export function saveSessionSnapshot(collectProjectData) {
  try {
    sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(collectProjectData()));
    return true;
  } catch {
    return false;
  }
}

export function restoreSessionSnapshot(applyProjectData, options = {}) {
  try {
    const raw = sessionStorage.getItem(SESSION_SNAPSHOT_KEY);
    if (!raw) return false;
    applyProjectData(JSON.parse(raw), options);
    return true;
  } catch {
    return false;
  }
}
