import assert from 'node:assert/strict';

import { reportSections } from '../core/pdf/pdfDataMapping.js';
import { calculate, deriveInstallationLocation, normalizeEN378AssessmentState, validateAssessmentInput } from '../modules/en-378-safety-check/logic.js';
import { assessStateConsistency } from '../modules/en-378-safety-check/stateConsistency.js';
import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { buildEN378SafetyCheckReportDto } from '../modules/en-378-safety-check/reportAdapter.js';
import {
  buildEN378StateFromFGasesSnapshot,
  canImportFGasesSystemSnapshot,
  validateFGasesSystemSnapshot
} from '../modules/en-378-safety-check/snapshotImport.js';
const validSnapshot = {
  snapshotType: 'techcalc.f-gases.system',
  snapshotVersion: 5,
  generatedAt: '2026-08-31T00:00:00.000Z',
  moduleId: 'f-gases-check',
  dataVersions: { refrigerants: 'test', gwp: 'test', regulations: 'test' },
  system: { systemName: 'Testanlage', refrigerantId: 'R32', chargeKg: 2.5 }
};
assert.equal(canImportFGasesSystemSnapshot(validSnapshot), true);
assert.deepEqual(validateFGasesSystemSnapshot(validSnapshot).errors, []);

const imported = buildEN378StateFromFGasesSnapshot(validSnapshot, {});
assert.equal(imported.importStatus, 'imported');
assert.equal(imported.importedSystemName, 'Testanlage');
assert.equal(imported.refrigerantId, 'R32');
assert.equal(imported.chargeKg, '2.5');
assert.notEqual(imported.importedSnapshot, validSnapshot);
validSnapshot.system.systemName = 'Mutation wird nicht übernommen';
assert.equal(imported.importedSnapshot.system.systemName, 'Testanlage');

const rejected = buildEN378StateFromFGasesSnapshot({ snapshotType: 'unsupported' }, {});
assert.equal(rejected.importStatus, 'rejected');
assert.ok(rejected.importErrors.includes('snapshot:unsupported-type'));
const incompleteValidation = validateAssessmentInput(imported);
assert.equal(incompleteValidation.isValid, false);
assert.ok(incompleteValidation.issues.includes('roomVolumeM3:required'));

assert.equal(deriveInstallationLocation({ systemConfiguration: 'split-system', indoorUnitLocation: 'occupied-space', installationLocation: 'outdoor' }), 'occupied-space');
assert.equal(deriveInstallationLocation({ systemConfiguration: 'split-system', indoorUnitLocation: '', installationLocation: 'outdoor' }), '');
assert.equal(deriveInstallationLocation({ systemConfiguration: 'split-system', indoorUnitLocation: 'other', installationLocation: 'outdoor' }), 'other');
assert.equal(deriveInstallationLocation({ systemConfiguration: 'single-location', installationLocation: 'outdoor' }), 'outdoor');
assert.equal(deriveInstallationLocation({ systemConfiguration: 'single-location', installationLocation: 'other' }), 'other');
assert.equal(normalizeEN378AssessmentState({ systemConfiguration: 'split-system', indoorUnitLocation: 'technical-room', installationLocation: 'outdoor' }).installationLocation, 'technical-room');

// Bei Split-Anlagen darf Klasse II nicht allein anhand des Innenraums als
// nicht erfüllt bewertet werden. Ohne Komponentenstandort bleibt die Prüfung offen.
const splitClassIIBase = {
  systemConfiguration: 'split-system',
  indoorUnitLocation: 'technical-room',
  installationLocation: 'technical-room',
  installationClass: 'II'
};
const splitClassIIUnconfirmed = assessStateConsistency(splitClassIIBase);
assert.equal(splitClassIIUnconfirmed.status, 'not-assessed');
assert.equal(splitClassIIUnconfirmed.requirements[0].status, 'not-assessed');
assert.ok(splitClassIIUnconfirmed.requirements[0].missingInputs.includes('splitClassIIComponentLocationConfirmed'));
assert.equal(assessStateConsistency({ ...splitClassIIBase, splitClassIIComponentLocationConfirmed: 'yes' }).status, 'passed');
assert.equal(assessStateConsistency({ ...splitClassIIBase, splitClassIIComponentLocationConfirmed: 'no' }).status, 'failed');
const splitClassIIIBase = { ...splitClassIIBase, installationClass: 'III' };
const splitClassIIIUnconfirmed = assessStateConsistency(splitClassIIIBase);
assert.equal(splitClassIIIUnconfirmed.status, 'not-assessed');
assert.equal(splitClassIIIUnconfirmed.requirements[0].status, 'not-assessed');
assert.ok(splitClassIIIUnconfirmed.requirements[0].missingInputs.includes('splitClassIIIComponentLocationConfirmed'));
assert.equal(assessStateConsistency({ ...splitClassIIIBase, splitClassIIIComponentLocationConfirmed: 'yes' }).status, 'passed');
assert.equal(assessStateConsistency({ ...splitClassIIIBase, splitClassIIIComponentLocationConfirmed: 'no' }).status, 'failed');

// Personendichte darf nicht stillschweigend als "Nein" interpretiert werden,
// wenn sie den Grenzwert nach EN 378-1, Anhang C, Tabelle C.2 beeinflusst.
const densityMissingAssessment = assessChargeLimit({
  refrigerantId: 'R32',
  chargeKg: '2.5',
  roomVolumeM3: '50',
  installationClass: 'II',
  accessCategory: 'c',
  applicationType: 'other',
  locationLevel: 'other',
  occupantDensityBelowOnePer10m2: '',
  usesAlternativeRiskManagement: 'no'
});
const densityDependentCheck = densityMissingAssessment.checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(densityDependentCheck.status, 'not-assessed');
assert.ok(densityDependentCheck.missingInputs.includes('occupantDensityBelowOnePer10m2'));

const completeState = {
  ...imported,
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasGasWarningSystem: 'yes',
  hasMachineryRoom: 'no',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  additionalSafetyMeasures: 'Keine weiteren Maßnahmen im Test.'
};
const completeValidation = validateAssessmentInput(completeState);
assert.equal(completeValidation.isValid, true);

// Offene Plausibilitätsprüfungen müssen sich bis zum Gesamtergebnis fortsetzen
// und dürfen bei ansonsten vollständigen Pflichtfeldern nicht als akzeptabel gelten.
const splitClassIIOpenState = {
  ...completeState,
  systemConfiguration: 'split-system',
  indoorUnitLocation: 'technical-room',
  installationLocation: 'technical-room',
  installationClass: 'II',
  splitClassIIComponentLocationConfirmed: '',
  isOutdoorPublicAccessible: 'no'
};
const splitClassIIOpenCalculation = calculate(splitClassIIOpenState);
assert.equal(splitClassIIOpenCalculation.inputComplete, true);
assert.equal(splitClassIIOpenCalculation.stateConsistencyAssessment.status, 'not-assessed');
assert.notEqual(splitClassIIOpenCalculation.status, 'acceptable');
assert.equal(splitClassIIOpenCalculation.status, 'ready-for-assessment');
assert.ok(splitClassIIOpenCalculation.plannerGuidance.openPointCount > 0);
assert.ok(splitClassIIOpenCalculation.plannerGuidance.missingInputs.includes('Standort von Verdichter und Druckbehältern'));

const calculation = calculate(completeState);
assert.equal(calculation.status, 'measures-required');
assert.equal(calculation.inputComplete, true);
assert.equal(calculation.chargeKg, 2.5);
assert.equal(calculation.roomVolumeM3, 50);
assert.equal(calculation.chargeLimitAssessment.status, 'passed');
assert.equal(calculation.installationSafetyAssessment.status, 'passed');
assert.ok(calculation.plannerGuidance.groups.length > 0);
assert.ok(calculation.plannerGuidance.requiredMeasures.length > 0);
assert.ok(calculation.plannerGuidance.groups.some(group =>
  group.id === 'detection' && group.items.some(item => item.status === 'required')
));
const splitOutdoorState = {
  ...completeState,
  systemConfiguration: 'split-system',
  indoorUnitLocation: 'technical-room',
  installationLocation: 'technical-room',
  installationClass: 'II',
  splitClassIIComponentLocationConfirmed: 'yes',
  refrigerantId: 'R32',
  chargeKg: '2.5',
  isOutdoorPublicAccessible: 'no'
};
const splitOutdoorCalculation = calculate(splitOutdoorState);
const splitOutdoorSafety = assessInstallationSafetyRequirements(
  splitOutdoorState,
  splitOutdoorCalculation.chargeLimitAssessment
);
assert.ok(splitOutdoorSafety.requirements.some(item => item.id === 'outdoor.ignition-sources'),
  'Brennbarkeitsbezogene Außenanforderungen müssen auch für Split-Außeneinheiten geprüft werden');

const report = buildEN378SafetyCheckReportDto({ state: completeState, calculation, generatedAt: '2026-08-31T00:00:00.000Z' });

// A1 refrigerant: generic outdoor-location and handover guidance may remain,
// but must not create a false overall "measures required" status by themselves.
const a1OutdoorState = {
  ...completeState,
  refrigerantId: 'R513A',
  chargeKg: '5.1',
  roomVolumeM3: '100',
  installationLocation: 'outdoor',
  isOutdoorPublicAccessible: 'no',
  hasGasWarningSystem: 'no',
  hasMachineryRoom: 'no',
  hasDetector: 'no',
  hasAlarm: 'no',
  hasIndependentAlarmPower: 'no'
};
const a1OutdoorCalculation = calculate(a1OutdoorState);
assert.equal(a1OutdoorCalculation.inputComplete, true);
assert.equal(a1OutdoorCalculation.chargeLimitAssessment.status, 'passed');
assert.equal(a1OutdoorCalculation.installationSafetyAssessment.status, 'passed');
assert.equal(a1OutdoorCalculation.status, 'acceptable');


assert.equal(report.metadata.dtoType, 'techcalc.en-378-safety-check.report');
assert.equal(report.summary.status, 'measures-required');
assert.equal(report.assessment.chargeLimit.status, 'passed');
assert.equal(report.assessment.installationSafety.status, 'passed');
assert.equal(report.assessment.plannerGuidance.status, 'measures-required');
assert.doesNotThrow(() => JSON.stringify(report));

const sections = reportSections({ reportSource: 'typed-dto', reportDto: report });
assert.ok(sections.length >= 4);
assert.equal(sections[0].title, '1. Berichtszusammenfassung');
assert.ok(sections.some(section => section.title.includes('Eingaben')));
assert.ok(sections.some(section => section.rows.some(row => row[0] === 'Bewertung' && ['measures-required', 'Maßnahmen oder Anpassungen erforderlich'].includes(row[1]))));
assert.ok(sections.some(section => section.title.includes('Planer-Leitfaden')));

console.log('EN 378 safety check technical tests passed.');
