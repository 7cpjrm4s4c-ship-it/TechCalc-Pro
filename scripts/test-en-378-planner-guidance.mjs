import assert from 'node:assert/strict';

import { reportSections } from '../core/pdf/pdfDataMapping.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { buildEN378PlannerGuidance } from '../modules/en-378-safety-check/plannerGuidance.js';
import { buildEN378SafetyCheckReportDto } from '../modules/en-378-safety-check/reportAdapter.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';

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
  machineryRoomLargestSystemChargeKg: '6',
  hasEmergencyVentilationControlInside: 'no',
  hasEmergencyVentilationControlOutside: 'yes',
  hasEmergencyStopOutside: 'no',
  hasEmergencyStopInside: '',
  hasEmergencyLighting: 'yes',
  hasDetector: 'yes',
  hasAlarm: 'no',
  hasIndependentAlarmPower: 'no',
  hasExplosionProtectedElectricalEquipment: 'yes',
  outdoorVentilationGeneralConfirmed: 'yes',
  outdoorMechanicalVentilationOpeningsConfirmed: 'no'
};

const calculation = calculate(state);
assert.equal(calculation.status, 'measures-required');
assert.ok(calculation.plannerGuidance);
assert.equal(calculation.plannerGuidance.status, 'measures-required');
assert.ok(calculation.plannerGuidance.failedCount >= 3);
const emergencyFlow = calculation.installationSafetyAssessment.requirements.find(item => item.id === 'machinery-room.emergency-ventilation-flow');
assert.equal(emergencyFlow.source.sourceSection, '5.13.4');
assert.equal(emergencyFlow.details.largestSystemChargeKg, 6);
assert.equal(emergencyFlow.details.fifteenAirChangesPerHourM3h, 1200);
assert.ok(calculation.installationSafetyAssessment.requirements.some(item => item.id === 'machinery-room.emergency-ventilation-control-inside' && item.status === 'failed'));
assert.ok(calculation.installationSafetyAssessment.requirements.some(item => item.id === 'machinery-room.emergency-ventilation-control-outside' && item.status === 'passed'));
assert.ok(calculation.plannerGuidance.openPointCount >= 1);
assert.ok(calculation.plannerGuidance.requiredMeasures.some(measure => measure.includes('Externen Not-Aus')));
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'ventilation'));
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'alarm'));
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'openPoints'));
assert.ok(calculation.plannerGuidance.missingInputs.includes('Not-Aus innen'));
assert.equal(JSON.stringify(calculation.plannerGuidance).includes('hasEmergencyStopInside'), false);

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
assert.equal(JSON.stringify(resultModel).includes('not-assessed'), false);

const report = buildEN378SafetyCheckReportDto({
  state,
  calculation,
  generatedAt: '2026-09-01T00:00:00.000Z'
});
assert.equal(report.summary.plannerGuidanceHeadline, calculation.plannerGuidance.headline);
assert.equal(report.assessment.plannerGuidance.status, 'measures-required');
assert.equal(report.input.outdoorVentilationGeneralConfirmed, 'yes');
assert.equal(report.input.outdoorMechanicalVentilationOpeningsConfirmed, 'no');
assert.ok(report.plannerGuidance.groups.length > 0);
assert.doesNotThrow(() => JSON.stringify(report));

const sections = reportSections({ reportSource: 'typed-dto', reportDto: report });
assert.ok(sections.some(section => section.title.includes('Planer-Leitfaden')));
assert.ok(sections.some(section => section.rows.some(row => String(row[1]).includes('Externen Not-Aus'))));


const outdoorState = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'outdoor',
  installationClass: 'II',
  accessArea: 'general-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  isOutdoorDefinitionConfirmed: 'yes',
  outdoorSafeArrangement: 'yes',
  outdoorPreventBuildingEntry: 'yes',
  hasOutdoorProtectiveCover: 'no',
  outdoorRefrigerantAccumulationPossible: 'yes',
  outdoorEN3782_6_2_14EN60335Applicable: 'no',
  outdoorEN3782_6_2_14HazardousAreaConfirmed: 'yes',
  outdoorEN3782_6_2_14HazardousAreaEvidenceReference: 'Gefährdungsbeurteilung-01',
  outdoorEN3782_6_2_14ComponentAssessmentConfirmed: 'yes',
  outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference: 'Komponentenbewertung-01',
  outdoorEN3782_6_2_14ProtectionConditionsConfirmed: 'yes',
  outdoorEN3782_6_2_14ProtectionEvidenceReference: 'Schutzmaßnahmen-01',
  outdoorEN3782_6_2_14AirflowProtectionUsed: 'no',
  outdoorEN3782_6_2_14SurfaceTemperatureConfirmed: 'yes',
  outdoorEN3782_6_2_14HazardousAreaExceedsEquipment: 'yes',
  outdoorEN3782_6_2_14EquipmentDocumentationUpdated: 'no'
};
const outdoorCalculation = calculate(outdoorState);
assert.ok(outdoorCalculation.plannerGuidance.groups.some(group => group.id === 'safetyMeasures'));
assert.ok(outdoorCalculation.plannerGuidance.requiredMeasures.some(measure => measure.includes('Gerätedokumentation')));
assert.ok(outdoorCalculation.plannerGuidance.requiredMeasures.some(measure => measure.includes('Geräteabmessungen')));
const outdoorReport = buildEN378SafetyCheckReportDto({ state: outdoorState, calculation: outdoorCalculation });
assert.equal(outdoorReport.input.outdoorEN3782_6_2_14HazardousAreaEvidenceReference, 'Gefährdungsbeurteilung-01');
assert.equal(outdoorReport.input.outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference, 'Komponentenbewertung-01');
assert.ok(outdoorReport.assessment.installationSafety.requirements.some(item => item.id === 'outdoor.en378-2-6-2-14.documentation' && item.status === 'failed'));

const duplicateMeasureGuidance = buildEN378PlannerGuidance({}, {
  status: 'measures-required',
  inputValidation: { issues: [] },
  chargeLimitAssessment: { checks: [], missingInputs: [] },
  installationSafetyAssessment: {
    missingInputs: [],
    requirements: [
      { id: 'duplicate.measure.a', category: 'ventilation', title: 'Lüftungsmaßnahme A', status: 'failed', requirement: 'Prüfung A', measure: 'Mechanische Lüftung und Luftführung fachgerecht planen.', source: { sourcePart: 'EN 378-3', sourceSection: '5.13.1' } },
      { id: 'duplicate.measure.b', category: 'ventilation', title: 'Lüftungsmaßnahme B', status: 'failed', requirement: 'Prüfung B', measure: 'Mechanische Lüftung und Luftführung fachgerecht planen.', source: { sourcePart: 'EN 378-3', sourceSection: '5.13.5' } }
    ]
  }
});
const consolidatedMeasures = duplicateMeasureGuidance.groups.flatMap(group => group.items);
assert.equal(consolidatedMeasures.length, 1);
assert.equal(duplicateMeasureGuidance.requiredMeasures.length, 1);
assert.ok(consolidatedMeasures[0].sourceLabel.includes('5.13.1'));
assert.ok(consolidatedMeasures[0].sourceLabel.includes('5.13.5'));
assert.equal(consolidatedMeasures[0].sources.length, 2);

console.log('EN 378 planner guidance tests passed.');
