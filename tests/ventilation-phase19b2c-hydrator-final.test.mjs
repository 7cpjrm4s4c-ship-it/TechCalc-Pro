import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/ventilation/viewModel.js', import.meta.url), 'utf8');
const configSource = readFileSync(new URL('../js/modules/ventilation/config.js', import.meta.url), 'utf8');

const { savedVentilationPatch } = await import('../js/modules/ventilation/viewModel.js');

assert.match(configSource, /phase-19b2c-hydrator-final/, 'ventilation declares phase 19B.2C hydrator finalization');

const coolingPatch = savedVentilationPatch({
  id: 'vent-001',
  name: 'Zuluft Büro Nord',
  modeLabel: 'Kälte',
  powerKw: '2,50',
  volumeFlowM3h: '750',
  supplyTemp: '16',
  roomTemp: '26',
  inputState: {
    mode: 'cooling',
    calcTarget: 'volumeFlow',
    powerW: '',
    powerUnit: 'W',
    volumeFlowM3h: '750',
    supplyTemp: '16',
    roomTemp: '26'
  }
}, { mode: 'heating', coolingCalcTarget: 'power' });

assert.equal(coolingPatch.mode, 'cooling', 'cooling record restores cooling mode');
assert.equal(coolingPatch.coolingCalcTarget, 'volumeFlow', 'cooling calcTarget is restored on active prefix');
assert.equal(coolingPatch.coolingPowerW, '2.5', 'cooling power falls back to stored result when target is not power');
assert.equal(coolingPatch.coolingPowerUnit, 'kW', 'cooling power unit follows result fallback when power input is empty');
assert.equal(coolingPatch.coolingVolumeFlowM3h, '750', 'cooling volume flow is restored');
assert.equal(coolingPatch.coolingSupplyTemp, '16', 'cooling supply temperature is restored');
assert.equal(coolingPatch.coolingRoomTemp, '26', 'cooling room temperature is restored');
assert.equal(coolingPatch.activeVentLineSectionId, 'vent-001', 'active ventilation record id is set');
assert.equal(coolingPatch.activeVentLineSectionName, 'Zuluft Büro Nord', 'active ventilation record name is set');
assert.equal(coolingPatch.heatingCalcTarget, undefined, 'cooling load does not mutate heating target');

const heatingPatch = savedVentilationPatch({
  id: 'vent-002',
  name: '',
  modeLabel: 'Heizung',
  powerKw: '1,20',
  volumeFlowM3h: '210',
  supplyTemp: '40',
  roomTemp: '20',
  inputState: {
    mode: 'heating',
    calcTarget: 'power',
    powerW: '1200',
    powerUnit: 'W',
    volumeFlowM3h: '',
    supplyTemp: '40',
    roomTemp: '20'
  }
}, { mode: 'cooling', heatingCalcTarget: 'deltaT' });

assert.equal(heatingPatch.mode, 'heating', 'heating record restores heating mode');
assert.equal(heatingPatch.heatingCalcTarget, 'power', 'heating calcTarget is restored on active prefix');
assert.equal(heatingPatch.heatingPowerW, '1200', 'heating power input is restored');
assert.equal(heatingPatch.heatingPowerUnit, 'W', 'heating power unit is restored');
assert.equal(heatingPatch.heatingVolumeFlowM3h, '210', 'heating volume flow falls back to stored result');
assert.equal(heatingPatch.heatingSupplyTemp, '40', 'heating supply temperature is restored');
assert.equal(heatingPatch.heatingRoomTemp, '20', 'heating room temperature is restored');
assert.equal(heatingPatch.activeVentLineSectionId, 'vent-002', 'active ventilation record id is set for heating');
assert.equal(heatingPatch.activeVentLineSectionName, '', 'active ventilation record name falls back to empty string');
assert.equal(heatingPatch.coolingCalcTarget, undefined, 'heating load does not mutate cooling target');

assert.match(source, /`\$\{prefix\}CalcTarget`/, 'hydrator writes calcTarget to active prefix');
assert.match(source, /activeVentLineSectionId:\s*item\.id/, 'hydrator sets active ventilation section id');
assert.match(source, /activeVentLineSectionName:\s*item\.name \|\| ''/, 'hydrator sets active ventilation section name');

console.log('ventilation phase19b2c hydrator final regression ok');
