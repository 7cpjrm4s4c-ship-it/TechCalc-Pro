import assert from 'node:assert/strict';

import { calculate, deriveAccessCategory, validateAssessmentInput } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../js/modules/en-378-safety-check/reportAdapter.js';
import { buildEN378SafetyCheckResultModel } from '../js/modules/en-378-safety-check/results.js';

const derivedAccessState = {
  refrigerantId: 'R-513A',
  chargeKg: '24.4',
  roomVolumeM3: '6000',
  installationLocation: 'technical-room',
  installationClass: 'I',
  accessArea: 'authorized-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'no'
};

assert.equal(deriveAccessCategory(derivedAccessState), 'c');
const validation = validateAssessmentInput(derivedAccessState);
assert.equal(validation.isValid, true);
assert.equal(validation.effectiveState.accessCategory, 'c');

const calculation = calculate(derivedAccessState);
assert.equal(calculation.effectiveState.accessCategory, 'c');
assert.equal(calculation.inputComplete, true);
assert.equal(calculation.status, 'acceptable');

const resultModel = buildEN378SafetyCheckResultModel(derivedAccessState, calculation);
assert.ok(JSON.stringify(resultModel).includes('Kategorie c – Zugang nur für befugte Personen'));

const report = buildEN378SafetyCheckReportDto({ state: derivedAccessState, calculation, generatedAt: '2026-09-01T00:00:00.000Z' });
assert.equal(report.input.accessCategory, 'c');

const incompleteComfortValidation = validateAssessmentInput({
  refrigerantId: 'R-32',
  chargeKg: '0.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical'
});
assert.equal(incompleteComfortValidation.isValid, false);
assert.ok(incompleteComfortValidation.issues.includes('floorAreaM2:required'));
assert.ok(incompleteComfortValidation.issues.includes('isFactorySealed:required'));

const wallMountedComfortValidation = validateAssessmentInput({
  refrigerantId: 'R-32',
  chargeKg: '0.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  floorAreaM2: '18',
  isFactorySealed: 'no'
});
assert.equal(wallMountedComfortValidation.isValid, false);
assert.ok(wallMountedComfortValidation.issues.includes('mountingType:required'));

const completeComfortValidation = validateAssessmentInput({
  refrigerantId: 'R-32',
  chargeKg: '0.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  floorAreaM2: '18',
  isFactorySealed: 'no',
  mountingType: 'wall'
});
assert.equal(completeComfortValidation.isValid, true);

console.log('EN 378 contextual input tests passed.');
