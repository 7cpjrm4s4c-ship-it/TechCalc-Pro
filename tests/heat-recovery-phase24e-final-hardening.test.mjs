import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import module from '../js/modules/heat-recovery/index.js';
import config from '../js/modules/heat-recovery/config.js';
import schema from '../js/modules/heat-recovery/schema.js';
import { state } from '../js/modules/heat-recovery/state.js';
import { calculate } from '../js/modules/heat-recovery/logic.js';
import { createHeatRecoveryViewModel } from '../js/modules/heat-recovery/viewModel.js';
import { renderView, renderOutputs } from '../js/modules/heat-recovery/view.js';
import { buildHeatRecoveryResultModel } from '../js/modules/heat-recovery/results.js';
import { isDynamicHeatRecoveryAction, updateHeatRecoveryDynamic } from '../js/modules/heat-recovery/dynamicRenderer.js';
import { rltDeviceController, rltDeviceCard, savedRltDevicePatch } from '../js/modules/heat-recovery/controller.js';

const base = new URL('../js/modules/heat-recovery/', import.meta.url);
const read = file => readFileSync(new URL(file, base), 'utf8');
const projectStorage = readFileSync('js/core/projectStorage.js', 'utf8');

assert.match(read('config.js'), /phase-24e-final-hardening/, 'phase 24E status is declared');
assert.equal(config.id, 'heat-recovery', 'module config id remains stable');
assert.equal(module.config.id, 'heat-recovery', 'platform module exposes heat-recovery config');
assert.ok(Array.isArray(schema.fields), 'schema remains form-schema compatible');

const expectedFiles = ['config.js','schema.js','state.js','logic.js','results.js','controller.js','viewModel.js','view.js','dynamicRenderer.js','index.js'];
for (const file of expectedFiles) assert.ok(read(file).length > 0, `${file} must exist`);

const index = read('index.js');
assert.ok(index.split('\n').length <= 25, 'index.js remains a thin platform adapter');
assert.match(index, /createPlatformModule\(/, 'platform runtime is active');
assert.doesNotMatch(index, /mountModule|renderModuleShell|querySelector|addEventListener|mainResult|resultCard|resultRows|readRltDevices|writeRltDevices/, 'index has no legacy mount, DOM, or renderer code');

assert.doesNotMatch(read('view.js'), /calculate\(|querySelector|addEventListener|createLineSectionController|mountModule|mainResult|resultCard|resultRows|data-rlt-/, 'view stays render-only and legacy-selector-free');
assert.doesNotMatch(read('viewModel.js'), /querySelector|addEventListener|renderModuleShell|createLineSectionController|mountModule|data-rlt-/, 'viewModel has no DOM/controller coupling');
assert.doesNotMatch(read('dynamicRenderer.js'), /renderModuleShell|createLineSectionController|mountModule|mainResult|resultCard|resultRows|data-rlt-/, 'dynamic renderer has no legacy render or saved-record selectors');
assert.doesNotMatch(read('controller.js'), /data-rlt-save|data-rlt-update|data-rlt-select|data-rlt-delete|readRltDevices|writeRltDevices|rltDevicesMemory|bindRltDevices/, 'controller has no legacy RLT workflow');
assert.match(read('controller.js'), /createLineSectionController\(/, 'controller uses central line-section controller');
assert.match(read('results.js'), /buildHeatRecoveryResultModel/, 'result model builder is present');
assert.doesNotMatch(read('results.js'), /renderModuleShell|mountModule|querySelector|mainResult|resultCard|resultRows/, 'results file has no DOM or legacy renderer coupling');

assert.match(projectStorage, /normalizeHeatRecoveryProjectModule/, 'project storage keeps heat-recovery restore normalizer');
assert.match(projectStorage, /rltDeviceController\.read\(\)/, 'project collection uses central RLT controller read');
assert.match(projectStorage, /rltDeviceController\.write\(/, 'project restore uses central RLT controller write');
assert.doesNotMatch(projectStorage, /readRltDevices|writeRltDevices|rltDevicesMemory/, 'project storage has no legacy RLT memory helpers');

const wrgState = {
  mode: 'wrg',
  wrgVolumeFlowM3h: '25000',
  outdoorTemp: '-10',
  outdoorRh: '80',
  extractTemp: '22',
  extractRh: '45',
  efficiency: '72',
  bypassPercent: '0',
  activeRltDeviceName: 'RLT Dach',
  activeRltDeviceId: null,
  expandedRltDeviceId: null,
  savedRltDevices: []
};
const wrgResult = calculate(wrgState);
const wrgVm = createHeatRecoveryViewModel(wrgState, wrgResult);
assert.equal(wrgVm.isWrg, true, 'WRG viewModel flag is stable');
assert.equal(wrgVm.resultModel.primary.primary.unit, 'kW', 'WRG result model primary unit is kW');
assert.match(renderOutputs(wrgVm), /Rückgewonnene Leistung/, 'WRG outputs render via result model');
assert.match(renderView(wrgState), /wrg-desktop-split__output tc-stack/, 'output column uses global stack spacing');
assert.match(renderView(wrgState), /wrg-desktop-split__input tc-stack/, 'input column uses global stack spacing');

const mixingState = {
  ...wrgState,
  mode: 'mixing',
  mixingOutdoorVolumeFlowM3h: '8000',
  mixingOutdoorTemp: '-5',
  mixingOutdoorRh: '75',
  mixingRecircVolumeFlowM3h: '12000',
  mixingRecircTemp: '22',
  mixingRecircRh: '40'
};
const mixingResult = calculate(mixingState);
const mixingModel = buildHeatRecoveryResultModel(mixingState, mixingResult);
assert.equal(mixingModel.primary.primary.unit, '°C', 'Mischluft result model primary unit is °C');
assert.ok(mixingModel.groups.some(group => group.title === 'Außenluft'), 'Mischluft model includes outdoor group');

const legacyRecord = { id: 'legacy-rlt', name: 'Altgerät', mode: 'Mischluft', inputState: { mixingOutdoorTemp: '-8', mixingRecircTemp: '21' } };
const hydrated = savedRltDevicePatch(legacyRecord, { rltDevices: [legacyRecord], savedRltDevices: [] });
assert.equal(hydrated.mode, 'mixing', 'legacy RLT mode restores to internal mixing value');
assert.deepEqual(hydrated.savedRltDevices, [legacyRecord], 'legacy rltDevices are preserved as savedRltDevices');
assert.match(rltDeviceCard({ rltDevices: [legacyRecord], savedRltDevices: [] }), /data-line-select/, 'saved-card renders platform line-section selectors');
assert.equal(typeof rltDeviceController.read, 'function', 'line-section controller read is available');
assert.equal(typeof rltDeviceController.write, 'function', 'line-section controller write is available');

assert.equal(isDynamicHeatRecoveryAction({ action: 'initial' }), false, 'initial action is not dynamic');
assert.equal(isDynamicHeatRecoveryAction({ action: 'input:change' }), true, 'normal input actions are dynamic');
assert.equal(typeof updateHeatRecoveryDynamic, 'function', 'dynamic updater is exported');

state.reset({ notify: false });
console.log('heat-recovery phase24e final hardening regression ok');
