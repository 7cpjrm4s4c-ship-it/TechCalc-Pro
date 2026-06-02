import assert from 'node:assert/strict';
import fs from 'node:fs';
import rainwater from '../js/modules/rainwater/index.js';
import wastewater from '../js/modules/wastewater/index.js';

const runtimeSource = fs.readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
const rainwaterController = fs.readFileSync('js/modules/rainwater/controller.js', 'utf8');
const wastewaterController = fs.readFileSync('js/modules/wastewater/controller.js', 'utf8');

assert.match(runtimeSource, /createNormalizedState/, 'Platform runtime must centrally normalize configured numeric fields.');
assert.match(runtimeSource, /normalizeConfiguredFields\(patch, numericFields\)/, 'Runtime state.set must normalize configured fields before writing state.');
assert.match(rainwaterController, /normalizeFields: \[\.\.\.surfaceNumericFields\]/, 'Rainwater must delegate numeric input normalization to the platform runtime.');
assert.match(wastewaterController, /normalizeFields: \[\.\.\.numericFields\]/, 'Wastewater must delegate numeric input normalization to the platform runtime.');

rainwater.state.set({ areaSize: '2.500', roofRainIntensity: '300,5' }, { action: 'phase17c:test', notify: false });
let rainState = rainwater.state.get();
assert.equal(rainState.areaSize, '2500', 'Rainwater area inputs must not collapse German thousand separators to decimal values.');
assert.equal(rainState.roofRainIntensity, '300,5', 'Rainwater decimal comma inputs must remain valid German input values.');
let rainResult = rainwater.calculate({ ...rainState, surfaces: [] });
assert.ok(rainResult.area >= 2499 && rainResult.area <= 2501, 'Rainwater calculation must use 2.500 m² as 2500 m².');

wastewater.state.set({ pipeLengthM: '1.250', slopeCmM: '1,5', fixtureQuantity: '2.000' }, { action: 'phase17c:test', notify: false });
const wasteState = wastewater.state.get();
assert.equal(wasteState.pipeLengthM, '1250', 'Wastewater pipe lengths must use German thousand separators correctly.');
assert.equal(wasteState.slopeCmM, '1,5', 'Wastewater decimal comma inputs must remain valid German input values.');
assert.equal(wasteState.fixtureQuantity, '2000', 'Wastewater fixture quantities must normalize centrally as numeric input.');

rainwater.state.replace(rainwater.initialState, { action: 'phase17c:reset', notify: false });
wastewater.state.replace(wastewater.initialState, { action: 'phase17c:reset', notify: false });

console.log('phase17c reference-module platform bugfix regression ok');
