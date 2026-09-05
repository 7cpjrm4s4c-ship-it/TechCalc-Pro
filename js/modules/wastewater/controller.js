import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { readFieldValue, normalizeQuantityInput } from '../../core/formActions.js';
import { getFixture, toNumber } from './logic.js';
import { usageTypes } from './tables.js';
import { initialState } from './state.js';
import { deleteCollectionItem, patchCollectionItem, upsertCollectionRecord } from '../../platform/collectionModel/index.js';
import { createStateSnapshot, hydrateStateRecord } from '../../platform/savedRecordModel/index.js';
import { state } from './state.js';
import { calculate } from './logic.js';
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

const LINE_TYPE_LABELS = Object.freeze({
  'single-unvented': 'Einzelanschluss unbeflüftet',
  'single-vented': 'Einzelanschluss belüftet',
  'branch-unvented': 'Anschlussleitung unbeflüftet',
  'branch-vented': 'Anschlussleitung belüftet',
  stack: 'Fallleitung',
  collector: 'Sammelleitung',
  'ground-inside': 'Grundleitung innen',
  'ground-outside': 'Grundleitung außen'
});
const BRANCH_TYPE_LABELS = Object.freeze({
  'with-radius': 'mit Innenradius',
  'without-radius': 'ohne Innenradius'
});
const FILL_RATIO_LABELS = Object.freeze({
  '0.5': 'h/di 0,5',
  '0.7': 'h/di 0,7',
  '1.0': 'h/di 1,0'
});

function displayNumber(value, digits = 2) {
  if (value === '' || value === null || value === undefined) return '—';
  const number = typeof value === 'number' ? value : toNumber(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(number);
}
function row(label, value, unit = '', digits = 2) {
  const normalized = typeof value === 'number' || /^-?\d+(?:[.,]\d+)?$/.test(String(value ?? '').trim())
    ? displayNumber(value, digits)
    : String(value ?? '—');
  return [label, normalized || '—', unit];
}
function positiveRow(label, value, unit = '', digits = 2) {
  return toNumber(value) > 0 ? row(label, value, unit, digits) : null;
}
function lineTypeLabel(value) {
  return LINE_TYPE_LABELS[value] || value || '—';
}
function usageTypeLabel(current = {}) {
  const usage = usageTypes.find(item => item.value === current.usageType);
  return usage?.label || (current.usageType === 'custom' ? 'Benutzerdefinierte Abflusskennzahl' : '—');
}
function fixtureDisplayRows(fixtures = []) {
  if (!fixtures.length) return [['Entwässerungsgegenstände', 'keine Gegenstände erfasst', '']];
  return fixtures.flatMap((item, index) => [
    ['Entwässerungsgegenstand', `${index + 1}. ${item.name || 'Gegenstand'}`, ''],
    ['Anzahl', displayNumber(item.qty, 0), 'Stk.'],
    ['Anschlusswert je Stück', displayNumber(item.du, 2), 'DU'],
    ['Anschlusswert gesamt', displayNumber(item.totalDu, 2), 'DU'],
    ['Mindestnennweite Gegenstand', item.dn || '—', '']
  ]);
}
function calculationApproach(result = {}) {
  return `Qww = K × √ΣDU = ${displayNumber(result.k, 2)} × √${displayNumber(result.sumDu, 2)} = ${displayNumber(result.qww, 2)} l/s; Qtot = Qww + Qc + Qp + Qr,a = ${displayNumber(result.qtot, 2)} l/s`;
}
function wastewaterReportRows(current = {}, result = {}) {
  const rows = [
    ['Nutzungsart', usageTypeLabel(current), ''],
    row('Abflusskennzahl K', result.k ?? current.kValue, '', 2),
    ['Leitungsart', lineTypeLabel(current.lineType), '']
  ];
  if (current.lineType === 'stack') rows.push(['Abzweigart Fallleitung', BRANCH_TYPE_LABELS[current.branchType] || 'mit Innenradius', '']);
  if (['branch-vented', 'collector', 'ground-inside', 'ground-outside'].includes(current.lineType)) rows.push(['Füllungsgrad', FILL_RATIO_LABELS[String(current.fillRatio || '0.5')] || String(current.fillRatio || '—'), '']);
  rows.push(row('Gefälle', current.slopeCmM, 'cm/m', 2));
  if (['single-unvented','single-vented','branch-unvented'].includes(current.lineType)) rows.push(row('Rohrlänge', current.pipeLengthM, 'm', 2));
  if (['single-unvented','branch-unvented','branch-vented'].includes(current.lineType)) rows.push(row('90°-Umlenkungen', current.bends90, 'Stk.', 0));
  rows.push(...fixtureDisplayRows(result.fixtures || []));
  rows.push(
    row('Summe Anschlusswerte', result.sumDu, 'DU', 2),
    row('Größter Einzelanschlusswert', result.largestDu, 'DU', 2),
    positiveRow('Dauerabfluss Qc', result.qc, 'l/s', 2),
    positiveRow('Pumpenförderstrom Qp', result.qp, 'l/s', 2),
    positiveRow('Verunreinigtes Niederschlagswasser Qr,a', result.qra, 'l/s', 2),
    row('Schmutzwasserabfluss Qww', result.qww, 'l/s', 2),
    row('Gesamtabfluss Qtot', result.qtot, 'l/s', 2),
    ['Dimensionierungsansatz', result.dimensionBasis || '—', ''],
    ['Berechnungsansatz', calculationApproach(result), ''],
    ['Ausgewählte Nennweite', result.selected?.dn || '—', ''],
    result.selected?.capacity !== null && result.selected?.capacity !== undefined ? row('Tabellenkapazität', result.selected.capacity, 'l/s', 2) : null,
    result.hasWc ? ['WC angeschlossen', 'ja', ''] : ['WC angeschlossen', current.hasWc === 'yes' ? 'ja' : 'nein', '']
  );
  if (Array.isArray(result.warnings) && result.warnings.length) {
    rows.push(['Hinweise', result.warnings.join(' · '), '']);
  }
  return rows.filter(Boolean);
}
export function buildWastewaterRecord(currentState = {}, result = {}, items = [], id, name, existing = null) {
  const record = snapshot({ ...currentState, activeCalculationId: null, name }, result);
  return {
    ...record,
    id,
    name: name || currentState.name?.trim() || existing?.name || record.name || `Schmutzwasser ${items.length + 1}`,
    rows: wastewaterReportRows(currentState, result),
    result: {
      ...(record.result || {}),
      qtot: result.qtot,
      qww: result.qww,
      sumDu: result.sumDu,
      dn: result.selected?.dn,
      lineType: lineTypeLabel(currentState.lineType)
    },
    createdAt: existing?.createdAt || record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
export function bindWastewaterCollections(root) {
  if (!root || !state?.set) return;
  const collectionConfig = {
    fixtures: {
      add: addFixture,
      patchInput: patchFixtureQuantity,
      delete: deleteFixture
    }
  };
  root.__tcPlatformCollectionContext = { collections: collectionConfig, state };
  root.__tcWastewaterCollectionContext = root.__tcPlatformCollectionContext;
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
