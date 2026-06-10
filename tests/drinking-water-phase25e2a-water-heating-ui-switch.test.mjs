import assert from 'node:assert/strict';
import { createDrinkingWaterViewModel, waterHeatingUi } from '../js/modules/drinking-water/viewModel.js';
import { renderInputCard, renderResultCard } from '../js/modules/drinking-water/view.js';
import { createConsumer } from '../js/modules/drinking-water/logic.js';

const baseState = {
  buildingType: 'residential',
  waterHeatingMode: 'central',
  unitName: '',
  unitConsumerType: 'shower',
  unitCount: '1',
  unitSimultaneityFactor: '',
  unitDraftConsumers: [createConsumer({ typeId: 'shower', count: '1' })],
  singleName: '',
  singleConsumerType: 'tapDn15',
  singleCount: '1',
  singlePermanent: 'false',
  singleDraftConsumers: [],
  savedUsageUnits: [],
  savedSingleConsumers: [],
  activeUnitId: null,
  activeSingleId: null,
  expandedUnitId: null,
  expandedSingleId: null,
  uiUnitFormOpen: true,
  uiUnitSavedOpen: false,
  uiSingleFormOpen: true,
  uiSingleSavedOpen: false
};

assert.equal(waterHeatingUi('central').basisTitle, 'Berechnungsgrundlage — zentral');
assert.equal(waterHeatingUi('decentral').basisTitle, 'Berechnungsgrundlage — dezentral');

const centralVm = createDrinkingWaterViewModel(baseState);
const decentralVm = createDrinkingWaterViewModel({ ...baseState, waterHeatingMode: 'decentral' });

assert.notEqual(centralVm.waterHeating.basisTitle, decentralVm.waterHeating.basisTitle);
assert.ok(renderInputCard(centralVm).includes('Berechnungsgrundlage — zentral'));
assert.ok(renderInputCard(decentralVm).includes('Berechnungsgrundlage — dezentral'));
assert.ok(renderInputCard(centralVm).includes('TWK/TWW'));
assert.ok(renderInputCard(decentralVm).includes('TWK + WW-Zuschlag'));
assert.ok(renderResultCard(centralVm).includes('Zentrale Warmwasserbereitung'));
assert.ok(renderResultCard(decentralVm).includes('Dezentrale Warmwasserbereitung'));
assert.notEqual(centralVm.result.peakFlow, decentralVm.result.peakFlow, 'Draft preview must switch values together with the UI mode.');

console.log('drinking-water phase25e2a water-heating UI switch ok');
