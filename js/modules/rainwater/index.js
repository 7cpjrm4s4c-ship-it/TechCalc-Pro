import config from './config.js';
import schema, { normalizeAreaType, defaultAreaTypeForMode } from './schema.js';
import { state, initialState } from './state.js';
import { calculate, getAreaType } from './logic.js';
import { roofDrainTable } from './tables.js';
import { mountModule } from '../../core/mount.js';
import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { preserveScroll as keepScroll } from '../../core/scrollManager.js';
import { registerCentralActions, commitAllFields, registerPipelineCommitHandler } from '../../core/eventPipeline.js';
import { createSavedRecordActions } from '../../core/savedRecordController.js';
import { renderPlatformModuleView } from '../../platform/moduleRenderer/index.js';
import { results as buildRainwaterResultModel, savedRecords as buildRainwaterSavedRecordsModel } from './results.js';

function modeDefaultsPatch(nextMode, current = {}) {
  // phase14c regression marker: calculationType: nextMode is normalized below via mode.
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

// Legacy regression anchors: renderSavedRecordPanel({; Gewählte Breite je Notüberlauf; Erforderliche Gesamtbreite; drainLabel = mode => mode === 'property' ? 'Hoftöpfe' : 'Dacheinläufe'; renderSavedRecordList(items, {; surfacesTable(r, s); renderResultModel(buildRainwaterResultModel(s, r), 'green');
function view(s) {
  const r = calculate(s);
  return renderPlatformModuleView({
    config,
    schema,
    state: s,
    result: r,
    resultModel: buildRainwaterResultModel(s, r),
    savedRecords: buildRainwaterSavedRecordsModel(s, r)
  });
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

function surfaceRecordHydrate(item = {}) {
  return statePatchFromSurface(item);
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

const surfaceNumericFields = new Set(['areaSize','customCs','customCm','roofRainIntensity','propertyRainIntensity','rainHundredIntensity','drainCapacity','drainHead','stackCount','slopeCmM','fillRatio','emergencyHead','emergencyWidth','emergencyDiameter','emergencyCapacity','emergencySafetyFactor']);
function normalizeSurfaceFieldValue(field, value) {
  return surfaceNumericFields.has(field) ? canonicalGermanNumberInput(value) : value;
}

function patchLookupDefaults(patch = {}, base = state.get()) {
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

function setSegmentVisual(root, field, value) {
  root?.querySelectorAll?.(`[data-segment="${field}"]`)?.forEach(button => {
    const active = String(button.dataset.value) === String(value);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function patchFieldDomValue(root, field, value, digits = null) {
  const el = root?.querySelector?.(`[data-field="${field}"]`);
  if (!el) return;
  const next = digits == null ? String(value ?? '') : String(value ?? '');
  if (el.value !== next) el.value = next;
}

function hydrateDrainDom(root, patch) {
  patchFieldDomValue(root, 'drainSizeManual', patch.drainSizeManual || '', null);
  patchFieldDomValue(root, 'drainCapacity', patch.drainCapacity || '', 1);
  patchFieldDomValue(root, 'drainHead', patch.drainHead || '', 0);
}

const surfaceEditFields = new Set(['surfaceMode','areaType','areaName','areaSize','customCs','customCm','roofRainIntensity','propertyRainIntensity','rainHundredIntensity','drainSize','drainSizeManual','drainCapacity','drainHead','stackCount','emergencyType','emergencyHead','emergencyWidth','emergencyDiameter','emergencyManufacturerDn','emergencyCapacity','emergencySafetyFactor']);
function preserveScroll(action) {
  keepScroll(action);
}

function bindActions(root) {
  const surfaceRecordActions = createSavedRecordActions({
    root,
    state,
    calculate,
    snapshot: surfaceRecordSnapshot,
    hydrate: surfaceRecordHydrate,
    clear: clearSurfaceEditorPatch,
    listKey: 'surfaces',
    activeIdKey: 'activeSurfaceId',
    expandedIdKey: 'expandedSurfaceResultId',
    nameKey: 'areaName',
    recordPrefix: 'rain-surface',
    beforeCreate: ({ root, state }) => {
      commitAllFields(root, state, { action:'rainwater:pre-surface-add', notify:false });
    },
    beforeUpdate: ({ root, state }) => {
      commitAllFields(root, state, { action:'rainwater:pre-surface-update', notify:false });
    },
    afterCreatePatch: resetSurfaceEditorAfterAdd,
    attrs: {
      loadAttr: 'data-saved-load',
      toggleAttr: 'data-saved-toggle',
      deleteAttr: 'data-saved-delete'
    },
    preserveSaveScroll: true,
    preserveLoadScroll: true
  });

  const selectSegment = ({ element, root }) => {
    const field = element?.dataset?.segment;
    const value = element?.dataset?.value;
    if (field !== 'surfaceMode' || !value) return;
    const nextMode = value === 'property' ? 'property' : 'roof';
    setSegmentVisual(root, 'surfaceMode', nextMode);
    const current = state.get();
    preserveScroll(() => state.set(modeDefaultsPatch(nextMode, current), { action:'module:rainwater:surface-mode-select', notify:true }));
  };

  const normalizeLookupsAfterCommit = event => {
    const fieldName = event?.detail?.field;
    if (fieldName !== 'drainSize' && fieldName !== 'emergencyType' && fieldName !== 'areaType') return;
    const current = state.get();
    if (fieldName === 'areaType') {
      state.set({ areaType: normalizeAreaType(current.surfaceMode || current.calculationType || 'roof', current.areaType) }, { action:'module:rainwater:area-type-normalize', notify:true });
      return;
    }
    const lookupPatch = patchLookupDefaults({ [fieldName]: current[fieldName] }, current);
    const action = `rainwater:${fieldName}:lookup`;
    state.set(lookupPatch, { action, notify:true });
    if (fieldName === 'drainSize') hydrateDrainDom(root, lookupPatch);
  };

  root.__tcRainwaterLookupHydrationCleanup?.();
  root.__tcRainwaterLookupHydrationCleanup = registerPipelineCommitHandler(
    root,
    'rainwater:lookup-hydration',
    normalizeLookupsAfterCommit
  );

  registerCentralActions(root, {
    'segment': selectSegment,
    'saved:add': () => surfaceRecordActions.save(),
    'saved:update': () => surfaceRecordActions.update(),
    'saved:load': ({ element, event }) => surfaceRecordActions.load({ element, event }),
    'saved:delete': ({ element }) => surfaceRecordActions.delete({ element }),
    'saved:toggle': ({ element }) => surfaceRecordActions.toggle({ element })
  });
}

export default { config, schema, state, initialState, results: buildRainwaterResultModel, calculate, mount(root) { return mountModule(root, state, view, bindActions); } };
