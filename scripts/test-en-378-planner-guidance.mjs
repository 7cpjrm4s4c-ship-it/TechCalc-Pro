import assert from 'node:assert/strict';

import { reportSections } from '../js/core/pdf/pdfDataMapping.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378PlannerGuidance } from '../js/modules/en-378-safety-check/plannerGuidance.js';
import { buildEN378SafetyCheckReportDto } from '../js/modules/en-378-safety-check/reportAdapter.js';
import { buildEN378SafetyCheckResultModel } from '../js/modules/en-378-safety-check/results.js';

const state = {
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
  hasEmergencyVentilation: 'no',
  hasEmergencyStopOutside: 'no',
  hasEmergencyStopInside: '',
  hasEmergencyLighting: 'yes',
  hasDetector: 'yes',
  hasAlarm: 'no',
  hasIndependentAlarmPower: 'no',
  hasExplosionProtectedElectricalEquipment: 'yes'
};

const calculation = calculate(state);
assert.equal(calculation.status, 'measures-required');
assert.ok(calculation.plannerGuidance);
assert.equal(calculation.plannerGuidance.status, 'measures-required');
assert.ok(calculation.plannerGuidance.failedCount >= 3);
assert.ok(calculation.plannerGuidance.openPointCount >= 1);
assert.ok(calculation.plannerGuidance.requiredMeasures.some(measure => measure.includes('Externen Not-Aus')));
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'ventilation'));
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'alarm'));
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'openPoints'));
assert.ok(calculation.plannerGuidance.missingInputs.includes('hasEmergencyStopInside'));

const rebuiltGuidance = buildEN378PlannerGuidance(state, {
  status: calculation.status,
  inputValidation: calculation.inputValidation,
  chargeLimitAssessment: calculation.chargeLimitAssessment,
  installationSafetyAssessment: calculation.installationSafetyAssessment
});
assert.deepEqual(rebuiltGuidance.requiredMeasures, calculation.plannerGuidance.requiredMeasures);

const resultModel = buildEN378SafetyCheckResultModel(state, calculation);
assert.ok(resultModel.groups.some(group => group.title === 'Planer-Leitfaden – Zusammenfassung'));
assert.ok(resultModel.groups.some(group => group.title === 'Planer-Leitfaden – Lüftung'));
assert.ok(resultModel.groups.some(group => group.title === 'Planer-Leitfaden – Alarmierung'));

const report = buildEN378SafetyCheckReportDto({
  state,
  calculation,
  generatedAt: '2026-09-01T00:00:00.000Z'
});
assert.equal(report.summary.plannerGuidanceHeadline, calculation.plannerGuidance.headline);
assert.equal(report.assessment.plannerGuidance.status, 'measures-required');
assert.ok(report.plannerGuidance.groups.length > 0);
assert.doesNotThrow(() => JSON.stringify(report));

const sections = reportSections({ reportSource: 'typed-dto', reportDto: report });
assert.ok(sections.some(section => section.title.includes('Planer-Leitfaden')));
assert.ok(sections.some(section => section.rows.some(row => String(row[1]).includes('Externen Not-Aus'))));

console.log('EN 378 planner guidance tests passed.');
