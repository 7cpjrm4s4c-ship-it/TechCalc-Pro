import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { readFieldValue, normalizeQuantityInput } from '../../core/formActions.js';
import { getFixture, toNumber } from './logic.js';
import { initialState } from './state.js';
import { lineFamilyValue, lineVentilationValue, resolveLineType } from './lineModel.js';
import { deleteCollectionItem, patchCollectionItem, upsertCollectionRecord } from '../../platform/collectionModel/index.js';
import { createStateSnapshot, hydrateStateRecord } from '../../platform/savedRecordModel/index.js';

const numericFields = new Set(['fixtureQuantity','fixtureCustomDu','kValue','fillRatio','slopeCmM','pipeLengthM','heightDifferenceM','bends90','continuousFlow','pumpFlow','rainFlow']);
const normalizeNumeric = value => canonicalGermanNumberInput(value);
const normalizedFixtureQuantity = value => Math.max(0, Math.round(normalizeQuantityInput(value, 1)) || 0);
const fixtureKeyFields = ['typeId', 'customName', 'customDu', 'customDn'];

function draftFromRoot(root, current = {}) {
  const typeId = readFieldValue(root, 'fixtureType', current.fixtureType || 'washbasin');
  const base = getFixture(typeId);
  const quantity = normalizedFixtureQuantity(readFieldValue(root, 'fixtureQuantity', current.fixtureQuantity || '1'));
  const record = { id: `fixture-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, typeId, quantity: String(quantity) };
  if (base?.custom) {
    record.customName = readFieldValue(root, 'fixtureCustomName', current.fixtureCustomName || 'Freier Gegenstand');
    record.customDu = normalizeNumeric(readFieldValue(root, 'fixtureCustomDu', current.fixtureCustomDu || '0'));
    record.customDn = readFieldValue(root, 'fixtureCustomDn', current.fixtureCustomDn || '—');
  }
  return record;
}

function addFixture({ current = {}, root } = {}) {
  const record = draftFromRoot(root, current);
  if (normalizedFixtureQuantity(record.quantity) <= 0) return {};
  return {
    fixtures: upsertCollectionRecord(current.fixtures || [], record, {
      keyFields: fixtureKeyFields,
      merge: (item, added) => ({ ...item, quantity: String(normalizedFixtureQuantity(item.quantity) + normalizedFixtureQuantity(added.quantity)) })
    }),
    fixtureQuantity: '1',
    fixtureCustomName: '',
    fixtureCustomDu: '',
    fixtureCustomDn: ''
  };
}

function patchFixtureQuantity({ id, value, current = {} } = {}) {
  return { fixtures: patchCollectionItem(current.fixtures || [], id, { quantity: String(normalizedFixtureQuantity(value)) }) };
}
function deleteFixture({ id, current = {} } = {}) {
  return { fixtures: deleteCollectionItem(current.fixtures || [], id) };
}

function snapshot(current = {}, result = {}) {
  return createStateSnapshot({
    current,
    calculationResult: result,
    excludeKeys: ['savedCalculations', 'activeCalculationId', 'expandedCalculationId'],
    name: state => state.name?.trim() || `Schmutzwasser ${(state.savedCalculations || []).length + 1}`,
    resultMapper: output => ({ qtot: output.qtot, qww: output.qww, sumDu: output.sumDu, dn: output.selected?.dn, lineType: current.lineType })
  });
}
function hydrate(item = {}) {
  return hydrateStateRecord(item, { activeIdKey: 'activeCalculationId', nameKey: 'name' });
}
function clear(current = {}) {
  return { ...initialState, savedCalculations: current.savedCalculations || [] };
}

export default {
  segments: {
    fields: {
      lineFamily: {
        action: 'platform:segment:lineFamily',
        patch: (value, current = {}) => ({ lineType: resolveLineType(value, lineVentilationValue(current.lineType), current.lineType) })
      },
      lineVentilation: {
        action: 'platform:segment:lineVentilation',
        patch: (value, current = {}) => ({ lineType: resolveLineType(lineFamilyValue(current.lineType), value, current.lineType) })
      }
    }
  },
  lookupHydration: {
    key: 'platform:lookup-hydration',
    fields: ['usageType','fixtureType','lineType'],
    patch: (field, current = {}) => {
      const patch = {};
      if (field === 'usageType' && current.usageType !== 'custom') patch.kValue = String(toNumber(current.kValue || '0,5')).replace('.', ',');
      if (field === 'fixtureType') {
        const fixture = getFixture(current.fixtureType);
        if (!fixture?.custom) Object.assign(patch, { fixtureCustomName:'', fixtureCustomDu:'', fixtureCustomDn:'' });
      }
      return patch;
    }
  },
  collections: {
    fixtures: {
      add: addFixture,
      patchInput: patchFixtureQuantity,
      delete: deleteFixture
    }
  },
  savedRecords: {
    enabled: true,
    snapshot,
    hydrate,
    clear,
    listKey: 'savedCalculations',
    activeIdKey: 'activeCalculationId',
    expandedIdKey: 'expandedCalculationId',
    nameKey: 'name',
    recordPrefix: 'wastewater',
    preserveSaveScroll: true,
    preserveLoadScroll: true
  },
  normalizeFields: [...numericFields]
};

