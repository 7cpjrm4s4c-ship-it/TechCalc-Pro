import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = new URL('../js/modules/heat-recovery/', import.meta.url);
const read = file => readFileSync(new URL(file, base), 'utf8');

const config = read('config.js');
assert.match(config, /phase-24b2-result-renderer-dynamic-islands/);

const index = read('index.js');
assert.match(index, /createPlatformModule/);
assert.match(index, /dynamicUpdate/);
assert.match(index, /isDynamicAction/);
assert.doesNotMatch(index, /mainResult|resultCard|resultRows|mountModule/);
assert.ok(index.split('\n').length <= 25, 'index.js must remain adapter-sized');

const results = read('results.js');
assert.match(results, /buildHeatRecoveryResultModel/);
assert.match(results, /primary:/);
assert.match(results, /groups:/);
assert.match(results, /notices:/);
assert.doesNotMatch(results, /mainResult|resultCard|resultRows|renderModuleShell/);

const viewModel = read('viewModel.js');
assert.match(viewModel, /resultModel: buildHeatRecoveryResultModel/);
assert.doesNotMatch(viewModel, /renderResultModel|mainResult|resultCard|resultRows/);

const view = read('view.js');
assert.match(view, /renderResultModel/);
assert.match(view, /data-wrg-dynamic="outputs"/);
assert.match(view, /data-wrg-dynamic="inputs"/);
assert.match(view, /data-wrg-dynamic="rlt-devices"/);
assert.doesNotMatch(view, /mainResult|resultCard|resultRows/);

const { calculate } = await import(new URL('logic.js', base));
const { buildHeatRecoveryResultModel } = await import(new URL('results.js', base));
const { createHeatRecoveryViewModel } = await import(new URL('viewModel.js', base));

const wrgState = {
  mode: 'wrg',
  wrgVolumeFlowM3h: '1000',
  outdoorTemp: '-5',
  outdoorRh: '80',
  extractTemp: '22',
  extractRh: '45',
  efficiency: '80',
  bypassPercent: '0'
};
const wrgResult = calculate(wrgState);
const wrgModel = buildHeatRecoveryResultModel(wrgState, wrgResult, 'cyan');
assert.equal(wrgModel.primary.title, 'WRG-Leistung');
assert.ok(wrgModel.groups.some(group => group.title === 'Zuluft'));
assert.ok(wrgModel.groups.some(group => group.title === 'Fortluft'));

const mixingState = {
  mode: 'mixing',
  mixingOutdoorVolumeFlowM3h: '500',
  mixingOutdoorTemp: '0',
  mixingOutdoorRh: '90',
  mixingRecircVolumeFlowM3h: '1500',
  mixingRecircTemp: '22',
  mixingRecircRh: '40'
};
const mixingVm = createHeatRecoveryViewModel(mixingState);
assert.equal(mixingVm.resultModel.primary.title, 'Ergebnis Mischluft');
assert.ok(mixingVm.resultModel.groups.some(group => group.title === 'Mischungsverhältnis'));

console.log('heat-recovery phase24b2 result renderer + dynamic islands ok');
