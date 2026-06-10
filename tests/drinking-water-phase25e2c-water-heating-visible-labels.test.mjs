import assert from 'node:assert/strict';
import { createDrinkingWaterViewModel } from '../js/modules/drinking-water/viewModel.js';
import { renderInputCard, renderResultCard } from '../js/modules/drinking-water/view.js';
import { consumerRows } from '../js/modules/drinking-water/results.js';
import { createConsumer } from '../js/modules/drinking-water/logic.js';

const shower = createConsumer({ typeId: 'shower', count: '1' });
const baseState = {
  buildingType: 'residential',
  waterHeatingMode: 'central',
  unitName: '',
  unitConsumerType: 'shower',
  unitCount: '1',
  unitSimultaneityFactor: '',
  unitDraftConsumers: [shower],
  singleName: '',
  singleConsumerType: 'tapDn15',
  singleCount: '1',
  singlePermanent: 'false',
  singleDraftConsumers: [],
  savedUsageUnits: [{ id: 'u1', name: 'Bad', consumers: [shower] }],
  savedSingleConsumers: [],
  activeUnitId: null,
  activeSingleId: null,
  expandedUnitId: 'u1',
  expandedSingleId: null,
  uiUnitFormOpen: true,
  uiUnitSavedOpen: true,
  uiSingleFormOpen: false,
  uiSingleSavedOpen: false
};

const centralVm = createDrinkingWaterViewModel(baseState);
const decentralVm = createDrinkingWaterViewModel({ ...baseState, waterHeatingMode: 'decentral' });
const centralInput = renderInputCard(centralVm);
const decentralInput = renderInputCard(decentralVm);
const centralResult = renderResultCard(centralVm);
const decentralResult = renderResultCard(decentralVm);

assert.ok(centralInput.includes('Berechnungsgrundlage — zentral'));
assert.ok(decentralInput.includes('Berechnungsgrundlage — dezentral'));
assert.ok(centralInput.includes('Nutzungseinheiten — zentrale TWW-Bereitung'));
assert.ok(decentralInput.includes('Nutzungseinheiten — dezentrale WW-Bereitung'));
assert.ok(centralInput.includes('TWK/TWW'));
assert.ok(decentralInput.includes('TWK + WW-Bereitung'));
assert.ok(centralResult.includes('Ergebnis — Trinkwasser zentral'));
assert.ok(decentralResult.includes('Ergebnis — Trinkwasser dezentral'));
assert.ok(centralResult.includes('Zusammenstellung Einrichtungsgegenstände — zentral'));
assert.ok(decentralResult.includes('Zusammenstellung Einrichtungsgegenstände — dezentral'));
assert.ok(consumerRows([shower], 'central').includes('TWK/TWW'));
assert.ok(consumerRows([shower], 'decentral').includes('TWK + WW-Bereitung'));
assert.notEqual(centralInput, decentralInput, 'mode switch must rebuild visible form copy and saved-card labels');
assert.notEqual(centralResult, decentralResult, 'mode switch must rebuild visible result cards');

console.log('drinking-water phase25e2c visible water-heating labels ok');
