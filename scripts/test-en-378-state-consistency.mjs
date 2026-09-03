import assert from 'node:assert/strict';

import { calculate, normalizeEN378AssessmentState } from '../js/modules/en-378-safety-check/logic.js';
import { assessStateConsistency } from '../js/modules/en-378-safety-check/stateConsistency.js';
import { buildEN378SafetyCheckResultModel } from '../js/modules/en-378-safety-check/results.js';

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
assert.equal(machineryRoomState.hasMachineryRoom, 'yes');
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

console.log('EN 378 state consistency tests passed.');
