import assert from 'node:assert/strict';

import { assessChargeLimit } from '../js/modules/en-378-safety-check/chargeLimitCalculation.js';
import {
  assessInstallationSafetyRequirements,
  calculateAlternativeMechanicalVentilationFlow,
  calculateDetectorPreset,
  calculateDilutionOpeningArea,
  calculateMachineryRoomEmergencyVentilationFlow
} from '../js/modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../js/modules/en-378-safety-check/reportAdapter.js';
import { getEN378SafetyData } from '../js/utils/refrigerants/index.js';

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
  installationClass: 'II',
  accessArea: 'authorized-access',
  accessCategory: 'c',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasMachineryRoom: 'yes',
  hasMechanicalVentilation: 'yes',
  hasEmergencyVentilation: 'yes',
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
const missingAssessment = assessInstallationSafetyRequirements(missingMeasuresState, assessChargeLimit(missingMeasuresState));
assert.equal(missingAssessment.status, 'failed');
assert.ok(missingAssessment.requiredMeasures.some(item => item.includes('Externen Not-Aus')));

const r717State = {
  ...machineryRoomState,
  refrigerantId: 'R-717',
  chargeKg: '60',
  hasExplosionProtectedElectricalEquipment: 'yes'
};
const r717Calculation = calculate(r717State);
assert.ok(r717Calculation.installationSafetyAssessment.requirements.some(item => item.id === 'detector.r717.thresholds'));

const report = buildEN378SafetyCheckReportDto({
  state: machineryRoomState,
  calculation: calculate(machineryRoomState),
  generatedAt: '2026-09-01T00:00:00.000Z'
});
assert.ok(report.assessment.installationSafety.requirements.length > 0);
assert.ok(report.resultGroups.some(group => group.title === 'Sicherheitskomponenten nach EN 378-3'));
assert.doesNotThrow(() => JSON.stringify(report));

console.log('EN 378 installation safety requirement tests passed.');
