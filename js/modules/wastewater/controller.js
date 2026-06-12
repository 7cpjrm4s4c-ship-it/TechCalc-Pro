import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { readFieldValue, normalizeQuantityInput } from '../../core/formActions.js';
import { getFixture, toNumber } from './logic.js';
import { initialState } from './state.js';
import { deleteCollectionItem, patchCollectionItem, upsertCollectionRecord } from '../../platform/collectionModel/index.js';
import { createStateSnapshot, hydrateStateRecord } from '../../platform/savedRecordModel/index.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { state } from './state.js';
import { calculate } from './logic.js';

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

export function snapshot(current = {}, result = {}) {
  return createStateSnapshot({
    current,
    calculationResult: result,
    excludeKeys: ['savedCalculations', 'activeCalculationId', 'expandedCalculationId'],
    name: state => state.name?.trim() || `Schmutzwasser ${(state.savedCalculations || []).length + 1}`,
    resultMapper: output => ({ qtot: output.qtot, qww: output.qww, sumDu: output.sumDu, dn: output.selected?.dn, lineType: current.lineType })
  });
}
export function hydrate(item = {}, current = {}) {
  const patch = hydrateStateRecord(item, { activeIdKey: 'activeCalculationId', nameKey: 'name' });
  return { ...patch, savedCalculations: current.savedCalculations || [] };
}
export function clear(current = {}) {
  return { ...initialState, savedCalculations: current.savedCalculations || [] };
}


function wastewaterSavedStats(item = {}) {
  const result = item.result || {};
  return [
    { label: 'Gesamtabfluss', value: result.qtot !== undefined ? String(result.qtot).replace('.', ',') : '—', unit: result.qtot !== undefined ? 'l/s' : '' },
    { label: 'Schmutzwasser', value: result.qww !== undefined ? String(result.qww).replace('.', ',') : '—', unit: result.qww !== undefined ? 'l/s' : '' },
    { label: 'Σ DU', value: result.sumDu !== undefined ? String(result.sumDu).replace('.', ',') : '—' },
    { label: 'Dimension', value: result.dn || '—' }
  ];
}

function wastewaterSavedSubtitle(item = {}) {
  const result = item.result || {};
  return [result.qtot !== undefined ? `${String(result.qtot).replace('.', ',')} l/s` : '', result.dn, result.lineType].filter(Boolean).join(' · ');
}

export function buildWastewaterRecord(currentState = {}, result = {}, items = [], id, name, existing = null) {
  const record = snapshot({ ...currentState, activeCalculationId: null, name }, result);
  return {
    ...record,
    id,
    name: name || currentState.name?.trim() || existing?.name || record.name || `Schmutzwasser ${items.length + 1}`,
    createdAt: existing?.createdAt || record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const wastewaterSavedController = createLineSectionController({
  state,
  listKey: 'savedCalculations',
  activeIdKey: 'activeCalculationId',
  nameKey: 'name',
  expandedIdKey: 'expandedCalculationId',
  recordPrefix: 'wastewater',
  cardTitle: 'Gespeicherte Berechnungen',
  nameLabel: 'Bezeichnung',
  nameInputId: 'name',
  namePlaceholder: 'z. B. Strang WC-Kern Nord',
  emptyText: 'Noch keine Schmutzwasser-Berechnungen gespeichert.',
  accent: 'green',
  dynamicAttr: 'saved-records',
  dynamicDataAttr: 'data-platform-dynamic',
  title: item => item.name || 'Berechnung',
  subtitle: wastewaterSavedSubtitle,
  stats: wastewaterSavedStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildWastewaterRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrate(item, currentState)
});

export function bindWastewaterSavedActions(root) {
  wastewaterSavedController.bind(root);
}

export default {
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
    enabled: false,
    snapshot,
    hydrate,
    clear,
    listKey: 'savedCalculations',
    activeIdKey: 'activeCalculationId',
    expandedIdKey: 'expandedCalculationId',
    nameKey: 'name',
    recordPrefix: 'wastewater',
    attrs: { loadAttr: 'data-line-select', toggleAttr: 'data-line-toggle', deleteAttr: 'data-line-delete' },
    preserveSaveScroll: true,
    preserveLoadScroll: true
  },
  normalizeFields: [...numericFields]
};

