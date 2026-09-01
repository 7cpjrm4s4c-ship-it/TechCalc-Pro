import assert from 'node:assert/strict';

import { reportSections } from '../js/core/pdf/pdfDataMapping.js';
import { calculate, validateAssessmentInput } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../js/modules/en-378-safety-check/reportAdapter.js';
import {
  buildEN378StateFromFGasesSnapshot,
  canImportFGasesSystemSnapshot,
  validateFGasesSystemSnapshot
} from '../js/modules/en-378-safety-check/snapshotImport.js';
const validSnapshot = {
  snapshotType: 'techcalc.f-gases.system',
  snapshotVersion: 5,
  generatedAt: '2026-08-31T00:00:00.000Z',
  moduleId: 'f-gases-check',
  dataVersions: { refrigerants: 'test', gwp: 'test', regulations: 'test' },
  system: {
    systemName: 'Testanlage',
    refrigerantId: 'R32',
    chargeKg: 2.5
  }
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
  additionalSafetyMeasures: 'Keine EN-378-3-Komponentenbewertung im Test.'
};
const completeValidation = validateAssessmentInput(completeState);
assert.equal(completeValidation.isValid, true);

const calculation = calculate(completeState);
assert.equal(calculation.status, 'acceptable');
assert.equal(calculation.inputComplete, true);
assert.equal(calculation.chargeKg, 2.5);
assert.equal(calculation.roomVolumeM3, 50);
assert.equal(calculation.chargeLimitAssessment.status, 'passed');
assert.deepEqual(calculation.requiredMeasures, []);
const report = buildEN378SafetyCheckReportDto({
  state: completeState,
  calculation,
  generatedAt: '2026-08-31T00:00:00.000Z'
});

assert.equal(report.metadata.dtoType, 'techcalc.en-378-safety-check.report');
assert.equal(report.summary.status, 'acceptable');
assert.equal(report.assessment.status, 'passed');
assert.deepEqual(report.assessment.requiredMeasures, []);
assert.doesNotThrow(() => JSON.stringify(report));

const sections = reportSections({ reportSource: 'typed-dto', reportDto: report });
assert.ok(sections.length >= 4);
assert.equal(sections[0].title, '1. Berichtszusammenfassung');
assert.ok(sections.some(section => section.title.includes('Eingaben')));
assert.ok(sections.some(section => section.rows.some(row => row[0] === 'Bewertung' && row[1] === 'passed')));

console.log('EN 378 safety check technical tests passed.');
