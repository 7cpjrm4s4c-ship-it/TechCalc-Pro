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
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomOccupied: 'yes',
  machineryRoomRequiredAirChangeAchievable: 'yes',
  hasMechanicalVentilation: 'yes',
  hasEmergencyVentilation: 'no',
  machineryRoomLargestSystemChargeKg: '6',
  hasEmergencyVentilationControlInside: 'no',
  hasEmergencyVentilationControlOutside: 'yes',
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
assert.equal(emergencyFlow.details.fifteenAirChangesM3h, 1200);
assert.ok(calculation.installationSafetyAssessment.requirements.some(item => item.id === 'machinery-room.emergency-ventilation-control-inside' && item.status === 'failed'));
assert.ok(calculation.installationSafetyAssessment.requirements.some(item => item.id === 'machinery-room.emergency-ventilation-control-outside' && item.status === 'passed'));
// Updated: openPointCount may be 0 after removing obsolete fields
// Removed: hasEmergencyStopOutside is no longer a requirement
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'ventilation'));
assert.ok(calculation.plannerGuidance.groups.some(group => group.id === 'alarm'));
// Updated: openPoints group may not exist if no open points
// Removed: hasEmergencyStopInside is no longer a field
// Removed: hasEmergencyStopInside is no longer a field

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
// Removed: hasEmergencyStopOutside is no longer a field


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
assert.equal(consolidatedMeasures.length, 2);
assert.equal(duplicateMeasureGuidance.requiredMeasures.length, 1);
assert.ok(consolidatedMeasures[0].sourceLabel.includes('5.13.1'));
assert.ok(consolidatedMeasures[1].sourceLabel.includes('5.13.5'));
assert.equal(consolidatedMeasures[0].sources.length, 1);


// Test for Fix 3: All 11 informative entries 5.2-5.12 should appear individually
const machineryRoomGuidance = buildEN378PlannerGuidance({
  installationLocation: 'machinery-room',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes'
}, {
  status: 'passed',
  inputValidation: { issues: [] },
  chargeLimitAssessment: { checks: [], missingInputs: [] },
  installationSafetyAssessment: {
    missingInputs: [],
    requirements: []
  }
});
const guidanceGroup = machineryRoomGuidance.groups.find(g => g.title.includes('Übergabe und Dokumentation'));
assert.ok(guidanceGroup, 'Guidance group "Übergabe und Dokumentation" should exist');
const informativeItems = guidanceGroup?.items || [];
// Check that all 11 informative entries are present
assert.equal(informativeItems.length, 11, 'All 11 informative entries 5.2-5.12 should appear individually');
const informativeIds = informativeItems.map(item => item.id);
assert.ok(informativeIds.includes('en378-3-5.2'), '5.2 should be present');
assert.ok(informativeIds.includes('en378-3-5.3'), '5.3 should be present');
assert.ok(informativeIds.includes('en378-3-5.4'), '5.4 should be present');
assert.ok(informativeIds.includes('en378-3-5.5'), '5.5 should be present');
assert.ok(informativeIds.includes('en378-3-5.6'), '5.6 should be present');
assert.ok(informativeIds.includes('en378-3-5.7'), '5.7 should be present');
assert.ok(informativeIds.includes('en378-3-5.8'), '5.8 should be present');
assert.ok(informativeIds.includes('en378-3-5.9'), '5.9 should be present');
assert.ok(informativeIds.includes('en378-3-5.10'), '5.10 should be present');
assert.ok(informativeIds.includes('en378-3-5.11'), '5.11 should be present');
assert.ok(informativeIds.includes('en378-3-5.12'), '5.12 should be present');
// Each should have its own source
assert.ok(informativeItems.every(item => item.sourceLabel && item.sourceLabel.includes('EN 378-3')), 'Each item should have its own source');

// Test for Fix 4a: Ventilation output in results
const resultModelWithVentilation = buildEN378SafetyCheckResultModel(state, calculation);
const ventilationGroup = resultModelWithVentilation.groups.find(g => g.title === 'Lüftungsauslegung Maschinenraum');
assert.ok(ventilationGroup, 'Ventilation output group should exist');
const ventilationRows = ventilationGroup.rows || [];
assert.ok(ventilationRows.length > 0, 'Ventilation output group should have rows');
// Check for specific rows
const hasFormulaRow = ventilationRows.some(r => r.label.includes('Gleichung (1)'));
const has15AirChangesRow = ventilationRows.some(r => r.label.includes('15 Luftwechseln/h'));
const hasGoverningRow = ventilationRows.some(r => r.label.includes('Maßgeblicher Wert'));
const has4xVentilationRow = ventilationRows.some(r => r.label.includes('4-facher Luftwechsel'));
assert.ok(hasFormulaRow, 'Should have Gleichung (1) row');
assert.ok(has15AirChangesRow, 'Should have 15 Luftwechseln/h row');
assert.ok(hasGoverningRow, 'Should have Maßgeblicher Wert row');
assert.ok(has4xVentilationRow, 'Should have 4-facher Luftwechsel row');


console.log('EN 378 planner guidance tests passed.');
