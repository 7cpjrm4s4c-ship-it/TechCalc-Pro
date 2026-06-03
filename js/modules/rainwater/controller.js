import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { getAreaType } from './logic.js';
import { roofDrainTable } from './tables.js';
import { normalizeAreaType, defaultAreaTypeForMode } from './schema.js';

const surfaceNumericFields = new Set([
  'areaSize','customCs','customCm','roofRainIntensity','propertyRainIntensity','rainHundredIntensity',
  'drainCapacity','drainHead','stackCount','slopeCmM','fillRatio','emergencyHead','emergencyWidth',
  'emergencyDiameter','emergencyCapacity','emergencySafetyFactor'
]);

function normalizeSurfaceFieldValue(field, value) {
  return surfaceNumericFields.has(field) ? canonicalGermanNumberInput(value) : value;
}

function patchLookupDefaults(patch = {}, base = {}) {
  const next = { ...patch };
  const drainSize = next.drainSize || base.drainSize;
  if (Object.prototype.hasOwnProperty.call(patch, 'drainSize')) {
    const preset = roofDrainTable.find(item => item.dn === drainSize) || roofDrainTable.find(item => item.dn === 'DN 100') || roofDrainTable[0];
    next.drainSizeManual = preset?.dn || drainSize || 'DN 100';
    next.drainCapacity = preset?.capacity != null ? String(preset.capacity).replace('.', ',') : '';
    next.drainHead = preset?.head != null ? String(preset.head) : '';
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'emergencyType')) {
    const type = next.emergencyType || base.emergencyType || 'rect';
    if (type === 'rect') {
      next.emergencyWidth = base.emergencyWidth || '300';
      next.emergencyDiameter = '';
      next.emergencyCapacity = '';
    } else if (type === 'round') {
      next.emergencyDiameter = base.emergencyDiameter || '100';
      next.emergencyWidth = '';
      next.emergencyCapacity = '';
    } else if (type === 'manual') {
      next.emergencyWidth = '';
      next.emergencyDiameter = '';
    }
  }
  return next;
}


function patchSurfaceModeDom({ root, state } = {}) {
  const mode = state?.surfaceMode || state?.calculationType || 'roof';
  const roof = mode !== 'property';
  const roofWrap = root?.querySelector?.('[data-schema-field-wrapper="roofRainIntensity"]');
  const propertyWrap = root?.querySelector?.('[data-schema-field-wrapper="propertyRainIntensity"]');
  const roofLabel = roofWrap?.querySelector?.('label');
  const propertyLabel = propertyWrap?.querySelector?.('label');
  if (roofLabel) roofLabel.textContent = roof ? 'Regenspende r(5,5)' : 'Regenspende r(5,2)';
  if (propertyLabel) propertyLabel.textContent = roof ? 'Regenspende r(5,5)' : 'Regenspende r(5,2)';
  if (roofWrap) roofWrap.hidden = !roof;
  if (propertyWrap) propertyWrap.hidden = roof;
}

function modeDefaultsPatch(nextMode, current = {}) {
  const mode = nextMode === 'property' ? 'property' : 'roof';
  const drainPatch = patchLookupDefaults({ drainSize: current.drainSize || 'DN 100' }, current);
  return {
    ...drainPatch,
    surfaceMode: mode,
    calculationType: mode,
    areaType: normalizeAreaType(mode, current.areaType),
    activeSurfaceId: null,
    expandedSurfaceResultId: null,
    roofRainIntensity: current.roofRainIntensity || current.rainIntensity || '300',
    propertyRainIntensity: current.propertyRainIntensity || current.rainIntensity || '300'
  };
}

function surfacePatchFromState(current = {}) {
  const mode = current.surfaceMode || current.calculationType || 'roof';
  return {
    surfaceMode: mode,
    areaType: normalizeAreaType(mode, current.areaType || defaultAreaTypeForMode(mode)),
    areaName: current.areaName,
    areaSize: normalizeSurfaceFieldValue('areaSize', current.areaSize),
    customCs: normalizeSurfaceFieldValue('customCs', current.customCs),
    customCm: normalizeSurfaceFieldValue('customCm', current.customCm),
    roofRainIntensity: normalizeSurfaceFieldValue('roofRainIntensity', current.roofRainIntensity),
    propertyRainIntensity: normalizeSurfaceFieldValue('propertyRainIntensity', current.propertyRainIntensity),
    rainHundredIntensity: normalizeSurfaceFieldValue('rainHundredIntensity', current.rainHundredIntensity),
    drainSize: current.drainSize,
    drainSizeManual: current.drainSizeManual,
    drainCapacity: normalizeSurfaceFieldValue('drainCapacity', current.drainCapacity),
    drainHead: normalizeSurfaceFieldValue('drainHead', current.drainHead),
    stackCount: normalizeSurfaceFieldValue('stackCount', current.stackCount),
    slopeCmM: normalizeSurfaceFieldValue('slopeCmM', current.slopeCmM),
    fillRatio: normalizeSurfaceFieldValue('fillRatio', current.fillRatio),
    emergencyType: current.emergencyType,
    emergencyHead: normalizeSurfaceFieldValue('emergencyHead', current.emergencyHead),
    emergencyWidth: normalizeSurfaceFieldValue('emergencyWidth', current.emergencyWidth),
    emergencyDiameter: normalizeSurfaceFieldValue('emergencyDiameter', current.emergencyDiameter),
    emergencyManufacturerDn: current.emergencyManufacturerDn,
    emergencyCapacity: normalizeSurfaceFieldValue('emergencyCapacity', current.emergencyCapacity),
    emergencySafetyFactor: normalizeSurfaceFieldValue('emergencySafetyFactor', current.emergencySafetyFactor)
  };
}

function surfaceRecordSnapshot(current = {}) {
  const patch = surfacePatchFromState(current);
  const base = getAreaType(patch.areaType || defaultAreaTypeForMode(patch.surfaceMode));
  return {
    ...patch,
    name: patch.areaName || base?.name || 'Regenfläche',
    customCs: base?.custom ? current.customCs : patch.customCs,
    customCm: base?.custom ? current.customCm : patch.customCm
  };
}

function statePatchFromSurface(item = {}) {
  const mode = item.surfaceMode || item.calculationType || 'roof';
  return {
    surfaceMode: mode,
    calculationType: mode,
    areaType: normalizeAreaType(mode, item.areaType || defaultAreaTypeForMode(mode)),
    areaName: item.areaName || '',
    areaSize: item.areaSize || '100',
    customCs: item.customCs || '',
    customCm: item.customCm || '',
    roofRainIntensity: item.roofRainIntensity,
    propertyRainIntensity: item.propertyRainIntensity,
    rainHundredIntensity: item.rainHundredIntensity,
    drainSize: item.drainSize,
    drainSizeManual: item.drainSizeManual,
    drainCapacity: item.drainCapacity,
    drainHead: item.drainHead,
    stackCount: item.stackCount,
    slopeCmM: item.slopeCmM,
    fillRatio: item.fillRatio,
    emergencyType: item.emergencyType,
    emergencyHead: item.emergencyHead,
    emergencyWidth: item.emergencyWidth,
    emergencyDiameter: item.emergencyDiameter,
    emergencyManufacturerDn: item.emergencyManufacturerDn,
    emergencyCapacity: item.emergencyCapacity,
    emergencySafetyFactor: item.emergencySafetyFactor
  };
}

function clearSurfaceEditorPatch(current = {}) {
  const mode = current.surfaceMode || current.calculationType || 'roof';
  return {
    activeSurfaceId: null,
    surfaceMode: mode,
    calculationType: mode,
    areaType: normalizeAreaType(mode, defaultAreaTypeForMode(mode)),
    areaName: '',
    areaSize: '',
    customCs: '',
    customCm: '',
    drainSize: 'DN 100',
    drainSizeManual: '',
    drainCapacity: '',
    drainHead: '',
    stackCount: '',
    emergencyType: 'rect',
    emergencyHead: '',
    emergencyWidth: '',
    emergencyDiameter: '',
    emergencyManufacturerDn: '',
    emergencyCapacity: '',
    emergencySafetyFactor: ''
  };
}

function resetSurfaceEditorAfterAdd(current = {}) {
  return {
    ...clearSurfaceEditorPatch(current),
    roofRainIntensity: current.roofRainIntensity || current.rainIntensity || '300',
    propertyRainIntensity: current.propertyRainIntensity || current.rainIntensity || '300',
    rainIntensity: current.rainIntensity || '300',
    rainHundredIntensity: current.rainHundredIntensity || '500'
  };
}

function lookupPatch(fieldName, current = {}) {
  if (fieldName === 'areaType') {
    return { areaType: normalizeAreaType(current.surfaceMode || current.calculationType || 'roof', current.areaType) };
  }
  return patchLookupDefaults({ [fieldName]: current[fieldName] }, current);
}

export default {
  segments: {
    fields: {
      surfaceMode: {
        action: 'platform:segment:surfaceMode',
        patch: modeDefaultsPatch,
        domPatch: patchSurfaceModeDom
      }
    }
  },
  lookupHydration: {
    key: 'platform:lookup-hydration',
    fields: ['drainSize', 'emergencyType', 'areaType'],
    hydrateDomFields: { drainSize: ['drainSizeManual', 'drainCapacity', 'drainHead'] },
        patch: lookupPatch
  },
  normalizeFields: [...surfaceNumericFields],
  savedRecords: {
    enabled: true,
    snapshot: surfaceRecordSnapshot,
    hydrate: item => statePatchFromSurface(item),
    clear: clearSurfaceEditorPatch,
    listKey: 'surfaces',
    activeIdKey: 'activeSurfaceId',
    expandedIdKey: 'expandedSurfaceResultId',
    nameKey: 'areaName',
    recordPrefix: 'rain-surface',
        afterCreatePatch: resetSurfaceEditorAfterAdd,
    attrs: { loadAttr: 'data-line-select', toggleAttr: 'data-line-toggle', deleteAttr: 'data-line-delete' },
    preserveSaveScroll: true,
    preserveLoadScroll: true
  }
};

export { modeDefaultsPatch, patchSurfaceModeDom, surfaceRecordSnapshot, statePatchFromSurface, clearSurfaceEditorPatch, resetSurfaceEditorAfterAdd };
