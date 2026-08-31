import assert from 'node:assert/strict';

import { calculate, validateAssessmentInput } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../js/modules/en-378-safety-check/reportAdapter.js';
import {
  buildEN378StateFromFGasesSnapshot,
  canImportFGasesSystemSnapshot,
  validateFGasesSystemSnapshot
} from '../js/modules/en-378-safety-check/snapshotImport.js';

const validSnapshot = Object.freeze({
  snapshotType: 'techcalc.f-gases.system',
  snapshotVersion: 5,
  generatedAt: '2026-08-31T00:00:00.000Z',
  moduleId: 'f-gases-check',
  dataVersions: Object.freeze({ refrigerants: 'test', gwp: 'test', regulations: 'test' }),
  system: Object.freeze({
    systemName: 'Testanlage',
    refrigerantId: 'R32',
    chargeKg: 2.5
  })
});

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
  roomVolumeM3: '45,5',
  installationLocation: 'occupied-space',
  accessArea: 'general-access',
  usageType: 'commercial',
  ventilationType: 'mechanical',
  hasGasWarningSystem: 'yes',
  hasMachineryRoom: 'no',
  additionalSafetyMeasures: 'Keine fachliche Bewertung im Test.'
};

const completeValidation = validateAssessmentInput(completeState);
assert.equal(completeValidation.isValid, true);

const calculation = calculate(completeState);
assert.equal(calculation.status, 'ready-for-assessment');
assert.equal(calculation.inputComplete, true);
assert.equal(calculation.chargeKg, 2.5);
assert.equal(calculation.roomVolumeM3, 45.5);
assert.deepEqual(calculation.requiredMeasures, []);
assert.deepEqual(calculation.notices, []);

const report = buildEN378SafetyCheckReportDto({
  state: completeState,
  calculation,
  generatedAt: '2026-08-31T00:00:00.000Z'
});

assert.equal(report.metadata.dtoType, 'techcalc.en-378-safety-check.report');
assert.equal(report.summary.status, 'ready-for-assessment');
assert.equal(report.assessment.status, 'not-implemented');
assert.deepEqual(report.assessment.requiredMeasures, []);
assert.doesNotThrow(() => JSON.stringify(report));

console.log('EN 378 safety check technical tests passed.');
