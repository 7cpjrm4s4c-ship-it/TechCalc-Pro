import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate } from '../js/modules/heat-recovery/logic.js';
import { state } from '../js/modules/heat-recovery/state.js';
import { buildRltDeviceRecord, inferRltInputState } from '../js/modules/heat-recovery/results.js';
import { savedRltDevicePatch, rltDeviceController, rltDeviceCard } from '../js/modules/heat-recovery/controller.js';
import { createHeatRecoveryViewModel } from '../js/modules/heat-recovery/viewModel.js';

const base = new URL('../js/modules/heat-recovery/', import.meta.url);
const read = file => readFileSync(new URL(file, base), 'utf8');
const projectStorage = readFileSync('js/core/projectStorage.js', 'utf8');

assert.match(read('config.js'), /phase-24d-hardening/, 'phase 24D status is declared');
assert.doesNotMatch(read('index.js'), /mountModule|renderModuleShell|querySelector|card\(|field\(|mainResult|resultCard|resultRows/, 'index remains a pure platform adapter');
assert.doesNotMatch(read('view.js'), /calculate\(|createLineSectionController|mountModule|mainResult|resultCard|resultRows/, 'view stays render-only');
assert.doesNotMatch(read('viewModel.js'), /querySelector|renderModuleShell|createLineSectionController|mountModule/, 'viewModel has no DOM/controller coupling');
assert.doesNotMatch(read('dynamicRenderer.js'), /renderModuleShell|createLineSectionController|mountModule|mainResult|resultCard|resultRows/, 'dynamic renderer stays platform-scoped');
assert.doesNotMatch(read('controller.js'), /data-rlt-save|data-rlt-update|data-rlt-select|data-rlt-delete|readRltDevices|writeRltDevices|rltDevicesMemory|bindRltDevices/, 'legacy RLT DOM/memory workflow is removed');
assert.match(read('controller.js'), /createLineSectionController\(\{/, 'controller uses platform line-section controller');
assert.match(read('controller.js'), /dynamicDataAttr:\s*['"]data-wrg-dynamic['"]/, 'saved-record island uses WRG dynamic attribute');

assert.match(projectStorage, /normalizeHeatRecoveryProjectModule/, 'project restore has heat-recovery compatibility normalizer');
assert.match(projectStorage, /savedRltDevices:\s*saved/, 'project restore writes normalized savedRltDevices into state');
assert.doesNotMatch(projectStorage, /readRltDevices|writeRltDevices|rltDevicesMemory/, 'project storage no longer imports legacy RLT memory helpers');

const wrgState = {
  mode: 'wrg',
  wrgVolumeFlowM3h: '2500',
  outdoorTemp: '-5',
  outdoorRh: '80',
  extractTemp: '22',
  extractRh: '45',
  efficiency: '75',
  bypassPercent: '10',
  activeRltDeviceName: 'RLT Büro',
  savedRltDevices: [],
  activeRltDeviceId: null,
  expandedRltDeviceId: null
};
const result = calculate(wrgState);
const record = buildRltDeviceRecord(wrgState, result, [], 'rlt-test', 'RLT Büro');
assert.equal(record.id, 'rlt-test');
assert.equal(record.name, 'RLT Büro');
assert.equal(record.state.savedRltDevices, undefined, 'record snapshot excludes saved list');
assert.equal(record.state.activeRltDeviceId, undefined, 'record snapshot excludes active id');
assert.equal(record.state.expandedRltDeviceId, undefined, 'record snapshot excludes expanded id');
assert.equal(inferRltInputState({ mode: 'Mischluft', state: {} }).mode, 'mixing', 'legacy mode label restores to mixing');

const legacyRecord = { id: 'legacy-rlt', name: 'Alt RLT', mode: 'Mischluft', inputState: { mixingOutdoorTemp: '-8', mixingRecircTemp: '20' } };
const hydrated = savedRltDevicePatch(legacyRecord, { rltDevices: [legacyRecord], savedRltDevices: [], expandedRltDeviceId: 'open' });
assert.equal(hydrated.activeRltDeviceId, 'legacy-rlt', 'legacy record hydrates active id');
assert.equal(hydrated.activeRltDeviceName, 'Alt RLT', 'legacy record hydrates display name');
assert.equal(hydrated.mode, 'mixing', 'legacy record infers mode');
assert.deepEqual(hydrated.savedRltDevices, [legacyRecord], 'legacy rltDevices restore as savedRltDevices');

const legacyCard = rltDeviceCard({ rltDevices: [legacyRecord], savedRltDevices: [], activeRltDeviceId: null, expandedRltDeviceId: null });
assert.match(legacyCard, /Alt RLT/, 'legacy RLT records render in saved-card compatibility path');
assert.match(legacyCard, /data-line-select/, 'saved records use platform selectors');
assert.doesNotMatch(legacyCard, /data-rlt-select|data-rlt-delete|data-rlt-save|data-rlt-update/, 'legacy RLT selectors are not rendered');

const vm = createHeatRecoveryViewModel(wrgState, result);
assert.equal(vm.isWrg, true, 'viewModel exposes WRG flag');
assert.equal(vm.resultModel.primary.primary.unit, 'kW', 'viewModel carries platform result model');
assert.equal(typeof rltDeviceController.read, 'function', 'line-section controller read is available for project storage');
assert.equal(typeof rltDeviceController.write, 'function', 'line-section controller write is available for project storage');

state.reset({ notify: false });
console.log('heat-recovery phase24d hardening regression ok');
