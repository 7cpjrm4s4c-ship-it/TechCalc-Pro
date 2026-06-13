import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { readFieldValue, normalizeQuantityInput } from '../../core/formActions.js';
import { getFixture, toNumber } from './logic.js';
import { initialState } from './state.js';
import { deleteCollectionItem, patchCollectionItem, upsertCollectionRecord } from '../../platform/collectionModel/index.js';
import { createStateSnapshot, hydrateStateRecord } from '../../platform/savedRecordModel/index.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { bindDebugPanel } from '../../platform/debugPanel/index.js';
import { commitAllFields } from '../../core/eventPipeline.js';
import { PlatformScrollManager } from '../../core/scrollManager.js';

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


export function wastewaterSavedStats(item = {}) {
  const result = item.result || {};
  return [
    { label: 'Gesamtabfluss', value: result.qtot !== undefined ? String(result.qtot).replace('.', ',') : '—', unit: result.qtot !== undefined ? 'l/s' : '' },
    { label: 'Schmutzwasser', value: result.qww !== undefined ? String(result.qww).replace('.', ',') : '—', unit: result.qww !== undefined ? 'l/s' : '' },
    { label: 'Σ DU', value: result.sumDu !== undefined ? String(result.sumDu).replace('.', ',') : '—' },
    { label: 'Dimension', value: result.dn || '—' }
  ];
}

export function wastewaterSavedSubtitle(item = {}) {
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

function bindWastewaterCollections(root) {
  if (!root || !state?.set) return;
  const collectionConfig = {
    fixtures: {
      add: addFixture,
      patchInput: patchFixtureQuantity,
      delete: deleteFixture
    }
  };
  root.__tcWastewaterCollectionContext = { collections: collectionConfig, state };

  if (!root.__tcWastewaterCollectionInputBound) {
    root.__tcWastewaterCollectionInputBound = true;
    const commitQuantity = (event, notify = true) => {
      const input = event.target?.closest?.('[data-collection-input="fixtures"]');
      if (!input || !root.contains(input)) return;
      event.stopPropagation?.();
      const patch = patchFixtureQuantity({ id: input.dataset.collectionId, value: input.value, current: state.get(), element: input, root }) || {};
      if (Object.keys(patch).length) state.set(patch, { action: notify ? 'platform:collection:fixtures:commit' : 'platform:collection:fixtures:input', notify });
    };
    root.addEventListener('input', event => commitQuantity(event, false), true);
    root.addEventListener('blur', event => commitQuantity(event, true), true);
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      const input = event.target?.closest?.('[data-collection-input="fixtures"]');
      if (!input || !root.contains(input)) return;
      event.preventDefault();
      commitQuantity(event, true);
    }, true);
  }

  const add = ({ element, event } = {}) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    commitAllFields(root, state, { action: 'platform:collection:fixtures:pre-add', notify: false });
    const patch = addFixture({ current: state.get(), root, element, collection: 'fixtures' }) || {};
    if (Object.keys(patch).length) {
      PlatformScrollManager.runWithoutScrollJump(() => state.set(patch, { action: 'platform:collection:fixtures:add', notify: true }), { frames: 10, delays: [0, 40, 100, 220, 420] });
    }
  };
  const remove = ({ element, event } = {}) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    const patch = deleteFixture({ id: element?.dataset?.collectionId, current: state.get(), element, root }) || {};
    if (Object.keys(patch).length) {
      PlatformScrollManager.runWithoutScrollJump(() => state.set(patch, { action: 'platform:collection:fixtures:delete', notify: true }), { frames: 10, delays: [0, 40, 100, 220, 420] });
    }
  };

  root.__tcWastewaterCollectionDirectContext = { add, remove };
  if (!root.__tcWastewaterCollectionDirectBound) {
    root.__tcWastewaterCollectionDirectBound = true;
    const direct = event => {
      const element = event.target?.closest?.('[data-tc-action]');
      if (!element || !root.contains(element)) return;
      const action = element.dataset.tcAction || '';
      if (action !== 'platform:collection:add' && action !== 'platform:collection:delete' && action !== 'collection:delete') return;
      const handler = action === 'platform:collection:add' ? root.__tcWastewaterCollectionDirectContext?.add : root.__tcWastewaterCollectionDirectContext?.remove;
      if (typeof handler !== 'function') return;
      const key = `${action}:${element.dataset.collection || ''}:${element.dataset.collectionId || ''}`;
      const now = Date.now();
      const last = root.__tcWastewaterCollectionLastAction || {};
      if (last.key === key && now - Number(last.at || 0) < 350) {
        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        return;
      }
      root.__tcWastewaterCollectionLastAction = { key, at: now };
      handler({ element, event, root });
    };
    root.addEventListener('pointerdown', direct, true);
  }
}

export function bindWastewaterPlatform(root, lineSectionController) {
  bindDebugPanel(root);
  lineSectionController?.bind?.(root);
  bindWastewaterCollections(root);
}

const structuralFields = new Set([
  'usageType',
  'lineType',
  'fixtureType',
  'holdingType'
]);

export function isDynamicWastewaterAction(meta = {}) {
  const action = String(meta.action || '');
  return action !== 'initial';
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
  normalizeFields: [...numericFields]
};

