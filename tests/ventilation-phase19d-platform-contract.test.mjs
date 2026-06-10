import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync('js/modules/ventilation/index.js', 'utf8');
const controllerSource = readFileSync('js/modules/ventilation/controller.js', 'utf8');
const viewModelSource = readFileSync('js/modules/ventilation/viewModel.js', 'utf8');
const viewSource = readFileSync('js/modules/ventilation/view.js', 'utf8');
const projectStorageSource = readFileSync('js/core/projectStorage.js', 'utf8');
const configSource = readFileSync('js/modules/ventilation/config.js', 'utf8');

assert.match(configSource, /phase-19d-controller-viewmodel-view/, 'ventilation declares phase 19D contract split');
assert.match(indexSource, /createPlatformModule\(\{/, 'index keeps only the platform module mount contract');
assert.doesNotMatch(indexSource, /function savedVentilationPatch|function activeCalculationState|function view\(/, 'index no longer owns hydrator, view-model, or view implementation');
assert.match(controllerSource, /createLineSectionController\(\{/, 'controller owns saved-record platform integration');
assert.match(controllerSource, /createVentilationDynamicRenderer\(\{/, 'controller owns dynamic renderer adapter integration');
assert.match(viewModelSource, /export function activeCalculationState/, 'viewModel owns active calculation state mapping');
assert.match(viewModelSource, /export function savedVentilationPatch/, 'viewModel owns saved-record hydration');
assert.match(viewSource, /export function createVentilationView/, 'view owns module layout rendering');
assert.match(projectStorageSource, /ventilationLineSectionController\.read\(\)/, 'project storage reads ventilation line sections through controller contract');
assert.match(projectStorageSource, /ventilationLineSectionController\.write\(/, 'project storage writes ventilation line sections through controller contract');

const ventilationSources = `${indexSource}\n${controllerSource}\n${viewModelSource}\n${viewSource}\n${projectStorageSource}`;
assert.doesNotMatch(ventilationSources, /readVentilationLineSections|writeVentilationLineSections|bindVentilationLineSections|data-vent-line|vent-line:/, 'legacy ventilation saved-record paths are removed from the active contract');

console.log('ventilation phase19d platform contract regression ok');
