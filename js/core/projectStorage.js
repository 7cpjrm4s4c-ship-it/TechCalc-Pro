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
  companyLogoMime: '',
  companyLogoAsset: '',
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

function crc32(bytes) {
  if (!window.__techCalcCrcTable) {
    window.__techCalcCrcTable = Array.from({ length: 256 }, (_, index) => {
      let crc = index;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
      return crc >>> 0;
    });
  }
  let crc = 0xFFFFFFFF;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = window.__techCalcCrcTable[(crc ^ bytes[index]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function encodeUtf8(text = '') {
  return new TextEncoder().encode(String(text));
}

function decodeUtf8(bytes) {
  return new TextDecoder('utf-8').decode(bytes);
}

function writeU16(target, offset, value) {
  target[offset] = value & 0xFF;
  target[offset + 1] = (value >>> 8) & 0xFF;
}

function writeU32(target, offset, value) {
  target[offset] = value & 0xFF;
  target[offset + 1] = (value >>> 8) & 0xFF;
  target[offset + 2] = (value >>> 16) & 0xFF;
  target[offset + 3] = (value >>> 24) & 0xFF;
}

function readU16(view, offset) {
  return view.getUint16(offset, true);
}

function readU32(view, offset) {
  return view.getUint32(offset, true);
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach(part => { output.set(part, offset); offset += part.length; });
  return output;
}

function dataUrlToAsset(dataUrl = '', fallbackName = 'company-logo') {
  const match = String(dataUrl).match(/^data:([^;,]+)(;base64)?,(.*)$/);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const encoded = match[3] || '';
  let bytes;
  if (match[2]) {
    const binary = atob(encoded);
    bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  } else {
    bytes = encodeUtf8(decodeURIComponent(encoded));
  }
  const extension = mime.includes('svg') ? 'svg' : mime.includes('webp') ? 'webp' : mime.includes('png') ? 'png' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'bin';
  const safeName = String(fallbackName || `company-logo.${extension}`).replace(/[^a-z0-9äöüß._-]+/gi, '-').replace(/^-|-$/g, '') || `company-logo.${extension}`;
  const name = /\.[a-z0-9]+$/i.test(safeName) ? safeName : `${safeName}.${extension}`;
  return { name, mime, bytes };
}

function bytesToDataUrl(bytes, mime = 'application/octet-stream') {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function createTcpArchive(files = {}) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encodeUtf8(name);
    const data = content instanceof Uint8Array ? content : encodeUtf8(content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    writeU32(local, 0, 0x04034B50);
    writeU16(local, 4, 20);
    writeU16(local, 6, 0x0800);
    writeU16(local, 8, 0);
    writeU16(local, 10, 0);
    writeU16(local, 12, 0);
    writeU32(local, 14, crc);
    writeU32(local, 18, data.length);
    writeU32(local, 22, data.length);
    writeU16(local, 26, nameBytes.length);
    writeU16(local, 28, 0);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    writeU32(central, 0, 0x02014B50);
    writeU16(central, 4, 20);
    writeU16(central, 6, 20);
    writeU16(central, 8, 0x0800);
    writeU16(central, 10, 0);
    writeU16(central, 12, 0);
    writeU16(central, 14, 0);
    writeU32(central, 16, crc);
    writeU32(central, 20, data.length);
    writeU32(central, 24, data.length);
    writeU16(central, 28, nameBytes.length);
    writeU16(central, 30, 0);
    writeU16(central, 32, 0);
    writeU16(central, 34, 0);
    writeU16(central, 36, 0);
    writeU32(central, 38, 0);
    writeU32(central, 42, offset);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length + data.length;
  });

  const centralStart = offset;
  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeU32(end, 0, 0x06054B50);
  writeU16(end, 4, 0);
  writeU16(end, 6, 0);
  writeU16(end, 8, centralParts.length);
  writeU16(end, 10, centralParts.length);
  writeU32(end, 12, centralDirectory.length);
  writeU32(end, 16, centralStart);
  writeU16(end, 20, 0);

  return new Blob([...localParts, centralDirectory, end], { type: 'application/vnd.techcalc.project' });
}

async function readTcpArchive(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = {};
  let offset = 0;

  while (offset + 30 <= bytes.length && readU32(view, offset) === 0x04034B50) {
    const flags = readU16(view, offset + 6);
    const method = readU16(view, offset + 8);
    if (method !== 0) throw new Error('Dieses TechCalc-Projekt verwendet eine nicht unterstützte ZIP-Kompression.');
    if (flags & 0x0008) throw new Error('Dieses TechCalc-Projekt verwendet ein nicht unterstütztes ZIP-Datenformat.');
    const compressedSize = readU32(view, offset + 18);
    const fileNameLength = readU16(view, offset + 26);
    const extraLength = readU16(view, offset + 28);
    const nameStart = offset + 30;
    const name = decodeUtf8(bytes.subarray(nameStart, nameStart + fileNameLength));
    const dataStart = nameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    files[name] = bytes.subarray(dataStart, dataEnd);
    offset = dataEnd;
  }

  const projectJsonPath = files['project.json'] ? 'project.json' : Object.keys(files).find(name => /(^|\/)project\.json$/i.test(name));
  if (!projectJsonPath) throw new Error('Die TCP-Projektdatei enthält keine project.json.');
  const project = JSON.parse(decodeUtf8(files[projectJsonPath]));
  const meta = project.meta || {};
  const assetPath = meta.companyLogoAsset || '';
  if (assetPath && files[assetPath]) {
    meta.companyLogo = bytesToDataUrl(files[assetPath], meta.companyLogoMime || 'application/octet-stream');
  }
  project.meta = meta;
  return project;
}

function buildTcpProjectBlob(data = {}) {
  const project = clone(data);
  project.format = 'techcalc-project';
  project.container = 'tcp-zip';
  project.version = Math.max(2, Number(project.version || 1));
  project.assets = project.assets || {};
  const files = {};
  const logo = dataUrlToAsset(project.meta?.companyLogo || '', project.meta?.companyLogoName || 'company-logo');
  if (logo) {
    const path = `assets/${logo.name}`;
    files[path] = logo.bytes;
    project.meta.companyLogo = '';
    project.meta.companyLogoAsset = path;
    project.meta.companyLogoMime = logo.mime;
    project.meta.companyLogoName = project.meta.companyLogoName || logo.name;
    project.assets.companyLogo = { path, name: project.meta.companyLogoName, mime: logo.mime, size: logo.bytes.length };
  }
  files['project.json'] = JSON.stringify(project, null, 2);
  return createTcpArchive(files);
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
  const fileName = `${safe}.tcp`;
  const blob = buildTcpProjectBlob(data);

  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'TechCalc Projektdatei',
          accept: { 'application/vnd.techcalc.project': ['.tcp'], 'application/json': ['.techcalc.json', '.json'] }
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
  openedFileName = fileName;
  document.dispatchEvent(new CustomEvent('techcalc-project-saved', { detail: { fileName: openedFileName } }));
  return true;
}

async function looksLikeZipArchive(file) {
  if (!file || typeof file.slice !== 'function') return false;
  try {
    const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    return signature[0] === 0x50 && signature[1] === 0x4B && signature[2] === 0x03 && signature[3] === 0x04;
  } catch {
    return false;
  }
}

export async function readProjectFile(file) {
  const name = file?.name || '';
  const isTcp = /\.tcp$/i.test(name);
  const isZipBackedProject = isTcp || await looksLikeZipArchive(file);
  if (isZipBackedProject) {
    const parsed = await readTcpArchive(file);
    if (!parsed || parsed.format !== 'techcalc-project') {
      throw new Error('Die Datei ist kein gültiges TechCalc-Projekt.');
    }
    return clone(parsed);
  }
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || parsed.format !== 'techcalc-project') {
    throw new Error('Die Datei ist kein gültiges TechCalc-Projekt.');
  }
  return clone(parsed);
}
