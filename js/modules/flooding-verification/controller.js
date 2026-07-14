import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { registerCentralActions, commitAllFields, registerPipelineCommitHandler } from '../../core/eventPipeline.js';
import { createRecordId } from '../../core/savedRecords.js';
import { areaTypes } from '../../shared/rainwaterDomainTables.js';
import { readRainwaterSurfaceSnapshot } from '../../shared/rainwaterSurfaceSnapshot.js';

const typeById = new Map(areaTypes.map(item => [item.id, item]));
const numericFields = [
  'surfaceArea', 'surfaceCs', 'surfaceCm', 'meanSlopePercent',
  'rainR2Duration5', 'rainR2Duration10', 'rainR2Duration15',
  'rainR30Duration5', 'rainR30Duration10', 'rainR30Duration15',
  'rainR100Duration5', 'pipeSlopePercent', 'manualFullFlowLs', 'authorityLimitLs'
];
const number = value => Number(String(value ?? '').replace(',', '.'));
const normalized = value => canonicalGermanNumberInput(value);

function defaultsForType(typeId) {
  const type = typeById.get(typeId) || typeById.get('custom') || {};
  return { surfaceCs: String(type.cs ?? '').replace('.', ','), surfaceCm: String(type.cm ?? '').replace('.', ',') };
}

function validSurfaceDraft(current = {}) {
  const area = number(current.surfaceArea);
  const cs = number(current.surfaceCs);
  const cm = number(current.surfaceCm);
  return area > 0 && cs >= 0 && cs <= 1 && cm >= 0 && cm <= 1;
}

export function buildFloodingSurfaceRecord({ currentState = {}, id, name, existing = null } = {}) {
  if (!validSurfaceDraft(currentState)) return null;
  const type = typeById.get(currentState.surfaceAreaType) || {};
  return {
    ...(existing || {}),
    id: id || existing?.id || createRecordId('flood-surface'),
    name: String(name || currentState.surfaceName || existing?.name || '').trim() || `Fläche ${(currentState.surfaces || []).length + 1}`,
    category: currentState.surfaceCategory === 'property' ? 'property' : 'roof',
    areaType: currentState.surfaceAreaType || 'custom',
    area: normalized(currentState.surfaceArea),
    cs: normalized(currentState.surfaceCs),
    cm: normalized(currentState.surfaceCm),
    sourceModule: existing?.sourceModule || 'flooding-verification',
    sourceId: existing?.sourceId || null,
    origin: existing?.origin || 'manual',
    coefficientSource: existing?.coefficientSource || (type.custom ? 'manual' : 'preset'),
    modifiedAfterImport: existing?.sourceModule === 'rainwater' ? true : Boolean(existing?.modifiedAfterImport),
    isSealed: typeof existing?.isSealed === 'boolean' ? existing.isSealed : Boolean(type.isSealed)
  };
}

export function hydrateFloodingSurfaceRecord({ item = {} } = {}) {
  return {
    activeSurfaceId: item.id || null,
    surfaceName: item.name || '',
    surfaceCategory: item.category || 'roof',
    surfaceAreaType: item.areaType || 'custom',
    surfaceArea: item.area || '',
    surfaceCs: item.cs || '',
    surfaceCm: item.cm || '',
    importStatus: `${item.name || 'Fläche'} wird bearbeitet.`
  };
}

export function floodingSurfaceSubtitle(item = {}) {
  const category = item.category === 'property' ? 'Grundstücksfläche' : 'Dachfläche';
  const type = typeById.get(item.areaType)?.name || 'Freie Fläche';
  return `${category} · ${type}`;
}

export function floodingSurfaceStats(item = {}) {
  return [
    { label: 'Fläche', value: String(item.area || '0').replace('.', ','), unit: 'm²' },
    { label: 'Cₛ', value: String(item.cs ?? '').replace('.', ',') },
    { label: 'Cₘ', value: String(item.cm ?? '').replace('.', ',') }
  ];
}

export function importRainwater({ current = {} } = {}) {
  const incoming = readRainwaterSurfaceSnapshot().filter(item => item.category === 'roof' && number(item.area) > 0);
  if (!incoming.length) return { importStatus: 'Im Regenwassermodul sind keine gültigen Dachflächen vorhanden.' };
  const existingSourceIds = new Set((current.surfaces || []).map(item => item.sourceId).filter(Boolean));
  const usedIds = new Set((current.surfaces || []).map(item => String(item.id)));
  const imported = incoming.filter(item => !existingSourceIds.has(item.sourceId)).map(item => {
    let id = createRecordId('rain-snapshot');
    while (usedIds.has(String(id))) id = createRecordId('rain-snapshot');
    usedIds.add(String(id));
    return { ...item, id };
  });
  const skipped = incoming.length - imported.length;
  if (!imported.length) return { importStatus: skipped ? 'Alle Dachflächen wurden bereits importiert.' : 'Keine neuen Dachflächen vorhanden.' };
  return {
    surfaces: [...imported, ...(current.surfaces || [])],
    importedRainwaterSnapshot: { importedAt: new Date().toISOString(), sourceIds: incoming.map(item => item.sourceId) },
    importStatus: `${imported.length} Dachfläche(n) importiert${skipped ? `, ${skipped} Duplikat(e) übersprungen` : ''}.`
  };
}

export function bindFloodingController(root, state, lineSectionController) {
  lineSectionController?.bind?.(root);
  const segmentHandler = field => ({ element } = {}) => {
    const value = element?.dataset?.value;
    if (value === undefined) return;
    let patch = { [field]: value };
    if (field === 'surfaceCategory') {
      const category = value === 'property' ? 'property' : 'roof';
      const typeId = category === 'property' ? 'concrete-asphalt' : 'metal-roof';
      patch = { surfaceCategory: category, surfaceAreaType: typeId, ...defaultsForType(typeId) };
    } else if (field === 'rainDurationMode') {
      patch = { rainDurationMode: value === 'manual' ? 'manual' : 'automatic', ...(value === 'automatic' ? { manualRainDurationReason: '' } : {}) };
    }
    state.set(patch, { action: `platform:segment:${field}`, notify: true });
  };
  registerCentralActions(root, {
    'platform:segment:surfaceCategory': segmentHandler('surfaceCategory'),
    'platform:segment:rainDurationMode': segmentHandler('rainDurationMode'),
    'platform:segment:dischargeMode': segmentHandler('dischargeMode'),
    'flooding:import-roofs': ({ root: actionRoot } = {}) => {
      commitAllFields(actionRoot || root, state, { action: 'flooding:import-roofs:precommit', notify: false });
      const patch = importRainwater({ current: state.get() });
      if (Object.keys(patch).length) state.set(patch, { action: 'flooding:import-roofs', notify: true });
    }
  });
  root.__tcFloodingLookupCleanup?.();
  root.__tcFloodingLookupCleanup = registerPipelineCommitHandler(root, 'flooding:surface-type', event => {
    if (event?.detail?.field !== 'surfaceAreaType') return;
    const patch = defaultsForType(state.get().surfaceAreaType);
    state.set(patch, { action: 'flooding:surface-type', notify: true });
  });
}

const controller = { normalizeFields: numericFields };
export default controller;
