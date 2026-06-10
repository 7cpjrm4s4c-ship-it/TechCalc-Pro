import assert from 'node:assert/strict';
import { state } from '../js/modules/drinking-water/state.js';
import { createConsumer, createUsageUnit, createSingleGroup, writeUsageUnits, writeSingleConsumers } from '../js/modules/drinking-water/logic.js';
import { createDrinkingWaterViewModel } from '../js/modules/drinking-water/viewModel.js';
import { renderInputCard } from '../js/modules/drinking-water/view.js';

writeUsageUnits([]);
writeSingleConsumers([]);
state.set({
  savedUsageUnits: [],
  savedSingleConsumers: [],
  unitDraftConsumers: [],
  singleDraftConsumers: [],
  activeUnitId: null,
  activeSingleId: null,
  uiUnitSavedOpen: true,
  uiSingleSavedOpen: true
}, { notify:false });

const emptyVm = createDrinkingWaterViewModel(state.get());
assert.equal(emptyVm.savedUsageUnits.length, 0, 'Aktueller Entwurf darf nicht als gespeicherte Nutzungseinheit erscheinen.');
assert.equal(emptyVm.savedSingleGroups.length, 0, 'Aktueller Entwurf darf nicht als gespeicherte Einzelverbrauchergruppe erscheinen.');
const emptyHtml = renderInputCard(emptyVm);
assert.match(emptyHtml, /0 Nutzungseinheiten angelegt/, 'Saved-Accordion muss bei leerem Speicher 0 Nutzungseinheiten anzeigen.');
assert.match(emptyHtml, /0 Gruppen außerhalb NE/, 'Saved-Accordion muss bei leerem Speicher 0 Einzelverbrauchergruppen anzeigen.');
assert.doesNotMatch(emptyHtml, /data-dw-unit-delete=/, 'Entwurfs-Nutzungseinheit darf keinen nicht löschbaren Delete-Button erzeugen.');
assert.doesNotMatch(emptyHtml, /data-dw-single-delete=/, 'Entwurfs-Einzelverbraucher darf keinen nicht löschbaren Delete-Button erzeugen.');

const unit = createUsageUnit({ name:'Bad Fix', consumers:[createConsumer({ typeId:'shower', count:1 })] });
const single = createSingleGroup({ name:'Zapfstelle Fix', consumers:[createConsumer({ typeId:'tapDn15', count:1 })] });
writeUsageUnits([unit]);
writeSingleConsumers([single]);
const savedVm = createDrinkingWaterViewModel(state.get());
assert.equal(savedVm.savedUsageUnits.length, 1, 'Echte gespeicherte Nutzungseinheit muss weiterhin erscheinen.');
assert.equal(savedVm.savedSingleGroups.length, 1, 'Echte gespeicherte Einzelverbrauchergruppe muss weiterhin erscheinen.');

console.log('drinking-water phase25b2a saved-record list fix ok');
