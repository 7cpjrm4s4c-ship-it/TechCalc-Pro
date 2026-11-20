import assert from 'node:assert/strict';

import {
  assessAlternativeRiskMeasures,
  calculateDilutionOpeningArea,
  calculateSimplifiedMechanicalVentilationFlow
} from '../modules/en-378-safety-check/alternativeRiskMeasures.js';
import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';

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
assert.ok(alternativeAssessment.requirements.some(item => item.title === 'Mechanische Lüftung als alternative Vorkehrung'));

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

// C.3.1-Vorprüfungen als eigene Punkte mit Quellenangabe EN 378-1 C.3.1 (nicht stillschweigend)
const c31Requirements = calculation.installationSafetyAssessment.requirements.filter(item => item.id.startsWith('alternative-precautions.c3-1'));
assert.ok(c31Requirements.length >= 7, 'C.3.1-Vorprüfungen müssen als eigene Punkte ausgewiesen sein');
assert.ok(c31Requirements.every(item => item.source?.sourcePart === 'EN 378-1' && item.source?.sourceSection === 'C.3.1'));
const c31Class = c31Requirements.find(item => item.id === 'alternative-precautions.c3-1-refrigerant-class');
assert.equal(c31Class.status, 'passed', 'R-32 ist A2L -> C.3.1-Kältemittelbedingung erfüllt');
const c31Cap = c31Requirements.find(item => item.id === 'alternative-precautions.c3-1-charge-cap');
assert.equal(c31Cap.status, 'passed', '8 kg ≤ 1,5 × m3 (A2L)');
assert.equal(c31Cap.details.maximumChargeKg, 59.86, '1,5 × m3 = 1,5 × 130 × 0,307 = 59,865 kg (gerundet 59,86)');
const c31Location = c31Requirements.find(item => item.id === 'alternative-precautions.c3-1-installation-class');
assert.equal(c31Location.status, 'passed', 'Klasse I im Personen-Aufenthaltsbereich ist für C.3 zulässig');
for (const field of ['c3FactoryBuiltConnections', 'c3NoValvesOrConsumerConnections', 'c3PipingProtected', 'c3DoorsNotTightClosing']) {
  const item = c31Requirements.find(entry => entry.missingInputs.includes(field));
  assert.ok(item, `C.3.1-Feld ${field} muss als eigener Punkt mit missingInputs ausgewiesen sein`);
  assert.equal(item.status, 'required');
}
const c31Violation = calculate({ ...baseState, refrigerantId: 'R-290' });
const c31Failed = c31Violation.installationSafetyAssessment.requirements.find(item => item.id === 'alternative-precautions.c3-1-refrigerant-class');
assert.equal(c31Failed.status, 'failed', 'R-290 (A3) verletzt die C.3.1-Kältemittelbedingung');

// EN 378-3 Abschnitte 8 und 9: Maßnahme "Alarmierung" nur PASSED, wenn Auslösehardware
// (Gaswarnsystem oder Detektor) UND unabhängige Stromversorgung vorhanden sind.
const alarmPassed = alternativeAssessment.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.ok(alarmPassed, 'Alarmierungs-Maßnahme muss bewertet werden');
assert.equal(alarmPassed.status, 'passed', 'Gaswarnsystem + Detektor + unabhängige Stromversorgung -> PASSED');
assert.deepEqual(alarmPassed.missingInputs, []);

const alarmNoTriggerState = { ...baseState, hasGasWarningSystem: 'no', hasDetector: 'no', hasAlarm: 'yes', hasIndependentAlarmPower: 'yes' };
const alarmNoTrigger = assessAlternativeRiskMeasures(alarmNoTriggerState, assessChargeLimit(alarmNoTriggerState));
const alarmFailed = alarmNoTrigger.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.ok(alarmFailed);
assert.equal(alarmFailed.status, 'failed', 'Alarm ohne Gaswarnanlage und ohne Detektor darf nicht PASSED sein');
assert.deepEqual([...alarmFailed.missingInputs].sort(), ['hasDetector', 'hasGasWarningSystem']);

const alarmNoTriggerNoPowerState = { ...alarmNoTriggerState, hasIndependentAlarmPower: 'no' };
const alarmNoTriggerNoPower = assessAlternativeRiskMeasures(alarmNoTriggerNoPowerState, assessChargeLimit(alarmNoTriggerNoPowerState));
const alarmFailed2 = alarmNoTriggerNoPower.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.equal(alarmFailed2.status, 'failed');
assert.deepEqual([...alarmFailed2.missingInputs].sort(), ['hasDetector', 'hasGasWarningSystem', 'hasIndependentAlarmPower']);

const alarmDetectorOnlyState = { ...baseState, hasGasWarningSystem: 'no', hasDetector: 'yes', hasAlarm: 'yes', hasIndependentAlarmPower: 'yes' };
const alarmDetectorOnly = assessAlternativeRiskMeasures(alarmDetectorOnlyState, assessChargeLimit(alarmDetectorOnlyState));
const alarmPassed2 = alarmDetectorOnly.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.equal(alarmPassed2.status, 'passed', 'Detektor allein genügt als Auslösehardware');
assert.deepEqual(alarmPassed2.missingInputs, []);

console.log('EN 378 alternative risk measure tests passed.');
