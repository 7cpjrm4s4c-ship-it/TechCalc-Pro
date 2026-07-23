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
  const resolvedIsSealed = typeof type.isSealed === 'boolean'
    ? type.isSealed
    : Boolean(existing?.isSealed ?? (currentState.surfaceCategory === 'roof'));
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
    isSealed: resolvedIsSealed
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

function importedSurfaceFromSnapshot(item, id) {
  const type = typeById.get(item.areaType) || {};
  return {
    ...item,
    id,
    sourceModule: 'rainwater',
    origin: 'imported',
    coefficientSource: 'imported',
    modifiedAfterImport: false,
    importedAt: new Date().toISOString(),
    isSealed: typeof type.isSealed === 'boolean' ? type.isSealed : Boolean(item.isSealed)
  };
}

export function importRainwater({ current = {} } = {}) {
  const incoming = readRainwaterSurfaceSnapshot().filter(item => number(item.area) > 0);
  if (!incoming.length) return { importStatus: 'Im Regenwassermodul sind keine gültigen Flächen vorhanden.' };

  const existing = Array.isArray(current.surfaces) ? current.surfaces : [];
  const bySourceId = new Map(existing.filter(item => item.sourceId).map(item => [String(item.sourceId), item]));
  const usedIds = new Set(existing.map(item => String(item.id)));
  const incomingSourceIds = new Set(incoming.map(item => String(item.sourceId)));
  let added = 0;
  let updated = 0;
  let conflicts = 0;

  const replacements = new Map();
  const additions = [];

  for (const item of incoming) {
    const sourceId = String(item.sourceId);
    const local = bySourceId.get(sourceId);
    if (!local) {
      let id = createRecordId('rain-snapshot');
      while (usedIds.has(String(id))) id = createRecordId('rain-snapshot');
      usedIds.add(String(id));
      additions.push(importedSurfaceFromSnapshot(item, id));
      added += 1;
      continue;
    }
    if (local.modifiedAfterImport) {
      conflicts += 1;
      continue;
    }
    replacements.set(String(local.id), importedSurfaceFromSnapshot(item, local.id));
    updated += 1;
  }

  const nextExisting = existing.map(item => replacements.get(String(item.id)) || item);
  const nextSurfaces = [...additions, ...nextExisting];
  const statusParts = [];
  if (added) statusParts.push(`${added} Fläche(n) ergänzt`);
  if (updated) statusParts.push(`${updated} Fläche(n) aktualisiert`);
  if (conflicts) statusParts.push(`${conflicts} lokal bearbeitete Fläche(n) nicht überschrieben`);
  if (!statusParts.length) statusParts.push('Alle Flächen sind bereits aktuell');

  return {
    surfaces: nextSurfaces,
    importedRainwaterSnapshot: {
      importedAt: new Date().toISOString(),
      sourceIds: [...incomingSourceIds]
    },
    importStatus: `${statusParts.join(', ')}.`
  };
}

export function bindFloodingController(root, state, lineSectionController) {
  lineSectionController?.bind?.(root);
  registerCentralActions(root, {
    'flooding:import-roofs': ({ root: actionRoot } = {}) => {
      commitAllFields(actionRoot || root, state, { action: 'flooding:import-roofs:precommit', notify: false });
      const patch = importRainwater({ current: state.get() });
      if (Object.keys(patch).length) state.set(patch, { action: 'flooding:import-roofs', notify: true });
    }
  });
  root.__tcFloodingLookupCleanup?.();
  root.__tcFloodingLookupCleanup = registerPipelineCommitHandler(root, 'flooding:governing-inputs', event => {
    const field = event?.detail?.field;
    if (field === 'surfaceAreaType') {
      const patch = defaultsForType(state.get().surfaceAreaType);
      state.set(patch, { action: 'flooding:surface-type', notify: true });
      return;
    }
    if (field === 'meanSlopePercent' && event?.detail?.notify === false) {
      state.set({}, { action: 'flooding:mean-slope:refresh', notify: true });
    }
  });
}

const controller = {
  normalizeFields: numericFields,
  segments: { fields: {
    rainDurationMode: { action: 'platform:segment:rainDurationMode', patch: value => ({ rainDurationMode: value === 'manual' ? 'manual' : 'automatic', ...(value === 'automatic' ? { manualRainDurationReason: '' } : {}) }) },
    dischargeMode: { action: 'platform:segment:dischargeMode', patch: value => ({ dischargeMode: value }) },
    surfaceCategory: { action: 'platform:segment:surfaceCategory', patch: value => ({ surfaceCategory: value, surfaceAreaType: value === 'property' ? 'concrete-asphalt' : 'metal-roof', ...defaultsForType(value === 'property' ? 'concrete-asphalt' : 'metal-roof') }) }
  }}
};

export default controller;