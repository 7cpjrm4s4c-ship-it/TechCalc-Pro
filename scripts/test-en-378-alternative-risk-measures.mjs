import assert from 'node:assert/strict';

import {
  assessAlternativeRiskMeasures,
  calculateDilutionOpeningArea,
  calculateSimplifiedMechanicalVentilationFlow
} from '../js/modules/en-378-safety-check/alternativeRiskMeasures.js';
import { assessChargeLimit } from '../js/modules/en-378-safety-check/chargeLimitCalculation.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckResultModel } from '../js/modules/en-378-safety-check/results.js';

const baseState = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'yes',
  hasGasWarningSystem: 'yes',
  hasMachineryRoom: 'no',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  hasMechanicalVentilation: 'yes',
  hasVentilationOpenings: 'no',
  hasSafetyShutoffValves: 'no'
};

assert.equal(calculateDilutionOpeningArea({ chargeKg: 8, roomVolumeM3: 80, qlmvKgM3: 0.063 }), 0.00508);
assert.equal(calculateSimplifiedMechanicalVentilationFlow({ rclKgM3: 0.061 }), 163.9);

const rawChargeLimit = assessChargeLimit(baseState);
const alternativeAssessment = assessAlternativeRiskMeasures(baseState, rawChargeLimit);
assert.equal(alternativeAssessment.requiredMeasureCount, 1);
assert.equal(alternativeAssessment.selectedMeasureCount, 2);
assert.equal(alternativeAssessment.status, 'passed');
assert.ok(alternativeAssessment.requirements.some(item => item.title === 'mechanische Lüftung als alternative Vorkehrung'));

const calculation = calculate(baseState);
assert.equal(calculation.alternativeRiskMeasuresAssessment.status, 'passed');
assert.equal(calculation.chargeLimitAssessment.status, 'passed');
assert.equal(calculation.status, 'acceptable');
assert.ok(calculation.plannerGuidance.confirmedItems.some(item => item.title.includes('alternative')));

const resultModel = buildEN378SafetyCheckResultModel(baseState, calculation);
const c3ResultGroup = resultModel.groups.find(group => group.title === 'Alternative Vorkehrungen nach EN 378-1 C.3');
assert.ok(c3ResultGroup);
assert.ok(c3ResultGroup.rows.some(row => row.label === 'Erforderliche Mindestanzahl' && row.value === '1'));
assert.ok(c3ResultGroup.rows.some(row => row.label === 'Vereinfachter mechanischer Luftstrom' && row.value === '163,9'));
assert.equal(JSON.stringify(c3ResultGroup).includes('hasMechanicalVentilation'), false);

const deepestUndergroundState = {
  ...baseState,
  locationLevel: 'deepest-underground',
  hasMechanicalVentilation: 'yes',
  hasVentilationOpenings: 'no',
  hasSafetyShutoffValves: 'no',
  hasAlarm: 'no'
};
const deepestCalculation = calculate(deepestUndergroundState);
assert.equal(deepestCalculation.alternativeRiskMeasuresAssessment.requiredMeasureCount, 2);
assert.equal(deepestCalculation.alternativeRiskMeasuresAssessment.status, 'failed');
assert.equal(deepestCalculation.status, 'measures-required');
assert.ok(deepestCalculation.requiredMeasures.some(measure => measure.includes('weitere alternative Vorkehrung')));

const deepestResolved = calculate({
  ...deepestUndergroundState,
  hasVentilationOpenings: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes'
});
assert.equal(deepestResolved.alternativeRiskMeasuresAssessment.requiredMeasureCount, 2);
assert.equal(deepestResolved.alternativeRiskMeasuresAssessment.status, 'passed');
assert.equal(deepestResolved.chargeLimitAssessment.status, 'passed');

console.log('EN 378 alternative risk measure tests passed.');
