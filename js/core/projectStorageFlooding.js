import * as base from './projectStorage.js';
import { state as floodingVerificationState } from '../modules/flooding-verification/state.js';

const SESSION_SNAPSHOT_KEY = 'techcalc-session-snapshot';

export function collectProjectData() {
  const data = base.collectProjectData();
  data.modules = data.modules || {};
  data.modules['flooding-verification'] = { state: floodingVerificationState.get() };
  return data;
}

export function applyProjectData(data = {}, options = {}) {
  base.applyProjectData(data, options);
  const incoming = data?.modules?.['flooding-verification']?.state;
  if (incoming) floodingVerificationState.replace(incoming, { notify: false });
}

export function resetAllSessionData() {
  base.resetAllSessionData();
  floodingVerificationState.reset();
}

export function saveSessionSnapshot() {
  try {
    sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(collectProjectData()));
    return true;
  } catch {
    return false;
  }
}

export function restoreSessionSnapshot(options = {}) {
  try {
    const raw = sessionStorage.getItem(SESSION_SNAPSHOT_KEY);
    if (!raw) return false;
    applyProjectData(JSON.parse(raw), options);
    return true;
  } catch {
    return false;
  }
}

export const downloadProjectFile = base.downloadProjectFile;
export const readProjectFile = base.readProjectFile;
export const PROJECT_FILE_EXTENSIONS = base.PROJECT_FILE_EXTENSIONS;
export const getProjectMeta = base.getProjectMeta;
export const setProjectMeta = base.setProjectMeta;
export const resetProjectMeta = base.resetProjectMeta;
export const getOpenedFileName = base.getOpenedFileName;
