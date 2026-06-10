import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import schema from '../js/modules/rainwater/schema.js';
import controller from '../js/modules/rainwater/controller.js';
import { initialState } from '../js/modules/rainwater/state.js';
import { calculate } from '../js/modules/rainwater/logic.js';
import { renderSchemaForm } from '../js/core/schemaRenderer.js';

const controllerSource = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const logicSource = readFileSync('js/modules/rainwater/logic.js', 'utf8');

assert.match(controllerSource, /createStateSnapshot/, 'Rainwater must use the same state-snapshot saved-record contract as wastewater/heating style modules.');
assert.match(controllerSource, /hydrateStateRecord/, 'Rainwater load must hydrate saved records through the platform saved-record model.');
assert.doesNotMatch(controllerSource, /patchSurfaceModeDom|domPatch|querySelector|hidden\s*=/, 'Rainwater surface switch must not use module-local DOM label/visibility patches.');
assert.match(logicSource, /item\?\.state \|\| item\?\.inputState \|\| item/, 'Rainwater calculation must accept platform state-record surfaces and legacy flat surfaces.');

const propertyState = {
  ...initialState,
  surfaceMode: 'property',
  calculationType: 'property',
  areaType: 'concrete-asphalt',
  areaName: 'Hofflaeche Test',
  areaSize: '2.500',
  propertyRainIntensity: '300',
  roofRainIntensity: '300',
  drainSize: 'DN 100'
};

const record = controller.savedRecords.snapshot(propertyState, calculate(propertyState));
assert.equal(record.name, 'Hofflaeche Test');
assert.ok(record.state, 'Rainwater saved surface record must store input values under state.');
assert.equal(record.state.surfaceMode, 'property');
assert.equal(record.state.areaSize, '2500');
assert.equal(record.surfaces, undefined, 'Rainwater saved surface record must not recursively store the surface list.');

const saved = { id: 'surface-test-1', ...record };
const hydrated = controller.savedRecords.hydrate(saved, propertyState);
assert.equal(hydrated.activeSurfaceId, 'surface-test-1');
assert.equal(hydrated.areaName, 'Hofflaeche Test');
assert.equal(hydrated.surfaceMode, 'property');

const calculated = calculate({ ...initialState, surfaces: [saved] });
assert.equal(calculated.surfaces.length, 2, 'Saved surface plus current draft should both be available to the result model.');
const persisted = calculated.surfaces.find(item => item.id === 'surface-test-1');
assert.ok(persisted, 'Platform state-record surface must be calculated as a persisted surface.');
assert.equal(persisted.name, 'Hofflaeche Test');
assert.equal(persisted.surfaceMode, 'property');
assert.equal(persisted.area, 2500);

const roofHtml = renderSchemaForm(schema, { ...initialState, surfaceMode: 'roof', calculationType: 'roof' });
const propertyHtml = renderSchemaForm(schema, { ...initialState, surfaceMode: 'property', calculationType: 'property', areaType: 'concrete-asphalt' });
assert.match(roofHtml, /Regenspende r\(5,5\)/, 'Roof mode schema must render r(5,5).');
assert.doesNotMatch(roofHtml, /Regenspende r\(5,2\)/, 'Roof mode schema must not render the property rain label.');
assert.match(propertyHtml, /Regenspende r\(5,2\)/, 'Property mode schema must render r(5,2) through schema rebuild.');
assert.doesNotMatch(propertyHtml, /Regenspende r\(5,5\)/, 'Property mode schema must not require a delayed DOM patch for r(5,2).');

console.log('rainwater phase17c11 heating-contract cleanup regression ok');
