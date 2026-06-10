import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const base = new URL('../js/modules/heat-recovery/', import.meta.url);
const read = file => readFileSync(new URL(file, base), 'utf8');

for (const file of ['index.js', 'controller.js', 'view.js', 'viewModel.js', 'results.js', 'schema.js', 'state.js', 'logic.js', 'config.js']) {
  assert.ok(existsSync(new URL(file, base)), `${file} must exist`);
}

const index = read('index.js');
assert.match(index, /createPlatformModule/);
assert.doesNotMatch(index, /mountModule/);
assert.doesNotMatch(index, /renderModuleShell/);
assert.doesNotMatch(index, /mainResult|resultCard|resultRows/);
assert.ok(index.split('\n').length <= 25, 'index.js must stay adapter-sized');

const controller = read('controller.js');
assert.match(controller, /createLineSectionController/);
assert.match(controller, /savedRltDevices/);
assert.match(controller, /activeRltDeviceId/);
assert.match(controller, /expandedRltDeviceId/);
assert.doesNotMatch(controller, /data-rlt-/);

const state = read('state.js');
assert.match(state, /savedRltDevices/);
assert.match(state, /activeRltDeviceId/);
assert.match(state, /expandedRltDeviceId/);

const moduleText = ['index.js','controller.js','view.js','viewModel.js','results.js'].map(read).join('\n');
for (const legacy of ['rltDevicesMemory', 'readRltDevices', 'writeRltDevices', 'bindRltDevices', 'data-rlt-save', 'data-rlt-update', 'data-rlt-select', 'data-rlt-delete']) {
  assert.doesNotMatch(moduleText, new RegExp(legacy), `legacy token ${legacy} must be removed`);
}

const mod = await import(new URL('index.js', base));
assert.equal(mod.default.config.id, 'heat-recovery');
assert.equal(typeof mod.default.mount, 'function');
assert.equal(typeof mod.default.calculate, 'function');

console.log('heat-recovery phase24b1 platform mount + saved records ok');
