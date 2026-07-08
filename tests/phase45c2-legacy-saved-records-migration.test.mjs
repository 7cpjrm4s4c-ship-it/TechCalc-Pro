import assert from 'node:assert/strict';

const local = new Map();
const session = new Map();
globalThis.localStorage = {
  getItem: key => local.get(key) ?? null,
  setItem: (key, value) => local.set(key, String(value)),
  removeItem: key => local.delete(key)
};
globalThis.sessionStorage = {
  getItem: key => session.get(key) ?? null,
  setItem: (key, value) => session.set(key, String(value)),
  removeItem: key => session.delete(key)
};
globalThis.document = { dispatchEvent() {} };
globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };

const { applyProjectData, collectProjectData, resetAllSessionData } = await import('../js/core/projectStorage.js');
const { state: heatRecoveryState } = await import('../js/modules/heat-recovery/state.js');
const { state: mixedAirState } = await import('../js/modules/mixed-air/state.js');
const { rltDeviceController } = await import('../js/modules/heat-recovery/controller.js');

resetAllSessionData();

const legacyMixedInput = {
  mixingOutdoorVolumeFlowM3h: '10000',
  mixingOutdoorTemp: '-12',
  mixingOutdoorRh: '90',
  mixingRecircVolumeFlowM3h: '15000',
  mixingRecircTemp: '21',
  mixingRecircRh: '60'
};
const legacyWrgInput = {
  wrgVolumeFlowM3h: '25000',
  outdoorTemp: '-12',
  outdoorRh: '90',
  extractTemp: '21',
  extractRh: '60',
  efficiency: '72',
  bypassPercent: '0'
};

applyProjectData({
  modules: {
    wrg: {
      state: {
        ...legacyMixedInput,
        ...legacyWrgInput,
        savedRltDevices: [
          { id: 'legacy-mix-no-mode', name: 'Test RLT01', inputState: legacyMixedInput },
          { id: 'legacy-wrg', name: 'Test RLT02', mode: 'WRG', inputState: legacyWrgInput }
        ]
      }
    }
  }
});

const heat = heatRecoveryState.get();
const mixed = mixedAirState.get();

assert.equal(mixed.mixingOutdoorTemp, '-12', 'legacy Mischluft inputs migrate to mixed-air');
assert.equal(mixed.savedMixedAirStates.length, 1, 'unlabelled legacy Mischluft saved record migrates to mixed-air');
assert.equal(mixed.savedMixedAirStates[0].id, 'legacy-mix-no-mode');
assert.equal(mixed.savedMixedAirStates[0].name, 'Test RLT01');
assert.equal(mixed.savedMixedAirStates[0].mode, 'Mischluft');
assert.equal(heat.savedRltDevices.length, 1, 'heat-recovery keeps only WRG records');
assert.equal(heat.savedRltDevices[0].id, 'legacy-wrg');
assert.deepEqual(rltDeviceController.read().map(item => item.id), ['legacy-wrg'], 'WRG record controller store is filtered');

const serialized = collectProjectData();
assert.deepEqual(serialized.modules['heat-recovery'].rltDevices.map(item => item.id), ['legacy-wrg']);
assert.deepEqual(serialized.modules['mixed-air'].state.savedMixedAirStates.map(item => item.id), ['legacy-mix-no-mode']);
