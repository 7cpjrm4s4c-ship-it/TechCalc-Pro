import * as base from './projectStorageBase.js';
import {
  appendProjectModuleStates,
  applyProjectModuleStates,
  resetProjectModuleStates
} from '../state/projectModuleStateAdapters.js';
import { downloadProjectFileFromData } from './projectDownload.js';
import {
  saveSessionSnapshot as saveProjectSessionSnapshot,
  restoreSessionSnapshot as restoreProjectSessionSnapshot
} from './projectSessionSnapshot.js';

export * from './projectStorageBase.js';

export function collectProjectData() {
  return appendProjectModuleStates(base.collectProjectData());
}

export function applyProjectData(data = {}, options = {}) {
  base.applyProjectData(data, options);
  applyProjectModuleStates(data);
}

export function resetAllSessionData() {
  base.resetAllSessionData();
  resetProjectModuleStates();
}
export function saveSessionSnapshot() {
  return saveProjectSessionSnapshot(collectProjectData);
}

export function restoreSessionSnapshot(options = {}) {
  return restoreProjectSessionSnapshot(applyProjectData, options);
}

export async function downloadProjectFile() {
  return downloadProjectFileFromData(collectProjectData);
}
