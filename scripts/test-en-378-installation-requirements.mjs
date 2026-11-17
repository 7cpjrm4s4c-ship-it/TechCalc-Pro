import assert from 'node:assert/strict';

import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import {
  assessInstallationSafetyRequirements,
  calculateAlternativeMechanicalVentilationFlow,
  calculateDetectorPreset,
  calculateDilutionOpeningArea,
  calculateMachineryRoomEmergencyVentilationFlow
} from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../modules/en-378-safety-check/reportAdapter.js';
import { getEN378SafetyData } from '../core/data/refrigerants.js';

const r32 = getEN378SafetyData('R-32');
assert.deepEqual(calculateMachineryRoomEmergencyVentilationFlow(8), { flowM3s: 0.056, flowM3h: 201.6 });
assert.equal(calculateAlternativeMechanicalVentilationFlow({ rclKgM3: 0.061 }), 163.9);
assert.equal(calculateDetectorPreset({ safetyData: r32 }), 0.07675);
assert.equal(calculateDilutionOpeningArea({ chargeKg: 4, roomVolumeM3: 50, qlmvKgM3: 0.063 }), 0.00406);

const machineryRoomState = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'machinery-room',
  installationClass: 'III',
  accessArea: 'authorized-access',
  accessCategory: 'c',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasMachineryRoom: 'yes',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomLargestSystemChargeKg: '8',
  hasMechanicalVentilation: 'yes',
  hasEmergencyVentilation: 'yes',
  hasEmergencyVentilationControlOutside: 'yes',
  hasEmergencyVentilationControlInside: 'yes',
  hasEmergencyStopOutside: 'yes',
  hasEmergencyStopInside: 'yes',
  hasEmergencyLighting: 'yes',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  hasExplosionProtectedElectricalEquipment: 'yes'
};
const machineryCharge = assessChargeLimit(machineryRoomState);
const machineryAssessment = assessInstallationSafetyRequirements(machineryRoomState, machineryCharge);
assert.ok(machineryAssessment.requirements.some(item => item.id === 'machinery-room.access-restricted'));
assert.ok(machineryAssessment.requirements.some(item => item.id === 'machinery-room.emergency-ventilation-flow'));
assert.ok(machineryAssessment.requirements.some(item => item.id === 'detector.flammable-classes'));
assert.equal(machineryAssessment.status, 'passed');

const missingMeasuresState = {
  ...machineryRoomState,
  hasMechanicalVentilation: 'no',
  hasEmergencyStopOutside: 'no',
  hasAlarm: 'no'
};
// Ensure machinery room risk analysis is set for missingMeasuresState
missingMeasuresState.machineryRoomRiskAnalysisStatus = 'present';
missingMeasuresState.machineryRoomRiskAnalysisResult = 'yes';
const missingAssessment = assessInstallationSafetyRequirements(missingMeasuresState, assessChargeLimit(missingMeasuresState));
assert.equal(missingAssessment.status, 'failed');
assert.ok(missingAssessment.requiredMeasures.some(item => item.includes('Externen Not-Aus')));

const r717State = {
  ...machineryRoomState,
  refrigerantId: 'R-717',
  chargeKg: '60',
  hasExplosionProtectedElectricalEquipment: 'yes',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes'
};
const r717Calculation = calculate(r717State);
assert.ok(r717Calculation.installationSafetyAssessment.requirements.some(item => item.id === 'detector.r717.thresholds'));
assert.ok(!r717Calculation.installationSafetyAssessment.requirements.some(item => item.id === 'detector.flammable-classes'));
const r717HighCharge = calculate({ ...r717State, chargeKg: '3001' });
assert.ok(r717HighCharge.installationSafetyAssessment.requirements.some(item => item.id === 'alarm.r717.central-station'));

const report = buildEN378SafetyCheckReportDto({
  state: machineryRoomState,
  calculation: calculate(machineryRoomState),
  generatedAt: '2026-09-01T00:00:00.000Z'
});
assert.ok(report.assessment.installationSafety.requirements.length > 0);
// Note: 'Sicherheitskomponenten nach EN 378-3' is a PDF section title, not a resultGroup
// Check that machinery room requirements are in the assessment
assert.ok(report.assessment.installationSafety.requirements.some(item => item.id === 'machinery-room.access-restricted'));
assert.doesNotThrow(() => JSON.stringify(report));

// Test: Machinery room requirements from EN 378-3 Section 5 should only appear
// when installationLocation === 'machinery-room' AND machineryRoomRiskAnalysisResult === 'yes'
// Per spec: docs/contracts/en378/machinery-room-risk-analysis.md, section 3

// Section 5 requirement IDs to check
const section5RequirementIds = [
  'machinery-room.access-restricted',
  'machinery-room.no-refrigerant-migration',
  'hasEmergencyStopInside',
  'hasEmergencyStopOutside',
  'hasMachineryRoomVentilation',
  'hasEmergencyVentilation',
  'machinery-room.emergency-ventilation-control-outside',
  'machinery-room.emergency-ventilation-control-inside',
  'machinery-room.emergency-ventilation-flow',
  'hasEmergencyLighting',
  'machinery-room.hazardous-area-classification',
  'hasExplosionProtectedElectricalEquipment'
];

// Test 1: With result 'yes', section 5 requirements MUST appear
const resultYesState = {
  ...machineryRoomState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes'
};
const resultYesAssessment = assessInstallationSafetyRequirements(resultYesState, assessChargeLimit(resultYesState));
for (const reqId of section5RequirementIds) {
  assert.ok(
    resultYesAssessment.requirements.some(item => item.id === reqId),
    `Requirement ${reqId} should appear when result is 'yes'`
  );
}
console.log('✓ Test: Section 5 requirements appear when result is yes');

// Test 2: With result '' (open), section 5 requirements should NOT appear
const resultOpenState = {
  ...machineryRoomState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: ''
};
const resultOpenAssessment = assessInstallationSafetyRequirements(resultOpenState, assessChargeLimit(resultOpenState));
for (const reqId of section5RequirementIds) {
  assert.ok(
    !resultOpenAssessment.requirements.some(item => item.id === reqId),
    `Requirement ${reqId} should NOT appear when result is open ('')`
  );
}
console.log('✓ Test: Section 5 requirements do NOT appear when result is open');

// Test 3: With result 'no', section 5 requirements should NOT appear
const resultNoState = {
  ...machineryRoomState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'no'
};
const resultNoAssessment = assessInstallationSafetyRequirements(resultNoState, assessChargeLimit(resultNoState));
for (const reqId of section5RequirementIds) {
  assert.ok(
    !resultNoAssessment.requirements.some(item => item.id === reqId),
    `Requirement ${reqId} should NOT appear when result is 'no'`
  );
}
console.log('✓ Test: Section 5 requirements do NOT appear when result is no');

// Test 4: With installationLocation 'occupied-space', section 5 requirements should NOT appear
const occupiedSpaceState = {
  ...machineryRoomState,
  installationLocation: 'occupied-space',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes'
};
const occupiedSpaceAssessment = assessInstallationSafetyRequirements(occupiedSpaceState, assessChargeLimit(occupiedSpaceState));
for (const reqId of section5RequirementIds) {
  assert.ok(
    !occupiedSpaceAssessment.requirements.some(item => item.id === reqId),
    `Requirement ${reqId} should NOT appear for occupied-space location`
  );
}
console.log('✓ Test: Section 5 requirements do NOT appear for occupied-space location');

// Test 5: Outdoor tests remain unchanged (outdoor location should still work)
const outdoorState = {
  ...machineryRoomState,
  installationLocation: 'outdoor',
  isOutdoorDefinitionConfirmed: 'yes',
  outdoorSafeArrangement: 'yes',
  outdoorPreventBuildingEntry: 'yes',
  hasOutdoorProtectiveCover: 'no'
};
const outdoorAssessment = assessInstallationSafetyRequirements(outdoorState, assessChargeLimit(outdoorState));
// Outdoor should have its own requirements but not section 5 machinery room requirements
for (const reqId of section5RequirementIds) {
  assert.ok(
    !outdoorAssessment.requirements.some(item => item.id === reqId),
    `Requirement ${reqId} should NOT appear for outdoor location`
  );
}
assert.ok(outdoorAssessment.requirements.some(item => item.id === 'outdoor.definition-confirmed'));
console.log('✓ Test: Outdoor requirements work correctly (section 5 requirements excluded)');

console.log('EN 378 installation safety requirement tests passed.');
