import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/modules/heat-recovery/', import.meta.url);
const read = file => readFileSync(new URL(file, base), 'utf8');

const expectedFiles = ['config.js','schema.js','state.js','logic.js','results.js','controller.js','viewModel.js','view.js','dynamicRenderer.js','index.js'];
for (const file of expectedFiles) assert.ok(read(file).length > 0, `${file} must exist`);

const config = read('config.js');
assert.match(config, /phase-24c-platform-contract-finalization/);

const index = read('index.js');
assert.match(index, /createPlatformModule/);
assert.match(index, /dynamicRenderer\.js/);
assert.doesNotMatch(index, /mountModule|renderModuleShell|querySelector|mainResult|resultCard|resultRows/);
assert.ok(index.split('\n').length <= 25, 'index.js must remain a thin adapter');

const view = read('view.js');
assert.match(view, /renderView/);
assert.match(view, /renderModeCard/);
assert.match(view, /renderInputs/);
assert.match(view, /renderOutputs/);
assert.match(view, /renderSavedRecords/);
assert.doesNotMatch(view, /updateHeatRecoveryDynamic|isDynamicHeatRecoveryAction|calculate\(/);

const dynamicRenderer = read('dynamicRenderer.js');
assert.match(dynamicRenderer, /updateHeatRecoveryDynamic/);
assert.match(dynamicRenderer, /isDynamicHeatRecoveryAction/);
assert.match(dynamicRenderer, /createHeatRecoveryViewModel/);
assert.match(dynamicRenderer, /calculate/);
assert.doesNotMatch(dynamicRenderer, /renderModuleShell|createLineSectionController|mountModule/);

const controller = read('controller.js');
assert.match(controller, /createLineSectionController/);
assert.match(controller, /savedRltDevicePatch/);
assert.match(controller, /bindHeatRecoveryActions/);
assert.doesNotMatch(controller, /renderModuleShell|mainResult|resultCard|resultRows|data-rlt-save|data-rlt-update|data-rlt-select|data-rlt-delete/);

const viewModel = read('viewModel.js');
assert.match(viewModel, /createHeatRecoveryViewModel/);
assert.match(viewModel, /buildHeatRecoveryResultModel/);
assert.doesNotMatch(viewModel, /renderModuleShell|querySelector|createLineSectionController/);

const results = read('results.js');
assert.match(results, /buildHeatRecoveryResultModel/);
assert.match(results, /buildRltDeviceRecord/);
assert.match(results, /inferRltInputState/);
assert.doesNotMatch(results, /renderModuleShell|mountModule|querySelector/);

console.log('heat-recovery phase24c platform contract ok');
