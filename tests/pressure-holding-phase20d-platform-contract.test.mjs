import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexSource = fs.readFileSync('js/modules/pressure-holding/index.js', 'utf8');
const controllerSource = fs.readFileSync('js/modules/pressure-holding/controller.js', 'utf8');
const viewModelSource = fs.readFileSync('js/modules/pressure-holding/viewModel.js', 'utf8');
const viewSource = fs.readFileSync('js/modules/pressure-holding/view.js', 'utf8');
const configSource = fs.readFileSync('js/modules/pressure-holding/config.js', 'utf8');

assert.match(indexSource, /createPlatformModule\(\{/, 'index remains the platform adapter');
assert.match(indexSource, /bind:\s*root\s*=>\s*bindPressureHoldingActions/, 'index delegates binding to controller');
assert.doesNotMatch(indexSource, /function savedPlantSnapshot/);
assert.doesNotMatch(indexSource, /function view\(/);
assert.doesNotMatch(indexSource, /renderModuleShell/);
assert.doesNotMatch(indexSource, /createSavedRecordActions/);

assert.match(controllerSource, /createLineSectionController/, 'controller owns the central line-section saved-record controller');
assert.match(controllerSource, /export function bindPressureHoldingActions/, 'controller exports platform bind hook');
assert.match(controllerSource, /export function savedPlantsCard/, 'controller exports saved panel renderer for view/dynamic renderer');

assert.match(viewModelSource, /export function createPressureHoldingViewModel/, 'viewModel exports VM factory');
assert.match(viewModelSource, /export function resultContent/, 'viewModel owns result content adapter');
assert.match(viewSource, /export function view/, 'view exports render function');
assert.match(viewSource, /data-ph-dynamic="basis"/, 'view keeps dynamic island contract');
assert.match(configSource, /phase-20d-platform-contract/, 'migration status contains 20D marker');

const module = await import('../js/modules/pressure-holding/index.js');
const controller = await import('../js/modules/pressure-holding/controller.js');
const vm = await import('../js/modules/pressure-holding/viewModel.js');
const view = await import('../js/modules/pressure-holding/view.js');

assert.equal(typeof module.default.mount, 'function');
assert.equal(typeof controller.bindPressureHoldingActions, 'function');
assert.equal(typeof vm.createPressureHoldingViewModel, 'function');
assert.equal(typeof view.view, 'function');

console.log('pressure-holding-phase20d-platform-contract ok');
