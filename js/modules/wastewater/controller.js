import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { readFieldValue, normalizeQuantityInput } from '../../core/formActions.js';
import { getFixture, toNumber } from './logic.js';
import { initialState } from './state.js';

const numericFields = new Set(['fixtureQuantity','fixtureCustomDu','kValue','fillRatio','slopeCmM','pipeLengthM','heightDifferenceM','bends90','continuousFlow','pumpFlow','rainFlow']);
const normalizeNumeric = value => canonicalGermanNumberInput(value);
const normalizedFixtureQuantity = value => Math.max(0, Math.round(normalizeQuantityInput(value, 1)) || 0);
const fixtureKey = (item = {}) => [item.typeId || '', item.customName || '', item.customDu || '', item.customDn || ''].join('|');

function lineFamilyValue(lineType) {
  if (String(lineType).startsWith('single-')) return 'single';
  if (String(lineType).startsWith('branch-')) return 'branch';
  if (lineType === 'ground-full' || lineType === 'ventilation') return 'ground-outside';
  return lineType || 'single-unvented';
}
function lineVentilationValue(lineType) {
  return String(lineType).endsWith('-vented') && !String(lineType).endsWith('unvented') ? 'vented' : 'unvented';
}
function resolveLineType(family, ventilation, previous = 'single-unvented') {
  if (family === 'single') return ventilation === 'vented' ? 'single-vented' : 'single-unvented';
  if (family === 'branch') return ventilation === 'vented' ? 'branch-vented' : 'branch-unvented';
  return family || previous;
}

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
  const key = fixtureKey(record);
  let merged = false;
  const fixtures = (current.fixtures || []).map(item => {
    if (fixtureKey(item) !== key) return item;
    merged = true;
    return { ...item, quantity: String(normalizedFixtureQuantity(item.quantity) + normalizedFixtureQuantity(record.quantity)) };
  });
  return {
    fixtures: merged ? fixtures : [...fixtures, record],
    fixtureQuantity: '1',
    fixtureCustomName: '',
    fixtureCustomDu: '',
    fixtureCustomDn: ''
  };
}

function patchFixtureQuantity({ id, value, current = {} } = {}) {
  return {
    fixtures: (current.fixtures || []).map(item => String(item.id) === String(id) ? { ...item, quantity: String(normalizedFixtureQuantity(value)) } : item)
  };
}
function deleteFixture({ id, current = {} } = {}) {
  return { fixtures: (current.fixtures || []).filter(item => String(item.id) !== String(id)) };
}

function snapshot(current = {}, result = {}) {
  const copy = { ...current };
  delete copy.savedCalculations;
  delete copy.activeCalculationId;
  delete copy.expandedCalculationId;
  return {
    name: current.name?.trim() || `Schmutzwasser ${(current.savedCalculations || []).length + 1}`,
    state: copy,
    result: { qtot: result.qtot, qww: result.qww, sumDu: result.sumDu, dn: result.selected?.dn, lineType: current.lineType }
  };
}
function hydrate(item = {}) {
  return { ...(item.state || {}), activeCalculationId: item.id, name: item.name || '' };
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

export { lineFamilyValue, lineVentilationValue, resolveLineType };
