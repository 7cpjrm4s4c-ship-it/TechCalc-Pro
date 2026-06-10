import assert from 'node:assert/strict';
import { calculate, createConsumer, writeUsageUnits, writeSingleConsumers } from '../js/modules/drinking-water/logic.js';
import { createDrinkingWaterViewModel } from '../js/modules/drinking-water/viewModel.js';

writeUsageUnits([]);
writeSingleConsumers([]);

const baseState = {
  buildingType: 'residential',
  waterHeatingMode: 'central',
  unitConsumerType: 'shower',
  unitCount: '1',
  unitDraftConsumers: [],
  singleConsumerType: 'tapDn15',
  singleCount: '1',
  singlePermanent: 'false',
  singleDraftConsumers: []
};

const persistedOnly = calculate(baseState);
assert.equal(persistedOnly.usageUnits.length, 0, 'default controls must not create persisted usage units');
assert.equal(persistedOnly.peakFlow, 0, 'startup result remains empty without saved records or draft rows');

const draftState = {
  ...baseState,
  unitDraftConsumers: [createConsumer({ typeId: 'shower', count: 1 })]
};

const centralPreview = createDrinkingWaterViewModel({ ...draftState, waterHeatingMode: 'central' }).result;
const decentralPreview = createDrinkingWaterViewModel({ ...draftState, waterHeatingMode: 'decentral' }).result;

assert.equal(centralPreview.usageUnits.length, 1, 'preview includes unsaved draft rows');
assert.equal(decentralPreview.usageUnits.length, 1, 'decentral preview includes unsaved draft rows');
assert.notEqual(centralPreview.neSumFlow, decentralPreview.neSumFlow, 'central/decentral switch updates preview values before saving');

const persistedDraftIgnored = calculate({ ...draftState, waterHeatingMode: 'decentral' });
assert.equal(persistedDraftIgnored.usageUnits.length, 0, 'persistent calculation still ignores draft rows');

console.log('drinking-water phase25e1 water-heating preview ok');
