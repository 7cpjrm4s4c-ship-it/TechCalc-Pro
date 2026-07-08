import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.document = { dispatchEvent() {} };
globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };

const heatConfig = (await import('../js/modules/heat-recovery/config.js')).default;
const mixedConfig = (await import('../js/modules/mixed-air/config.js')).default;
const { calculate: calculateHeatRecovery } = await import('../js/modules/heat-recovery/logic.js');
const { calculate: calculateMixedAir } = await import('../js/modules/mixed-air/logic.js');
const { state: heatRecoveryState } = await import('../js/modules/heat-recovery/state.js');
const { state: mixedAirState } = await import('../js/modules/mixed-air/state.js');
const { applyProjectData, collectProjectData, resetAllSessionData } = await import('../js/core/projectStorage.js');

assert.equal(heatConfig.id, 'heat-recovery');
assert.equal(heatConfig.title, 'Wärmerückgewinnung');
assert.equal(mixedConfig.id, 'mixed-air');
assert.equal(mixedConfig.title, 'Mischluft');

const appSource = readFileSync('js/core/app.js', 'utf8');
assert.match(appSource, /mixedAirConfig/, 'mixed-air is registered for lazy loading');
assert.match(appSource, /\.\.\/modules\/mixed-air\/index\.js/, 'mixed-air module path is registered');

const heatResult = calculateHeatRecovery({
  mode: 'mixing',
  wrgVolumeFlowM3h: '2500',
  outdoorTemp: '-5',
  outdoorRh: '80',
  extractTemp: '22',
  extractRh: '45',
  efficiency: '75',
  bypassPercent: '10'
});
assert.equal(heatResult.mode, 'wrg', 'heat-recovery calculation is fixed to WRG after split');

const mixedResult = calculateMixedAir({
  mixingOutdoorVolumeFlowM3h: '8000',
  mixingOutdoorTemp: '-5',
  mixingOutdoorRh: '75',
  mixingRecircVolumeFlowM3h: '12000',
  mixingRecircTemp: '22',
  mixingRecircRh: '40'
});
assert.equal(mixedResult.mode, 'mixing', 'mixed-air calculation is fixed to Mischluft');
assert.ok(Number.isFinite(mixedResult.mixed.tempC), 'mixed-air returns a valid mixed temperature');

resetAllSessionData();
applyProjectData({
  app: 'TechCalc Pro',
  format: 'techcalc-project',
  version: 1,
  modules: {
    'heat-recovery': {
      state: {
        mode: 'mixing',
        wrgVolumeFlowM3h: '2500',
        outdoorTemp: '-5',
        outdoorRh: '80',
        extractTemp: '22',
        extractRh: '45',
        efficiency: '75',
        bypassPercent: '10',
        mixingOutdoorVolumeFlowM3h: '8000',
        mixingOutdoorTemp: '-8',
        mixingOutdoorRh: '75',
        mixingRecircVolumeFlowM3h: '12000',
        mixingRecircTemp: '21',
        mixingRecircRh: '40',
        savedRltDevices: [{ id: 'rlt-1', name: 'RLT Alt' }]
      }
    }
  }
});

assert.equal(heatRecoveryState.get().wrgVolumeFlowM3h, '2500', 'legacy WRG field remains in heat-recovery');
assert.equal(heatRecoveryState.get().mixingOutdoorTemp, undefined, 'legacy Mischluft field is not kept in heat-recovery state');
assert.equal(mixedAirState.get().mixingOutdoorTemp, '-8', 'legacy Mischluft field migrates to mixed-air');

const project = collectProjectData();
assert.ok(project.modules['heat-recovery'], 'project export contains heat-recovery');
assert.ok(project.modules['mixed-air'], 'project export contains mixed-air');
assert.equal(project.modules['mixed-air'].state.mixingRecircTemp, '21', 'project export persists mixed-air state separately');

console.log('phase45c modulsplitting implementation regression ok');
