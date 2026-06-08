import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/modules/heat-recovery/', import.meta.url);
const read = file => readFileSync(new URL(file, base), 'utf8');

const config = read('config.js');
assert.match(config, /phase-24b3-dynamic-controller-hardening/);

const index = read('index.js');
assert.match(index, /createPlatformModule/);
assert.doesNotMatch(index, /mountModule|mainResult|resultCard|resultRows|querySelectorAll\('\[data-wrg-sign\]'\)/);
assert.ok(index.split('\n').length <= 25, 'index.js must remain a thin adapter');

const controller = read('controller.js');
assert.match(controller, /createLineSectionController/);
assert.match(controller, /bindWrgSignDelegation/);
assert.match(controller, /root\.addEventListener\('click'/);
assert.doesNotMatch(controller, /querySelectorAll\('\[data-wrg-sign\]'\)\.forEach/);
assert.doesNotMatch(controller, /data-rlt-save|data-rlt-update|data-rlt-select|data-rlt-delete/);

const view = read('view.js');
assert.match(view, /updateHeatRecoveryDynamic/);
assert.match(view, /data-wrg-dynamic="inputs"/);
assert.match(view, /data-wrg-dynamic="outputs"/);
assert.match(view, /data-wrg-dynamic="rlt-devices"/);
assert.doesNotMatch(view, /mainResult|resultCard|resultRows/);

const results = read('results.js');
assert.match(results, /buildHeatRecoveryResultModel/);
assert.match(results, /buildRltDeviceRecord/);
assert.match(results, /inferRltInputState/);
assert.doesNotMatch(results, /renderModuleShell|mountModule/);

const schema = read('schema.js');
for (const key of ['mixingOutdoorVolumeFlowM3h', 'mixingRecircVolumeFlowM3h', 'activeRltDeviceName']) {
  assert.match(schema, new RegExp(key));
}

const { calculate } = await import(new URL('logic.js', base));
const { buildRltDeviceRecord, inferRltInputState } = await import(new URL('results.js', base));

const state = {
  mode: 'mixing',
  mixingOutdoorVolumeFlowM3h: '500',
  mixingOutdoorTemp: '-5',
  mixingOutdoorRh: '80',
  mixingRecircVolumeFlowM3h: '1500',
  mixingRecircTemp: '22',
  mixingRecircRh: '45',
  savedRltDevices: [{ id: 'keep' }],
  activeRltDeviceId: 'active',
  activeRltDeviceName: 'Test',
  expandedRltDeviceId: 'active'
};
const result = calculate(state);
const record = buildRltDeviceRecord(state, result, [], 'rlt-test', 'RLT Test');
assert.equal(record.mode, 'Mischluft');
assert.equal(record.state.activeRltDeviceId, undefined);
assert.equal(record.state.savedRltDevices, undefined);
assert.equal(record.inputState.expandedRltDeviceId, undefined);
assert.equal(inferRltInputState({ mode: 'Mischluft', inputState: {} }).mode, 'mixing');
assert.equal(inferRltInputState({ mode: 'WRG', inputState: {} }).mode, 'wrg');

console.log('heat-recovery phase24b3 dynamic controller hardening ok');
