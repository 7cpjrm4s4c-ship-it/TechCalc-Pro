import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const state = readFileSync(new URL('../js/modules/rainwater/state.js', import.meta.url), 'utf8');

assert.match(source, /registerCentralActions\(root,/, 'Rainwater actions must be registered through the central event pipeline.');
assert.doesNotMatch(source, /bindSavedCalculationActions/, 'Rainwater must not use legacy saved calculation binding.');
assert.match(source, /'rainwater:surface-add'/, 'Surface add action must be pipeline-driven.');
assert.match(source, /'rainwater:surface-update'/, 'Surface update action must be pipeline-driven.');
assert.match(source, /'rainwater:surface-select'/, 'Surface selection must be pipeline-driven.');
assert.match(source, /'rainwater:save'/, 'Calculation save must be pipeline-driven.');
assert.match(source, /'saved:toggle'/, 'Saved accordion toggle must use central saved action.');
assert.match(state, /expandedCalculationId:\s*null/, 'Saved calculation accordion state must be explicit store state.');
assert.match(state, /expandedSurfaceResultId:\s*null/, 'Surface result accordion state must be explicit store state.');
assert.match(source, /delete copy\.expandedCalculationId/, 'UI accordion state must not be persisted inside saved calculation snapshots.');
assert.match(source, /delete copy\.expandedSurfaceResultId/, 'Surface accordion state must not be persisted inside saved calculation snapshots.');

console.log('rainwater global standard ok');
