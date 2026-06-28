import { state as heatingCoolingState } from '../modules/heating-cooling/state.js';
import { readLineSections, writeLineSections } from '../modules/heating-cooling/index.js';
import { state as ventilationState } from '../modules/ventilation/state.js';
import { ventilationLineSectionController } from '../modules/ventilation/controller.js';
import { state as pipeSizingState } from '../modules/pipe-sizing/state.js';
import { state as unitConverterState } from '../modules/unit-converter/state.js';
import { state as heatRecoveryState } from '../modules/heat-recovery/state.js';
import { rltDeviceController } from '../modules/heat-recovery/controller.js';
import { state as hxDiagramState } from '../modules/hx-diagram/state.js';
import { state as drinkingWaterState } from '../modules/drinking-water/state.js';
import { state as pressureHoldingState } from '../modules/pressure-holding/state.js';
import { state as bufferStorageState } from '../modules/buffer-storage/state.js';
import { state as wastewaterState } from '../modules/wastewater/state.js';
import { state as rainwaterState } from '../modules/rainwater/state.js';
import { readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from '../modules/drinking-water/logic.js';

const DEFAULT_META = {
  client: '',
  project: '',
  projectNo: '',
  engineer: '',
  companyLogo: '',
  companyLogoName: '',
  companyName: '',
  companyAddress: '',
  documentVersion: '',
  checkedBy: '',
  approvedBy: ''
};

const SESSION_SNAPSHOT_KEY = 'techcalc-session-snapshot';
const PDF_COMPANY_LOGO_STORAGE_KEY = 'techcalc-pdf-company-logo';
const PDF_COMPANY_LOGO_NAME_STORAGE_KEY = 'techcalc-pdf-company-logo-name';

let projectMeta = { ...DEFAULT_META };
let openedFileName = '';

function readPersistentPdfLogo() {
  try { return localStorage.getItem(PDF_COMPANY_LOGO_STORAGE_KEY) || ''; } catch { return ''; }
}

function readPersistentPdfLogoName() {
  try { return localStorage.getItem(PDF_COMPANY_LOGO_NAME_STORAGE_KEY) || ''; } catch { return ''; }
}

function persistPdfLogo(logo = '', name = '') {
  try {
    if (logo) localStorage.setItem(PDF_COMPANY_LOGO_STORAGE_KEY, logo);
    else localStorage.removeItem(PDF_COMPANY_LOGO_STORAGE_KEY);
    if (name) localStorage.setItem(PDF_COMPANY_LOGO_NAME_STORAGE_KEY, name);
    else if (!logo) localStorage.removeItem(PDF_COMPANY_LOGO_NAME_STORAGE_KEY);
  } catch (error) {
    console.warn('Firmenlogo konnte nicht dauerhaft gespeichert werden.', error);
  }
}

export function saveSessionSnapshot() {
  try {
    sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(collectProjectData()));
    return true;
  } catch (error) {
    console.warn('Session-Sicherung konnte nicht geschrieben werden.', error);
    return false;
  }
}

export function restoreSessionSnapshot(options = {}) {
  try {
    const raw = sessionStorage.getItem(SESSION_SNAPSHOT_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    applyProjectData(data, { fileName: options.fileName || openedFileName });
    return true;
  } catch (error) {
    console.warn('Session-Sicherung konnte nicht wiederhergestellt werden.', error);
    return false;
  }
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function getProjectMeta() {
  const fallbackLogo = projectMeta.companyLogo || readPersistentPdfLogo();
  const fallbackLogoName = projectMeta.companyLogoName || readPersistentPdfLogoName();
  return { ...DEFAULT_META, ...projectMeta, companyLogo: fallbackLogo, companyLogoName: fallbackLogoName };
}

export function setProjectMeta(next = {}) {
  const hasCompanyLogo = Object.prototype.hasOwnProperty.call(next, 'companyLogo');
  const hasCompanyLogoName = Object.prototype.hasOwnProperty.call(next, 'companyLogoName');
  const merged = { ...projectMeta, ...next };
  if (!hasCompanyLogo && projectMeta.companyLogo) merged.companyLogo = projectMeta.companyLogo;
  if (!hasCompanyLogoName && projectMeta.companyLogoName) merged.companyLogoName = projectMeta.companyLogoName;
  projectMeta = { ...DEFAULT_META, ...merged };
  if (hasCompanyLogo || hasCompanyLogoName) {
    persistPdfLogo(projectMeta.companyLogo || '', projectMeta.companyLogoName || '');
  }
  return getProjectMeta();
}

export function resetProjectMeta() {
  projectMeta = { ...DEFAULT_META };
  persistPdfLogo('', '');
  openedFileName = '';
}

export function getOpenedFileName() {
  return openedFileName;
}



function normalizeDrinkingWaterProjectModule(moduleData = {}) {
  const moduleState = moduleData?.state && typeof moduleData.state === 'object' ? moduleData.state : {};
  const usageUnits = Array.isArray(moduleData?.usageUnits)
    ? moduleData.usageUnits
    : (Array.isArray(moduleState.savedUsageUnits) ? moduleState.savedUsageUnits : []);
  const singleConsumers = Array.isArray(moduleData?.singleConsumers)
    ? moduleData.singleConsumers
    : (Array.isArray(moduleState.savedSingleConsumers) ? moduleState.savedSingleConsumers : []);
  const { usageUnits: legacyUsageUnits, singleConsumers: legacySingleConsumers, ...cleanState } = moduleState;
  return {
    state: { ...cleanState, savedUsageUnits: usageUnits, savedSingleConsumers: singleConsumers },
    usageUnits,
    singleConsumers
  };
}

function normalizeHeatRecoveryProjectModule(moduleData = {}) {
  const moduleState = moduleData?.state && typeof moduleData.state === 'object' ? moduleData.state : {};
  const saved = Array.isArray(moduleData?.rltDevices)
    ? moduleData.rltDevices
    : (Array.isArray(moduleState.savedRltDevices)
      ? moduleState.savedRltDevices
      : (Array.isArray(moduleState.rltDevices) ? moduleState.rltDevices : []));
  const { rltDevices, ...cleanState } = moduleState;
  return {
    state: { ...cleanState, savedRltDevices: saved },
    rltDevices: saved
  };
}

export function collectProjectData() {
  return {
    app: 'TechCalc Pro',
    format: 'techcalc-project',
    version: 1,
    savedAt: new Date().toISOString(),
    meta: getProjectMeta(),
    modules: {
      'pressure-holding': { state: pressureHoldingState.get() },
      'buffer-storage': { state: bufferStorageState.get() },
      'heating-cooling': {
        state: heatingCoolingState.get(),
        lineSections: readLineSections()
      },
      ventilation: { state: ventilationState.get(), lineSections: ventilationLineSectionController.read() },
      'pipe-sizing': { state: pipeSizingState.get() },
      'unit-converter': { state: unitConverterState.get() },
      'heat-recovery': { state: heatRecoveryState.get(), rltDevices: rltDeviceController.read() },
      'hx-diagram': { state: hxDiagramState.get() },
      'drinking-water': {
        state: drinkingWaterState.get(),
        usageUnits: readUsageUnits(),
        singleConsumers: readSingleConsumers()
      },
      wastewater: { state: wastewaterState.get() },
      rainwater: { state: rainwaterState.get() }
    }
  };
}

export function applyProjectData(data = {}, { fileName = '' } = {}) {
  const modules = data.modules || {};
  const incomingMeta = { ...DEFAULT_META, ...(data.meta || {}) };
  setProjectMeta(incomingMeta);
  if (incomingMeta.companyLogo) persistPdfLogo(incomingMeta.companyLogo, incomingMeta.companyLogoName || '');
  openedFileName = fileName || openedFileName;

  if (modules['pressure-holding']?.state) pressureHoldingState.replace(modules['pressure-holding'].state, { notify: false });
  if (modules['buffer-storage']?.state) bufferStorageState.replace(modules['buffer-storage'].state, { notify: false });
  if (modules['heating-cooling']?.state) heatingCoolingState.replace(modules['heating-cooling'].state, { notify: false });
  writeLineSections(modules['heating-cooling']?.lineSections || []);

  if (modules.ventilation?.state) ventilationState.replace(modules.ventilation.state, { notify: false });
  ventilationLineSectionController.write(modules.ventilation?.lineSections || []);
  if (modules['pipe-sizing']?.state) pipeSizingState.replace(modules['pipe-sizing'].state, { notify: false });
  if (modules['unit-converter']?.state) unitConverterState.replace(modules['unit-converter'].state, { notify: false });
  if (modules['heat-recovery']) {
    const heatRecoveryModule = normalizeHeatRecoveryProjectModule(modules['heat-recovery']);
    heatRecoveryState.replace(heatRecoveryModule.state, { notify: false });
    rltDeviceController.write(heatRecoveryModule.rltDevices);
  }
  if (modules['hx-diagram']?.state) hxDiagramState.replace(modules['hx-diagram'].state, { notify: false });
  if (modules['drinking-water']) {
    const drinkingWaterModule = normalizeDrinkingWaterProjectModule(modules['drinking-water']);
    drinkingWaterState.replace(drinkingWaterModule.state, { notify: false });
    writeUsageUnits(drinkingWaterModule.usageUnits);
    writeSingleConsumers(drinkingWaterModule.singleConsumers);
  }
  if (modules.wastewater?.state) wastewaterState.replace(modules.wastewater.state, { notify: false });
  if (modules.rainwater?.state) rainwaterState.replace(modules.rainwater.state, { notify: false });

  document.dispatchEvent(new CustomEvent('techcalc-project-loaded', { detail: { fileName: openedFileName } }));
}

export function resetAllSessionData() {
  resetProjectMeta();
  pressureHoldingState.reset();
  bufferStorageState.reset();
  heatingCoolingState.reset();
  writeLineSections([]);
  ventilationState.reset();
  ventilationLineSectionController.write([]);
  pipeSizingState.reset();
  unitConverterState.reset();
  heatRecoveryState.reset();
  rltDeviceController.write([]);
  hxDiagramState.reset();
  drinkingWaterState.reset();
  wastewaterState.reset();
  rainwaterState.reset();
  writeUsageUnits([]);
  writeSingleConsumers([]);
}

export async function downloadProjectFile() {
  const data = collectProjectData();
  const meta = data.meta || {};
  const base = [meta.projectNo, meta.project, meta.client].filter(Boolean).join('-') || 'techcalc-projekt';
  const safe = base.toLowerCase().replace(/[^a-z0-9äöüß_-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'techcalc-projekt';
  const fileName = `${safe}.techcalc.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });

  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'TechCalc Projektdatei',
          accept: { 'application/json': ['.techcalc.json', '.json'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      openedFileName = handle.name || fileName;
      document.dispatchEvent(new CustomEvent('techcalc-project-saved', { detail: { fileName: openedFileName } }));
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      console.warn('Dateiauswahl nicht verfügbar, Projekt wird als Download gespeichert.', error);
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
  return true;
}

export async function readProjectFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || parsed.format !== 'techcalc-project') {
    throw new Error('Die Datei ist kein gültiges TechCalc-Projekt.');
  }
  return clone(parsed);
}
