import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const state = readFileSync(new URL('../js/modules/rainwater/state.js', import.meta.url), 'utf8');

assert.match(source, /createPlatformModule/, 'Rainwater must be mounted through the platform module runtime.');
assert.match(runtime, /registerCentralActions\(root, actions\)/, 'Platform runtime must register actions through the central event pipeline.');
assert.doesNotMatch(source, /registerCentralActions|createSavedRecordActions|renderPlatformModuleView|mountModule/, 'Rainwater index must not own platform action, renderer, or mount wiring.');
assert.doesNotMatch(source, /bindSavedCalculationActions/, 'Rainwater must not use legacy saved calculation binding.');
assert.match(runtime, /'saved:add'/, 'Surface add action must use the platform saved-record action.');
assert.match(runtime, /'saved:update'/, 'Surface update action must use the platform saved-record action.');
assert.match(runtime, /'saved:load'/, 'Surface selection must use the platform saved-record action.');
assert.match(runtime, /'saved:toggle'/, 'Saved accordion toggle must use central saved action.');
assert.match(controller, /listKey:\s*'surfaces'/, 'Rainwater saved surface storage must be declarative controller config.');
assert.doesNotMatch(source, /function savedSnapshot|function savedRows|function surfaceDimensionCards/, 'Rainwater must not keep dormant duplicate save/result render paths.');
assert.doesNotMatch(source, /'rainwater:save'/, 'Rainwater must not keep duplicate calculation-level save workflow.');
assert.doesNotMatch(state, /activeCalculationId|expandedCalculationId|savedCalculations|name:\s*''/, 'Rainwater initial state must not keep duplicate calculation-save state.');
assert.match(state, /expandedSurfaceResultId:\s*null/, 'Surface result accordion state must be explicit store state.');

console.log('rainwater global standard ok');
