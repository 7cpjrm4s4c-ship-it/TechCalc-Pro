import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rainwater = readFileSync('js/modules/rainwater/index.js', 'utf8');
const runtime = readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
const savedController = readFileSync('js/core/savedRecordController.js', 'utf8');
const resultRenderer = readFileSync('js/core/resultRenderer.js', 'utf8');
const moduleRenderer = readFileSync('js/platform/moduleRenderer/index.js', 'utf8');
const rainwaterResults = readFileSync('js/modules/rainwater/results.js', 'utf8');

assert.match(resultRenderer, /export function renderPrimaryResultCard/, 'platform result renderer must expose primary result cards');
assert.match(resultRenderer, /export function renderNoticeCard/, 'platform result renderer must expose notice cards');
assert.match(savedController, /action === 'toggle-expanded'/, 'savedRecordReducer must own accordion toggle state');
assert.match(savedController, /expandedIdKey/, 'savedRecordReducer must support expanded record state');
assert.match(runtime, /createSavedRecordActions/, 'Platform runtime must create saved records through the central action factory');
assert.match(savedController, /savedRecordReducer/, 'Platform saved-record controller must own the reducer');
assert.doesNotMatch(rainwater, /savedRecordReducer|createSavedRecordActions|renderResultModel|renderPlatformModuleView|mountModule/, 'Rainwater index must not call platform internals directly');
assert.match(moduleRenderer, /renderResultModel/, 'Platform module renderer must route result models through resultRenderer');
assert.match(rainwaterResults, /export function buildRainwaterResultModel|export function results/, 'Rainwater must provide result data through a module result model');
assert.doesNotMatch(rainwater, /removeRecord\(/, 'Rainwater must not delete surfaces through direct module list mutation');
assert.doesNotMatch(rainwater, /createRecordId\(/, 'Rainwater must not allocate record ids outside the central saved-record factory');
assert.doesNotMatch(rainwater, /mainResult\(/, 'Rainwater must not render primary result cards directly');

console.log('rainwater phase17a decoupling ok');
