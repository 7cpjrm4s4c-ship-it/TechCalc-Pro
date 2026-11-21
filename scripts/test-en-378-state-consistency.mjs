import assert from 'node:assert/strict';

import { calculate, normalizeEN378AssessmentState } from '../modules/en-378-safety-check/logic.js';
import { assessStateConsistency } from '../modules/en-378-safety-check/stateConsistency.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';

const baseState = {
  refrigerantId: 'R-513A',
  chargeKg: '24.4',
  roomVolumeM3: '6000',
  installationLocation: 'occupied-space',
  installationClass: 'II',
  accessArea: 'general-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'no'
};

const inconsistent = calculate(baseState);
assert.equal(inconsistent.stateConsistencyAssessment.status, 'failed');
assert.equal(inconsistent.status, 'measures-required');
assert.ok(inconsistent.requiredMeasures.some(measure => measure.includes('Aufstellort auf Maschinenraum oder Außenaufstellung')));

const resultModel = buildEN378SafetyCheckResultModel(baseState, inconsistent);
const consistencyGroup = resultModel.groups.find(group => group.title === 'Plausibilitätsprüfung der Eingaben');
assert.ok(consistencyGroup);
assert.equal(JSON.stringify(consistencyGroup).includes('state-consistency'), false);
assert.ok(JSON.stringify(consistencyGroup).includes('Klasse II mit Aufstellort abgleichen'));

const machineryRoomState = normalizeEN378AssessmentState({
  ...baseState,
  installationLocation: 'machinery-room',
  installationClass: 'II',
  accessArea: 'authorized-access'
});
const machineryRoomConsistency = assessStateConsistency(machineryRoomState);
assert.equal(machineryRoomConsistency.status, 'passed');

const machineryRoomPublicAccess = calculate({
  ...baseState,
  installationLocation: 'machinery-room',
  installationClass: 'II',
  accessArea: 'general-access'
});
assert.equal(machineryRoomPublicAccess.stateConsistencyAssessment.status, 'failed');
assert.ok(machineryRoomPublicAccess.requiredMeasures.some(measure => measure.includes('Zugangsbereich auf Zugang nur für unterwiesene oder befugte Personen')));

const ventilationContradiction = calculate({
  ...baseState,
  installationLocation: 'machinery-room',
  installationClass: 'II',
  accessArea: 'authorized-access',
  ventilationType: 'none',
  hasMechanicalVentilation: 'yes'
});
assert.equal(ventilationContradiction.stateConsistencyAssessment.status, 'failed');
assert.ok(ventilationContradiction.requiredMeasures.some(measure => measure.includes('Lüftungsart und Angabe zur mechanischen Lüftung')));

// Klasse IV (belüftetes Gehäuse) ist nur im Personen-Aufenthaltsbereich bzw. als Aufstellort "belüftetes Gehäuse" zulässig
const classIvEnclosure = assessStateConsistency({ ...baseState, installationLocation: 'ventilated-enclosure', installationClass: 'IV' });
assert.equal(classIvEnclosure.status, 'passed', 'Klasse IV mit Aufstellort belüftetes Gehäuse ist konsistent');
const classIvOutdoor = assessStateConsistency({ ...baseState, installationLocation: 'outdoor', installationClass: 'IV' });
assert.equal(classIvOutdoor.status, 'failed');
assert.ok(classIvOutdoor.requirements.some(item => item.id === 'state-consistency.class-iv-location'));
const classIvOccupied = assessStateConsistency({ ...baseState, installationLocation: 'occupied-space', installationClass: 'IV' });
assert.equal(classIvOccupied.status, 'passed', 'Klasse IV im Personen-Aufenthaltsbereich bleibt zulässig');

// EN 378-3 Abschnitte 8 und 9: Alarmierung ohne Gaswarnanlage und ohne Detektor ist ein
// Konflikt (keine Auslösehardware vorhanden) und darf nicht zur Gesamtbewertung "acceptable" führen.
const alarmNoHardwareState = {
  ...baseState,
  installationLocation: 'occupied-space',
  installationClass: 'I',
  hasGasWarningSystem: 'no',
  hasDetector: 'no',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes'
};
const alarmNoHardware = assessStateConsistency(alarmNoHardwareState);
assert.equal(alarmNoHardware.status, 'failed');
assert.ok(alarmNoHardware.requirements.some(item => item.id === 'state-consistency.alarm-without-trigger-hardware'));

const alarmNoHardwareCalc = calculate(alarmNoHardwareState);
assert.equal(alarmNoHardwareCalc.stateConsistencyAssessment.status, 'failed');
assert.notEqual(alarmNoHardwareCalc.status, 'acceptable', 'Gesamtbewertung darf bei Alarm ohne Auslösehardware nicht "acceptable" sein');
const triggerHardware = alarmNoHardwareCalc.installationSafetyAssessment.requirements.find(item => item.id === 'alarm.trigger-hardware');
assert.ok(triggerHardware, 'Alarmblock muss Auslösehardware-Prüfung enthalten');
assert.equal(triggerHardware.status, 'failed');
assert.equal(triggerHardware.source.sourcePart, 'EN 378-3');
assert.equal(triggerHardware.source.sourceSection, '8 und 9');
assert.deepEqual([...triggerHardware.missingInputs].sort(), ['hasDetector', 'hasGasWarningSystem']);

// Positivfall: Detektor als Auslösehardware -> konsistent, kein Konflikt
const alarmWithDetector = assessStateConsistency({ ...alarmNoHardwareState, hasDetector: 'yes' });
assert.equal(alarmWithDetector.status, 'passed');
const alarmWithGasWarning = assessStateConsistency({ ...alarmNoHardwareState, hasGasWarningSystem: 'yes' });
assert.equal(alarmWithGasWarning.status, 'passed');
// Nur unabhängige Alarmstromversorgung ohne Auslösehardware -> ebenfalls Konflikt
const powerOnly = assessStateConsistency({ ...alarmNoHardwareState, hasAlarm: 'no', hasIndependentAlarmPower: 'yes' });
assert.equal(powerOnly.status, 'failed');
assert.ok(powerOnly.requirements.some(item => item.id === 'state-consistency.alarm-without-trigger-hardware'));

// EN 378-3, 4.5 (M1): nicht abgeschlossener technischer Raum + ausgefüllte 4.5-Detailfelder -> Konflikt
const redirectConflict = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'I',
  technicalRoomSeparatedFromOccupiedSpaces: 'no',
  technicalRoomContainsCompressorOrPressureVessel: 'yes',
  technicalRoomExhaustHoodFlowRateM3s: '0.2'
});
assert.equal(redirectConflict.status, 'failed');
assert.ok(redirectConflict.requirements.some(item => item.id === 'state-consistency.technical-room-details-in-redirect'));
const redirectClean = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'I',
  technicalRoomSeparatedFromOccupiedSpaces: 'no'
});
assert.equal(redirectClean.status, 'passed', 'Umleitungsfall 4.4 ohne Detailfelder ist konsistent');
const separatedOk = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'I',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'no',
  technicalRoomComponentsHaveDetachableJoints: 'yes',
  technicalRoomExhaustHoodFlowRateM3s: '0.2'
});
assert.equal(separatedOk.status, 'passed', 'abgeschlossener Raum mit 4.5-Details ist konsistent');

console.log('EN 378 state consistency tests passed.');
