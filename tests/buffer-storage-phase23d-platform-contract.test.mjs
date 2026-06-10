import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync('js/modules/buffer-storage/index.js', 'utf8');
const viewSource = readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const viewModelSource = readFileSync('js/modules/buffer-storage/viewModel.js', 'utf8');
const controllerSource = readFileSync('js/modules/buffer-storage/controller.js', 'utf8');
const resultsSource = readFileSync('js/modules/buffer-storage/results.js', 'utf8');
const configSource = readFileSync('js/modules/buffer-storage/config.js', 'utf8');

assert.match(configSource, /phase-23d-platform-contract-finalization/, 'phase 23D status is declared');
assert.match(indexSource, /createPlatformModule\(\{/, 'index remains the platform adapter');
assert.doesNotMatch(indexSource, /createBufferStorageDynamicRenderer|fmtInput|fmt\(|renderWithViewModel|function\s+updateBufferStorageDynamic/, 'index contains no dynamic renderer or formatting implementation');
assert.doesNotMatch(indexSource, /core\/renderer|platform\/dynamicRenderer|platform\/resultRenderer/, 'index imports no renderer platform internals');
assert.match(indexSource, /view:\s*renderView/, 'index delegates view rendering');
assert.match(indexSource, /bind:\s*bindBufferStorageActions/, 'index delegates controller binding');
assert.match(indexSource, /dynamicUpdate:\s*updateBufferStorageDynamic/, 'index delegates dynamic updates');
assert.match(indexSource, /isDynamicAction:\s*isDynamicBufferStorageAction/, 'index delegates dynamic action predicate');

assert.doesNotMatch(viewModelSource, /controller\.js|bufferSaveCard|renderModuleShell|card\(|field\(/, 'viewModel contains no controller dependency or renderer primitives');
assert.match(viewSource, /createBufferStorageDynamicRenderer\(\{/, 'view layer owns dynamic island rendering adapter');
assert.match(controllerSource, /createLineSectionController\(\{/, 'controller owns line-section saved-record integration');
assert.match(resultsSource, /buildBufferStorageResultModel/, 'results owns result model creation');

const moduleSources = `${indexSource}
${viewSource}
${viewModelSource}
${controllerSource}
${resultsSource}`;
assert.doesNotMatch(moduleSources, /mainResult|resultCard|resultRows|bindSavedRecordWorkflow|data-buffer-save|data-buffer-update|data-buffer-select|data-buffer-delete|mountModule\(/, 'legacy mount, result and saved-record paths stay removed');
assert.doesNotMatch(`${indexSource}\n${viewSource}\n${viewModelSource}\n${resultsSource}`, /savedCalculations|activeCalculationId/, 'legacy saved-record names are isolated away from adapter/view/viewModel/results');
assert.match(controllerSource, /savedCalculations/, 'legacy savedCalculations restore path remains controller-local');

console.log('buffer-storage phase23d platform contract regression ok');
