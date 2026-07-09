import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.document = { dispatchEvent() {}, activeElement: null };
globalThis.CustomEvent = class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };

const { state: mixedAirState } = await import('../js/modules/mixed-air/state.js');
const { calculate } = await import('../js/modules/mixed-air/logic.js');
const { buildMixedAirRecord, hydrateMixedAirRecord, mixedAirSaveCard } = await import('../js/modules/mixed-air/controller.js');
const { applyProjectData, collectProjectData, resetAllSessionData } = await import('../js/core/projectStorage.js');

const mixedView = readFileSync('js/modules/mixed-air/view.js', 'utf8');
assert.match(mixedView, /data-mixed-air-dynamic="saved-panel"/, 'mixed-air renders a save panel island');
assert.match(mixedAirSaveCard(mixedAirState.get()), /Mischluft speichern/, 'mixed-air exposes the save dialog/card');

const input = {
  mixingOutdoorVolumeFlowM3h: '8000',
  mixingOutdoorTemp: '-8',
  mixingOutdoorRh: '75',
  mixingRecircVolumeFlowM3h: '12000',
  mixingRecircTemp: '21',
  mixingRecircRh: '40'
};
const record = buildMixedAirRecord(input, calculate(input), [], 'mixed-1', 'Mischluft Alt');
assert.equal(record.name, 'Mischluft Alt');
assert.equal(record.inputState.mixingRecircTemp, '21');
const hydrated = hydrateMixedAirRecord(record, { savedMixedAirStates: [record] });
assert.equal(hydrated.activeMixedAirId, 'mixed-1');
assert.equal(hydrated.mixingOutdoorTemp, '-8');

resetAllSessionData();
applyProjectData({
  app: 'TechCalc Pro',
  format: 'techcalc-project',
  version: 1,
  modules: {
    wrg: {
      state: {
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
        savedRltDevices: [{ id: 'legacy-mix', name: 'Mischluft Bestand', mode: 'Mischluft', inputState: input }]
      }
    }
  }
});

assert.equal(mixedAirState.get().mixingOutdoorTemp, '-8', 'legacy wrg alias migrates input fields into mixed-air');
assert.equal(mixedAirState.get().savedMixedAirStates.length, 1, 'legacy mixed-air saved records migrate into mixed-air');
assert.equal(mixedAirState.get().savedMixedAirStates[0].name, 'Mischluft Bestand');

const project = collectProjectData();
assert.equal(project.modules['mixed-air'].state.mixingRecircTemp, '21', 'mixed-air input state is persisted');
assert.equal(project.modules['mixed-air'].state.savedMixedAirStates.length, 1, 'mixed-air saved records are persisted');

console.log('phase45c1 project lifecycle integration regression ok');
