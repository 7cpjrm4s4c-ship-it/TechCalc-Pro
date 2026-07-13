import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { areaTypes } from '../rainwater/tables.js';
import { readRainwaterSurfaceSnapshot } from '../../shared/rainwaterSurfaceSnapshot.js';
import { deleteCollectionItem, patchCollectionItem } from '../../platform/collectionModel/index.js';

const typeById = new Map(areaTypes.map(item => [item.id, item]));
const numericFields = ['surfaceArea', 'surfaceCs', 'surfaceCm'];
const id = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const number = value => Number(String(value ?? '').replace(',', '.'));
const normalized = value => canonicalGermanNumberInput(value);

function defaultsForType(typeId) {
  const type = typeById.get(typeId) || typeById.get('custom') || {};
  return { surfaceCs: String(type.cs ?? '').replace('.', ','), surfaceCm: String(type.cm ?? '').replace('.', ',') };
}

function addSurface({ current = {} } = {}) {
  const area = number(current.surfaceArea);
  const cs = number(current.surfaceCs);
  const cm = number(current.surfaceCm);
  if (!(area > 0) || !(cs >= 0 && cs <= 1) || !(cm >= 0 && cm <= 1)) {
    return { importStatus: 'Fläche muss größer 0 m² sein; Cₛ und Cₘ müssen zwischen 0 und 1 liegen.' };
  }
  const record = {
    id: id('flood-surface'),
    name: String(current.surfaceName || '').trim() || `Fläche ${(current.surfaces || []).length + 1}`,
    category: current.surfaceCategory === 'property' ? 'property' : 'roof',
    areaType: current.surfaceAreaType || 'custom',
    area: normalized(current.surfaceArea),
    cs: normalized(current.surfaceCs),
    cm: normalized(current.surfaceCm),
    sourceModule: 'flooding-verification',
    sourceId: null
  };
  return {
    surfaces: [...(current.surfaces || []), record],
    surfaceName: '',
    activeSurfaceId: record.id,
    importStatus: `${record.name} wurde hinzugefügt.`
  };
}

function patchSurfaceArea({ id: itemId, value, current = {} } = {}) {
  const area = Math.max(0, number(value) || 0);
  return { surfaces: patchCollectionItem(current.surfaces || [], itemId, { area: normalized(area) }) };
}

function deleteSurface({ id: itemId, current = {} } = {}) {
  return { surfaces: deleteCollectionItem(current.surfaces || [], itemId), activeSurfaceId: current.activeSurfaceId === itemId ? null : current.activeSurfaceId };
}

function importRainwater({ current = {} } = {}) {
  const incoming = readRainwaterSurfaceSnapshot();
  if (!incoming.length) return { importStatus: 'Im Regenwassermodul sind keine gespeicherten Flächen vorhanden.' };
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
  segments: {
    fields: {
      calculationMode: { action: 'platform:segment:calculationMode', patch: value => ({ calculationMode: value }) },
      surfaceCategory: {
        action: 'platform:segment:surfaceCategory',
        patch: (value, current) => ({ surfaceCategory: value, surfaceAreaType: value === 'property' ? 'concrete-asphalt' : 'metal-roof', ...defaultsForType(value === 'property' ? 'concrete-asphalt' : 'metal-roof') })
      }
    }
  },
  lookupHydration: {
    key: 'flooding:surface-type',
    fields: ['surfaceAreaType'],
    patch: (_field, current) => defaultsForType(current.surfaceAreaType)
  },
  collections: {
    surfaces: { add: addSurface, patchInput: patchSurfaceArea, delete: deleteSurface },
    rainwaterImport: { add: importRainwater }
  }
};

export default controller;
