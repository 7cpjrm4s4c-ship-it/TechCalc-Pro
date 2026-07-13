import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { areaTypes } from '../rainwater/tables.js';
import { readRainwaterSurfaceSnapshot } from '../../shared/rainwaterSurfaceSnapshot.js';
import { deleteCollectionItem, patchCollectionItem } from '../../platform/collectionModel/index.js';
import { verificationSnapshot, hydrateVerification } from './savedRecords.js';

const typeById = new Map(areaTypes.map(item => [item.id, item]));
const numericFields = [
  'surfaceArea', 'surfaceCs', 'surfaceCm', 'meanSlopePercent',
  'rainR2Duration5', 'rainR2Duration10', 'rainR2Duration15',
  'rainR30Duration5', 'rainR30Duration10', 'rainR30Duration15',
  'rainR100Duration5', 'pipeSlopePercent', 'manualFullFlowLs', 'authorityLimitLs'
];
const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const number = value => Number(String(value ?? '').replace(',', '.'));
const normalized = value => canonicalGermanNumberInput(value);
const ADD_DEBOUNCE_MS = 600;
let lastSurfaceAdd = { fingerprint: '', at: 0 };

function defaultsForType(typeId) {
  const type = typeById.get(typeId) || typeById.get('custom') || {};
  return { surfaceCs: String(type.cs ?? '').replace('.', ','), surfaceCm: String(type.cm ?? '').replace('.', ',') };
}

export function surfaceDraftFingerprint(current = {}) {
  return [current.activeSurfaceId || '', current.surfaceCategory || 'roof', String(current.surfaceName || '').trim(), current.surfaceAreaType || 'custom', normalized(current.surfaceArea), normalized(current.surfaceCs), normalized(current.surfaceCm)].join('|');
}

export function shouldAcceptSurfaceAdd(current = {}, now = Date.now()) {
  const fingerprint = surfaceDraftFingerprint(current);
  if (fingerprint === lastSurfaceAdd.fingerprint && now - lastSurfaceAdd.at < ADD_DEBOUNCE_MS) return false;
  lastSurfaceAdd = { fingerprint, at: now };
  return true;
}

function surfaceRecordFromDraft(current = {}, recordId = null, existing = null) {
  const type = typeById.get(current.surfaceAreaType) || {};
  return {
    ...(existing || {}),
    id: recordId || id('flood-surface'),
    name: String(current.surfaceName || '').trim() || existing?.name || `Fläche ${(current.surfaces || []).length + 1}`,
    category: current.surfaceCategory === 'property' ? 'property' : 'roof',
    areaType: current.surfaceAreaType || 'custom',
    area: normalized(current.surfaceArea),
    cs: normalized(current.surfaceCs),
    cm: normalized(current.surfaceCm),
    sourceModule: existing?.sourceModule || 'flooding-verification',
    sourceId: existing?.sourceId || null,
    origin: existing?.origin || 'manual',
    coefficientSource: existing?.coefficientSource || (type.custom ? 'manual' : 'preset'),
    modifiedAfterImport: existing?.sourceModule === 'rainwater' ? true : Boolean(existing?.modifiedAfterImport),
    isSealed: typeof existing?.isSealed === 'boolean' ? existing.isSealed : Boolean(type.isSealed)
  };
}

function saveSurface({ current = {} } = {}) {
  const area = number(current.surfaceArea);
  const cs = number(current.surfaceCs);
  const cm = number(current.surfaceCm);
  if (!(area > 0) || !(cs >= 0 && cs <= 1) || !(cm >= 0 && cm <= 1)) return { importStatus: 'Fläche muss größer 0 m² sein; Cₛ und Cₘ müssen zwischen 0 und 1 liegen.' };
  if (!shouldAcceptSurfaceAdd(current)) return {};
  const existing = (current.surfaces || []).find(item => String(item.id) === String(current.activeSurfaceId));
  const record = surfaceRecordFromDraft(current, existing?.id, existing);
  const surfaces = existing ? patchCollectionItem(current.surfaces || [], existing.id, record) : [...(current.surfaces || []), record];
  return { surfaces, surfaceName: '', activeSurfaceId: null, importStatus: `${record.name} wurde ${existing ? 'aktualisiert' : 'hinzugefügt'}.` };
}

function patchSurface({ id: itemId, field, value, current = {} } = {}) {
  const allowed = { quantity: 'area', area: 'area', name: 'name', category: 'category', areaType: 'areaType', cs: 'cs', cm: 'cm' };
  const target = allowed[field] || 'area';
  const patch = { [target]: ['area','cs','cm'].includes(target) ? normalized(value) : value };
  if (target === 'areaType') {
    const type = typeById.get(value) || {};
    patch.cs = String(type.cs ?? '').replace('.', ',');
    patch.cm = String(type.cm ?? '').replace('.', ',');
    patch.isSealed = Boolean(type.isSealed);
  }
  patch.modifiedAfterImport = true;
  return { surfaces: patchCollectionItem(current.surfaces || [], itemId, patch) };
}

function editSurface({ id: itemId, current = {} } = {}) {
  const item = (current.surfaces || []).find(entry => String(entry.id) === String(itemId));
  if (!item) return {};
  return {
    activeSurfaceId: item.id,
    surfaceCategory: item.category || 'roof',
    surfaceName: item.name || '',
    surfaceAreaType: item.areaType || 'custom',
    surfaceArea: item.area || '',
    surfaceCs: item.cs || '',
    surfaceCm: item.cm || '',
    importStatus: `${item.name || 'Fläche'} wird bearbeitet.`
  };
}

function deleteSurface({ id: itemId, current = {} } = {}) {
  return { surfaces: deleteCollectionItem(current.surfaces || [], itemId), activeSurfaceId: current.activeSurfaceId === itemId ? null : current.activeSurfaceId };
}

function importRainwater({ current = {} } = {}) {
  const incoming = readRainwaterSurfaceSnapshot().filter(item => number(item.area) > 0);
  if (!incoming.length) return { importStatus: 'Im Regenwassermodul sind keine gültigen Flächen vorhanden.' };
  const existingSourceIds = new Set((current.surfaces || []).map(item => item.sourceId).filter(Boolean));
  const imported = incoming.filter(item => !existingSourceIds.has(item.sourceId)).map(item => ({ ...item, id: id('rain-snapshot') }));
  const skipped = incoming.length - imported.length;
  return {
    surfaces: [...(current.surfaces || []), ...imported],
    importedRainwaterSnapshot: { importedAt: new Date().toISOString(), sourceIds: incoming.map(item => item.sourceId) },
    importStatus: `${imported.length} Fläche(n) importiert${skipped ? `, ${skipped} Duplikat(e) übersprungen` : ''}. Lokale Daten bleiben unabhängig.`
  };
}

const controller = {
  normalizeFields: numericFields,
  segments: { fields: {
    rainDurationMode: { action: 'platform:segment:rainDurationMode', patch: value => ({ rainDurationMode: value === 'manual' ? 'manual' : 'automatic', ...(value === 'automatic' ? { manualRainDurationReason: '' } : {}) }) },
    dischargeMode: { action: 'platform:segment:dischargeMode', patch: value => ({ dischargeMode: value }) },
    surfaceCategory: { action: 'platform:segment:surfaceCategory', patch: value => ({ surfaceCategory: value, surfaceAreaType: value === 'property' ? 'concrete-asphalt' : 'metal-roof', ...defaultsForType(value === 'property' ? 'concrete-asphalt' : 'metal-roof') }) }
  }},
  lookupHydration: { key: 'flooding:surface-type', fields: ['surfaceAreaType'], patch: (_field, current) => defaultsForType(current.surfaceAreaType) },
  collections: {
    surfaces: { add: saveSurface, patchInput: patchSurface, delete: deleteSurface, edit: editSurface },
    rainwaterImport: { add: importRainwater }
  },
  savedRecords: {
    enabled: true,
    listKey: 'savedVerifications',
    activeIdKey: 'activeVerificationId',
    expandedIdKey: 'expandedVerificationId',
    nameKey: 'savedVerificationName',
    recordPrefix: 'flooding-verification',
    snapshot: verificationSnapshot,
    hydrate: hydrateVerification,
    attrs: { loadAttr: 'data-line-select', toggleAttr: 'data-line-toggle', deleteAttr: 'data-line-delete' }
  }
};

export { editSurface, importRainwater, saveSurface };
export default controller;
