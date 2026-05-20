import { state as heatingCoolingState } from '../modules/heating-cooling/state.js';
import { readLineSections, writeLineSections } from '../modules/heating-cooling/index.js';
import { state as ventilationState } from '../modules/ventilation/state.js';
import { readVentilationLineSections, writeVentilationLineSections } from '../modules/ventilation/index.js';
import { state as pipeSizingState } from '../modules/pipe-sizing/state.js';
import { state as unitConverterState } from '../modules/unit-converter/state.js';
import { state as heatRecoveryState } from '../modules/heat-recovery/state.js';
import { readRltDevices, writeRltDevices } from '../modules/heat-recovery/index.js';
import { state as hxDiagramState } from '../modules/hx-diagram/state.js';
import { state as drinkingWaterState } from '../modules/drinking-water/state.js';
import { state as pressureHoldingState } from '../modules/pressure-holding/state.js';
import { state as bufferStorageState } from '../modules/buffer-storage/state.js';
import { readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from '../modules/drinking-water/logic.js';

const DEFAULT_META = {
  client: '',
  project: '',
  projectNo: '',
  engineer: ''
};

let projectMeta = { ...DEFAULT_META };
let openedFileName = '';

const SESSION_SNAPSHOT_KEY = 'techcalc-session-snapshot';

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
  return { ...projectMeta };
}

export function setProjectMeta(next = {}) {
  projectMeta = { ...projectMeta, ...next };
  return getProjectMeta();
}

export function resetProjectMeta() {
  projectMeta = { ...DEFAULT_META };
  openedFileName = '';
}

export function getOpenedFileName() {
  return openedFileName;
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
      ventilation: { state: ventilationState.get(), lineSections: readVentilationLineSections() },
      'pipe-sizing': { state: pipeSizingState.get() },
      'unit-converter': { state: unitConverterState.get() },
      'heat-recovery': { state: heatRecoveryState.get(), rltDevices: readRltDevices() },
      'hx-diagram': { state: hxDiagramState.get() },
      'drinking-water': {
        state: drinkingWaterState.get(),
        usageUnits: readUsageUnits(),
        singleConsumers: readSingleConsumers()
      }
    }
  };
}

export function applyProjectData(data = {}, { fileName = '' } = {}) {
  const modules = data.modules || {};
  setProjectMeta(data.meta || {});
  openedFileName = fileName || openedFileName;

  if (modules['pressure-holding']?.state) pressureHoldingState.replace(modules['pressure-holding'].state, { notify: false });
  if (modules['buffer-storage']?.state) bufferStorageState.replace(modules['buffer-storage'].state, { notify: false });
  if (modules['heating-cooling']?.state) heatingCoolingState.replace(modules['heating-cooling'].state, { notify: false });
  writeLineSections(modules['heating-cooling']?.lineSections || []);

  if (modules.ventilation?.state) ventilationState.replace(modules.ventilation.state, { notify: false });
  writeVentilationLineSections(modules.ventilation?.lineSections || []);
  if (modules['pipe-sizing']?.state) pipeSizingState.replace(modules['pipe-sizing'].state, { notify: false });
  if (modules['unit-converter']?.state) unitConverterState.replace(modules['unit-converter'].state, { notify: false });
  if (modules['heat-recovery']?.state) heatRecoveryState.replace(modules['heat-recovery'].state, { notify: false });
  writeRltDevices(modules['heat-recovery']?.rltDevices || []);
  if (modules['hx-diagram']?.state) hxDiagramState.replace(modules['hx-diagram'].state, { notify: false });
  if (modules['drinking-water']?.state) drinkingWaterState.replace(modules['drinking-water'].state, { notify: false });
  writeUsageUnits(modules['drinking-water']?.usageUnits || []);
  writeSingleConsumers(modules['drinking-water']?.singleConsumers || []);

  document.dispatchEvent(new CustomEvent('techcalc-project-loaded', { detail: { fileName: openedFileName } }));
}

export function resetAllSessionData() {
  resetProjectMeta();
  pressureHoldingState.reset();
  bufferStorageState.reset();
  heatingCoolingState.reset();
  writeLineSections([]);
  ventilationState.reset();
  writeVentilationLineSections([]);
  pipeSizingState.reset();
  unitConverterState.reset();
  heatRecoveryState.reset();
  writeRltDevices([]);
  hxDiagramState.reset();
  drinkingWaterState.reset();
  writeUsageUnits([]);
  writeSingleConsumers([]);
}

export function downloadProjectFile() {
  const data = collectProjectData();
  const meta = data.meta || {};
  const base = [meta.projectNo, meta.project, meta.client].filter(Boolean).join('-') || 'techcalc-projekt';
  const safe = base.toLowerCase().replace(/[^a-z0-9äöüß_-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'techcalc-projekt';
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safe}.techcalc.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function readProjectFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || parsed.format !== 'techcalc-project') {
    throw new Error('Die Datei ist kein gültiges TechCalc-Projekt.');
  }
  return clone(parsed);
}
