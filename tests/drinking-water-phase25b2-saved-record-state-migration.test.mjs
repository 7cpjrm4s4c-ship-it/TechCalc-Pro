import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { state } from '../js/modules/drinking-water/state.js';
import { createConsumer, createUsageUnit, createSingleGroup, readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from '../js/modules/drinking-water/logic.js';
import { normalizeDrinkingWaterSavedState, hydrateDrinkingWaterSavedState } from '../js/modules/drinking-water/controller.js';

const stateSource = readFileSync(new URL('../js/modules/drinking-water/state.js', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../js/modules/drinking-water/controller.js', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../js/modules/drinking-water/index.js', import.meta.url), 'utf8');

assert.match(indexSource, /createPlatformModule/, 'Trinkwasser muss über createPlatformModule gemountet werden.');
assert.match(stateSource, /savedUsageUnits/, 'Nutzungseinheiten müssen im State-Vertrag vorhanden sein.');
assert.match(stateSource, /savedSingleConsumers/, 'Einzelverbrauchergruppen müssen im State-Vertrag vorhanden sein.');
assert.match(controllerSource, /normalizeDrinkingWaterSavedState/, 'Controller muss gespeicherte Trinkwasser-Datensätze normalisieren.');
assert.match(controllerSource, /hydrateDrinkingWaterSavedState/, 'Controller muss Restore-/Legacy-Daten in den State hydrieren.');
assert.doesNotMatch(indexSource, /mountModule/, 'Legacy mountModule darf im Trinkwasser-Index nicht mehr vorkommen.');

writeUsageUnits([]);
writeSingleConsumers([]);
state.set({ savedUsageUnits: [], savedSingleConsumers: [] }, { notify:false });

const unit = createUsageUnit({
  name: 'Bad Test',
  consumers: [createConsumer({ typeId: 'shower', count: 1 })]
});
const single = createSingleGroup({
  name: 'Zapfstelle Test',
  consumers: [createConsumer({ typeId: 'tapDn15', count: 1 })]
});

writeUsageUnits([unit]);
writeSingleConsumers([single]);
hydrateDrinkingWaterSavedState();

const hydrated = normalizeDrinkingWaterSavedState(state.get());
assert.equal(hydrated.savedUsageUnits.length, 1, 'Restore muss Nutzungseinheiten in den State übernehmen.');
assert.equal(hydrated.savedSingleConsumers.length, 1, 'Restore muss Einzelverbrauchergruppen in den State übernehmen.');
assert.equal(readUsageUnits().length, 1, 'Legacy-Projektstorage-Kompatibilität für Nutzungseinheiten muss erhalten bleiben.');
assert.equal(readSingleConsumers().length, 1, 'Legacy-Projektstorage-Kompatibilität für Einzelverbraucher muss erhalten bleiben.');

console.log('drinking-water phase25b2 saved-record state migration ok');
