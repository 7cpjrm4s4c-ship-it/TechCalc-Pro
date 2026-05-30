import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const state = readFileSync(new URL('../js/modules/rainwater/state.js', import.meta.url), 'utf8');

assert.match(source, /registerCentralActions\(root,/, 'Rainwater actions must be registered through the central event pipeline.');
assert.doesNotMatch(source, /bindSavedCalculationActions/, 'Rainwater must not use legacy saved calculation binding.');
assert.match(source, /'rainwater:surface-add'/, 'Surface add action must be pipeline-driven.');
assert.match(source, /'rainwater:surface-update'/, 'Surface update action must be pipeline-driven.');
assert.match(source, /'rainwater:surface-select'/, 'Surface selection must be pipeline-driven.');
assert.doesNotMatch(source, /function savedSnapshot|function savedRows|function surfaceDimensionCards/, 'Rainwater must not keep dormant duplicate save/result render paths.');
assert.doesNotMatch(source, /'rainwater:save'/, 'Rainwater must not keep duplicate calculation-level save workflow.');
assert.match(source, /'saved:toggle'/, 'Saved accordion toggle must use central saved action.');
assert.doesNotMatch(state, /activeCalculationId|expandedCalculationId|savedCalculations|name:\s*''/, 'Rainwater initial state must not keep duplicate calculation-save state.');
assert.match(state, /expandedSurfaceResultId:\s*null/, 'Surface result accordion state must be explicit store state.');

console.log('rainwater global standard ok');
