import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync('js/modules/buffer-storage/index.js', 'utf8');
const viewSource = readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const viewModelSource = readFileSync('js/modules/buffer-storage/viewModel.js', 'utf8');
const controllerSource = readFileSync('js/modules/buffer-storage/controller.js', 'utf8');
const resultsSource = readFileSync('js/modules/buffer-storage/results.js', 'utf8');
const configSource = readFileSync('js/modules/buffer-storage/config.js', 'utf8');

assert.match(configSource, /phase-23d-platform-contract-finalization/, 'buffer-storage declares phase 23D contract finalization');
assert.match(indexSource, /createPlatformModule\(\{/, 'index keeps the platform module adapter contract');
assert.doesNotMatch(indexSource, /createBufferStorageDynamicRenderer\(\{/, 'index no longer owns dynamic renderer wiring');
assert.match(viewSource, /createBufferStorageDynamicRenderer\(\{/, 'view owns dynamic island renderer wiring');
assert.doesNotMatch(indexSource, /function\s+(runtimeInputs|defrostInputs|reserveInputs|inputBlocks|mediumContent|resultContent|view)\b/, 'index no longer owns rendering functions');
assert.doesNotMatch(indexSource, /from '..\/..\/core\/renderer\.js'/, 'index no longer imports renderer primitives');
assert.doesNotMatch(indexSource, /renderModuleShell|card\(|field\(|selectField\(|segmented\(|inlineStats/, 'index contains no direct UI composition');

assert.match(viewModelSource, /export function createBufferStorageViewModel/, 'viewModel owns composed buffer-storage render data');
assert.match(viewModelSource, /runtimeFieldModels/, 'viewModel owns runtime field models');
assert.match(viewModelSource, /defrostFieldModels/, 'viewModel owns defrost field models');
assert.match(viewModelSource, /reserveFieldModels/, 'viewModel owns reserve field models');
assert.match(viewSource, /export function renderView/, 'view owns module layout rendering');
assert.match(viewSource, /renderMediumContent/, 'view owns medium island rendering');
assert.match(viewSource, /renderInputBlocks/, 'view owns input island rendering');
assert.match(viewSource, /renderResultContent/, 'view owns result island rendering');
assert.match(controllerSource, /createLineSectionController\(\{/, 'controller owns saved-record platform integration');
assert.match(resultsSource, /buildBufferStorageResultModel/, 'results owns result-model generation');

const activeModuleSources = `${indexSource}\n${viewSource}\n${viewModelSource}\n${controllerSource}\n${resultsSource}`;
assert.doesNotMatch(activeModuleSources, /mainResult|resultCard|resultRows|bindSavedRecordWorkflow|data-buffer-save|data-buffer-update|data-buffer-select|data-buffer-delete|mountModule\(/, 'legacy mount, saved-record and result renderer paths are removed');

console.log('buffer-storage phase23d platform contract regression ok');
