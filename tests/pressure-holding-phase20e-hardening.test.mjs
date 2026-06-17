import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexSource = fs.readFileSync('js/modules/pressure-holding/index.js', 'utf8');
const controllerSource = fs.readFileSync('js/modules/pressure-holding/controller.js', 'utf8');
const viewModelSource = fs.readFileSync('js/modules/pressure-holding/viewModel.js', 'utf8');
const viewSource = fs.readFileSync('js/modules/pressure-holding/view.js', 'utf8');
const resultsSource = fs.readFileSync('js/modules/pressure-holding/results.js', 'utf8');
const configSource = fs.readFileSync('js/modules/pressure-holding/config.js', 'utf8');
const dynamicSource = fs.readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');

assert.match(configSource, /phase-20e-hardening/, 'migration status documents Phase 20E hardening');
assert.match(configSource, /CENTRAL_SAVED_RECORDS/, 'pressure-holding exposes central saved-record capability');

assert.match(indexSource, /createPlatformModule\(\{/, 'pressure-holding is mounted through platform runtime');
assert.doesNotMatch(indexSource, /mountModule\(/, 'legacy mountModule is not used');
assert.doesNotMatch(indexSource, /bindSavedRecordWorkflow/, 'legacy saved-record workflow is not imported by adapter');
assert.doesNotMatch(controllerSource + indexSource, /data-ph-save|data-ph-update|data-ph-select|data-ph-delete/, 'legacy pressure saved selectors are removed');

assert.match(controllerSource, /createLineSectionController/, 'saved records use the central line-section controller');
assert.match(controllerSource, /pressureHoldingSavedController\.renderCard/, 'saved records use the controller-owned panel renderer');
assert.match(controllerSource, /pressureHoldingSavedController\.bind/, 'saved records use the controller-owned bind path');
assert.match(controllerSource, /activePlantId/, 'active plant id is part of saved-record contract');
assert.match(controllerSource, /expandedPlantId/, 'expanded plant id is part of saved-record contract');

assert.match(resultsSource, /buildPressureHoldingResultModel/, 'result model builder exists');
assert.match(viewModelSource, /renderResultModel/, 'view model renders central result model');
assert.doesNotMatch(indexSource + viewModelSource + viewSource, /\bmainResult\b|\bresultCard\b|\bresultRows\b/, 'legacy result render helpers are not used in pressure-holding');

assert.match(indexSource, /createPressureHoldingDynamicRenderer/, 'pressure-holding delegates dynamic updates to platform dynamic renderer');
assert.match(dynamicSource, /export function createPressureHoldingDynamicRenderer/, 'platform exposes pressure-holding dynamic renderer');
assert.match(viewSource, /data-ph-dynamic="basis"/, 'basis dynamic island exists');
assert.match(viewSource, /data-ph-dynamic="volume-fields"/, 'volume dynamic island exists');
assert.match(viewSource, /data-ph-dynamic="pressure-fields"/, 'pressure dynamic island exists');
assert.match(viewSource, /data-ph-dynamic="saved-records"/, 'saved-record dynamic island exists');
assert.match(viewSource, /data-ph-dynamic="result"/, 'result dynamic island exists');
assert.doesNotMatch(indexSource + controllerSource + viewModelSource + viewSource, /querySelector|innerHTML\s*=/, 'module files do not own direct DOM patching');

const module = await import('../js/modules/pressure-holding/index.js');
const controller = await import('../js/modules/pressure-holding/controller.js');
const vm = await import('../js/modules/pressure-holding/viewModel.js');
const view = await import('../js/modules/pressure-holding/view.js');
const results = await import('../js/modules/pressure-holding/results.js');

assert.equal(typeof module.default.mount, 'function');
assert.equal(typeof controller.bindPressureHoldingActions, 'function');
assert.equal(typeof vm.createPressureHoldingViewModel, 'function');
assert.equal(typeof view.view, 'function');
assert.equal(typeof results.buildPressureHoldingResultModel, 'function');

console.log('pressure-holding phase20e hardening regression ok');
