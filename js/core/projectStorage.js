import * as base from './projectStorageBase.js';
import { state as floodingVerificationState } from '../modules/flooding-verification/state.js';

export * from './projectStorageBase.js';

const SESSION_SNAPSHOT_KEY = 'techcalc-session-snapshot';

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function withFloodingModule(data = {}) {
  const project = clone(data);
  project.modules = project.modules || {};
  project.modules['flooding-verification'] = { state: floodingVerificationState.get() };
  return project;
}

export function collectProjectData() {
  return withFloodingModule(base.collectProjectData());
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

function buildTcprojProjectBlob(data = {}) {
  const project = clone(data);
  project.format = 'techcalc-project';
  project.container = 'tcproj-json';
  project.version = Math.max(3, Number(project.version || 1));
  project.assets = project.assets || {};
  const logoDataUrl = project.meta?.companyLogo || '';
  const logoName = project.meta?.companyLogoName || '';
  const logoMime = project.meta?.companyLogoMime || (logoDataUrl.match(/^data:([^;,]+)/)?.[1] || '');
  if (logoDataUrl) {
    project.assets.companyLogo = {
      name: logoName || 'company-logo',
      mime: logoMime || 'image/jpeg',
      dataUrl: logoDataUrl
    };
  }
  return new Blob([JSON.stringify(project, null, 2)], { type: 'application/vnd.techcalc.project+json' });
}

export async function downloadProjectFile() {
  const data = collectProjectData();
  const meta = data.meta || {};
  const baseName = [meta.projectNo, meta.project, meta.client].filter(Boolean).join('-') || 'techcalc-projekt';
  const safe = baseName.toLowerCase().replace(/[^a-z0-9äöüß_-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'techcalc-projekt';
  const fileName = `${safe}.tcproj`;
  const blob = buildTcprojProjectBlob(data);

  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'TechCalc Projektdatei',
          accept: { 'application/vnd.techcalc.project+json': ['.tcproj'], 'application/json': ['.json'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      document.dispatchEvent(new CustomEvent('techcalc-project-saved', { detail: { fileName: handle.name || fileName } }));
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  document.dispatchEvent(new CustomEvent('techcalc-project-saved', { detail: { fileName } }));
  return true;
}
