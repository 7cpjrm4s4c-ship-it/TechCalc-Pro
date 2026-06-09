import assert from 'node:assert/strict';
import { state } from '../js/modules/drinking-water/state.js';
import { calculate, createConsumer, writeUsageUnits, writeSingleConsumers } from '../js/modules/drinking-water/logic.js';
import { createDrinkingWaterViewModel } from '../js/modules/drinking-water/viewModel.js';
import { renderView } from '../js/modules/drinking-water/view.js';

writeUsageUnits([]);
writeSingleConsumers([]);

const fresh = state.get();
assert.equal(fresh.unitName, '', 'Nutzungseinheit-Bezeichnung muss beim Start leer sein.');
assert.equal(fresh.singleName, '', 'Einzelverbraucher-Bezeichnung muss beim Start leer sein.');

const draftOnly = {
  ...fresh,
  unitName: 'Nicht gespeichert',
  unitDraftConsumers: [createConsumer({ typeId: 'shower', count: 10 })],
  singleName: 'Nicht gespeichert',
  singleDraftConsumers: [createConsumer({ typeId: 'wcCistern', count: 5 })]
};
const draftResult = calculate(draftOnly);
assert.equal(draftResult.usageUnits.length, 0, 'Entwurf-Nutzungseinheiten dürfen nicht in die Berechnung eingehen.');
assert.equal(draftResult.singleGroups.length, 0, 'Entwurf-Einzelverbraucher dürfen nicht in die Berechnung eingehen.');
assert.equal(draftResult.peakFlow, 0, 'Ohne gespeicherte Verbraucher muss der Spitzendurchfluss 0 bleiben.');

const vm = createDrinkingWaterViewModel(fresh, draftResult);
assert.equal(vm.resultModel.primary.primary.value, '—', 'Start-Ergebnis muss leer dargestellt werden.');
assert.equal(vm.resultModel.primary.primary.unit, '', 'Start-Ergebnis darf keine Einheit neben leerem Wert anzeigen.');
assert(renderView(fresh).includes('tc-accordion__summary-text'), 'Accordion-Titel und Untertitel müssen im Zeilenversatz gerendert werden.');

console.log('drinking-water phase25b2b2b startup result contract ok');
