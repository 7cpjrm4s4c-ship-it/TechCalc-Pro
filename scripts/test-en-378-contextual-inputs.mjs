import assert from 'node:assert/strict';

import { calculate, deriveAccessCategory, validateAssessmentInput, ACCESS_CATEGORY_BY_ACCESS_AREA } from '../modules/en-378-safety-check/logic.js';
import schema from '../modules/en-378-safety-check/schema.js';
import { assessChargeLimit, calculateC21Trigger } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { buildEN378SafetyCheckReportDto } from '../modules/en-378-safety-check/reportAdapter.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';

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

// Aufstellort "belüftetes Gehäuse" (Klasse IV) ist auswählbar; die Zugangskategorie-Tabelle ist zentral in logic.js definiert
const locationField = schema.fields.find(field => field.key === 'installationLocation');
assert.ok(locationField.options.some(option => option.value === 'ventilated-enclosure'), 'Aufstellort belüftetes Gehäuse muss als Option existieren');
assert.deepEqual(ACCESS_CATEGORY_BY_ACCESS_AREA, { 'general-access': 'a', 'supervised-access': 'b', 'authorized-access': 'c' });

// C.2.1-Auslöseschwelle im Komfortpfad: 1,5 × m1 bei Klasse 2L (R-32: m1 = 1,228 kg, Schwelle 1,842 kg)
assert.equal(calculateC21Trigger({ flammabilityClass: '2L', lflKgM3: 0.307, chargeKg: '1' }).exceeded, false);
assert.equal(calculateC21Trigger({ flammabilityClass: '2L', lflKgM3: 0.307, chargeKg: '2.5' }).exceeded, true);
const comfortState = {
  refrigerantId: 'R-32',
  chargeKg: '1',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  floorAreaM2: '18',
  isFactorySealed: 'no',
  mountingType: 'wall'
};
const comfortBelow = assessChargeLimit(comfortState).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(comfortBelow.rule, 'c2-1-trigger-not-exceeded');
assert.equal(comfortBelow.status, 'passed');
const comfortAbove = assessChargeLimit({ ...comfortState, chargeKg: '2.5' }).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(comfortAbove.rule, 'comfort-application-c2-or-c3');
assert.equal(comfortAbove.details.exceeded, true);
assert.equal(comfortAbove.details.equationApplies, true, 'R-32: M = 52 g/mol > 42 g/mol');

// EN 378-3 Abschnitte 8 und 9: hasAlarm/hasIndependentAlarmPower sind nur schaltbar, wenn
// eine Auslösehardware (Gaswarnsystem oder Detektor) vorhanden ist; sonst deaktiviert.
const hasAlarmField = schema.fields.find(field => field.key === 'hasAlarm');
const hasAlarmPowerField = schema.fields.find(field => field.key === 'hasIndependentAlarmPower');
assert.equal(typeof hasAlarmField.disabled, 'function');
assert.equal(typeof hasAlarmPowerField.disabled, 'function');
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: 'no', hasDetector: 'no' }), true, 'ohne Auslösehardware deaktiviert');
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: 'yes', hasDetector: 'no' }), false);
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: 'no', hasDetector: 'yes' }), false);
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: '', hasDetector: '' }), true, 'unbeantwortet gilt als keine Auslösehardware');
assert.equal(hasAlarmPowerField.disabled({ hasGasWarningSystem: 'no', hasDetector: 'no' }), true);
assert.equal(hasAlarmPowerField.disabled({ hasGasWarningSystem: 'yes' }), false);
assert.equal(hasAlarmPowerField.disabled({ hasDetector: 'yes' }), false);

console.log('EN 378 contextual input tests passed.');
