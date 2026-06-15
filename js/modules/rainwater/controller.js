import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { getAreaType } from './logic.js';
import { roofDrainTable } from './tables.js';
import { normalizeAreaType, defaultAreaTypeForMode } from './schema.js';
import { createStateSnapshot, hydrateStateRecord } from '../../platform/savedRecordModel/index.js';
import { state } from './state.js';
import { calculate } from './logic.js';

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

export function surfaceRecordSnapshot(current = {}, result = {}) {
  const patch = surfacePatchFromState(current);
  const base = getAreaType(patch.areaType || defaultAreaTypeForMode(patch.surfaceMode));
  const name = (patch.areaName || '').trim() || base?.name || 'Regenfläche';
  return createStateSnapshot({
    current: {
      ...current,
      ...patch,
      areaName: name,
      customCs: base?.custom ? current.customCs : patch.customCs,
      customCm: base?.custom ? current.customCm : patch.customCm
    },
    calculationResult: result,
    excludeKeys: ['surfaces', 'activeSurfaceId', 'expandedSurfaceResultId'],
    name: () => name,
    resultMapper: output => ({
      mode: output?.selectedSurface?.surfaceMode || output?.mode || patch.surfaceMode,
      area: output?.area,
      areaType: patch.areaType,
      areaTypeLabel: base?.name,
      cs: output?.csResulting,
      cm: output?.cmResulting,
      qr: output?.qr,
      rdt: output?.rdt,
      r100: output?.r100,
      qNot: output?.qNot,
      requiredDrains: output?.requiredDrains,
      drainSize: output?.drainSize,
      drainCapacity: output?.drainCapacity,
      drainHead: output?.drainHead,
      stackCount: output?.stackCount,
      qPerStack: output?.qPerStack,
      stackDn: output?.stackSelection?.dn,
      collectorDn: output?.collectorSelection?.dn
    })
  });
}

export function statePatchFromSurface(item = {}, current = {}) {
  const source = item.state || item.inputState || item;
  const hydrated = item.state || item.inputState
    ? hydrateStateRecord(item, { activeIdKey: 'activeSurfaceId', nameKey: 'areaName' })
    : { ...source, activeSurfaceId: item.id || source.id, areaName: source.areaName || item.name || source.name || '' };
  const mode = hydrated.surfaceMode || hydrated.calculationType || source.surfaceMode || source.calculationType || 'roof';
  return {
    ...hydrated,
    surfaceMode: mode,
    calculationType: mode,
    areaType: normalizeAreaType(mode, hydrated.areaType || source.areaType || defaultAreaTypeForMode(mode)),
    areaName: hydrated.areaName || item.name || source.areaName || '',
    areaSize: hydrated.areaSize || source.areaSize || '100',
    customCs: hydrated.customCs || source.customCs || '',
    customCm: hydrated.customCm || source.customCm || '',
    roofRainIntensity: hydrated.roofRainIntensity || source.roofRainIntensity || '300',
    propertyRainIntensity: hydrated.propertyRainIntensity || source.propertyRainIntensity || '300',
    rainHundredIntensity: hydrated.rainHundredIntensity || source.rainHundredIntensity || '500',
    drainSize: hydrated.drainSize || source.drainSize || 'DN 100',
    drainSizeManual: hydrated.drainSizeManual || source.drainSizeManual || '',
    drainCapacity: hydrated.drainCapacity || source.drainCapacity || '',
    drainHead: hydrated.drainHead || source.drainHead || '',
    stackCount: hydrated.stackCount || source.stackCount || '1',
    slopeCmM: hydrated.slopeCmM || source.slopeCmM || '1,0',
    fillRatio: hydrated.fillRatio || source.fillRatio || '0.7',
    emergencyType: hydrated.emergencyType || source.emergencyType || 'rect',
    emergencyHead: hydrated.emergencyHead || source.emergencyHead || '35',
    emergencyWidth: hydrated.emergencyWidth || source.emergencyWidth || '300',
    emergencyDiameter: hydrated.emergencyDiameter || source.emergencyDiameter || '',
    emergencyManufacturerDn: hydrated.emergencyManufacturerDn || source.emergencyManufacturerDn || '',
    emergencyCapacity: hydrated.emergencyCapacity || source.emergencyCapacity || '',
    emergencySafetyFactor: hydrated.emergencySafetyFactor || source.emergencySafetyFactor || '1,0',
    activeSurfaceId: item.id || hydrated.activeSurfaceId || source.id || null
  };
}

export function clearSurfaceEditorPatch(current = {}) {
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

export function resetSurfaceEditorAfterAdd(current = {}) {
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


export function rainwaterSavedStats(item = {}) {
  const result = item.result || {};
  return [
    { label: 'Bereich', value: result.mode || item.state?.surfaceMode || '—' },
    { label: 'Entwässerungsmenge Qr', value: result.qr !== undefined ? String(result.qr).replace('.', ',') : '—', unit: result.qr !== undefined ? 'l/s' : '' },
    { label: 'Abläufe', value: result.requiredDrains !== undefined ? result.requiredDrains : '—', unit: result.requiredDrains !== undefined ? 'Stk.' : '' },
    { label: 'Ablaufdimension', value: result.drainSize || '—' },
    { label: 'Fallleitung', value: result.stackDn || '—' },
    { label: 'Sammelleitung', value: result.collectorDn || '—' }
  ];
}

export function rainwaterSavedSubtitle(item = {}) {
  const result = item.result || {};
  return [result.mode || item.state?.surfaceMode, result.qr !== undefined ? `Qr ${String(result.qr).replace('.', ',')} l/s` : '', result.drainSize].filter(Boolean).join(' · ');
}

export function buildRainwaterRecord(currentState = {}, result = {}, items = [], id, name, existing = null) {
  const record = surfaceRecordSnapshot({ ...currentState, activeSurfaceId: null, areaName: name }, result);
  return {
    ...record,
    id,
    name: name || currentState.areaName?.trim() || existing?.name || record.name || `Regenfläche ${items.length + 1}`,
    createdAt: existing?.createdAt || record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}



export function isDynamicRainwaterAction(meta = {}) {
  const action = String(meta.action || '');
  return action !== 'initial';
}

export default {
  segments: {
    fields: {
      surfaceMode: {
        action: 'platform:segment:surfaceMode',
        patch: modeDefaultsPatch
      }
    }
  },
  lookupHydration: {
    key: 'platform:lookup-hydration',
    fields: ['drainSize', 'emergencyType', 'areaType'],
    hydrateDomFields: { drainSize: ['drainSizeManual', 'drainCapacity', 'drainHead'] },
        patch: lookupPatch
  },
  normalizeFields: [...surfaceNumericFields]
};

export { modeDefaultsPatch };
