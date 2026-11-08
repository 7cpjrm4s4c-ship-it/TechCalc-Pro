import assert from 'node:assert/strict';
import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';

const base = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'outdoor',
  installationClass: 'II',
  accessArea: 'general-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'natural',
  isOutdoorDefinitionConfirmed: 'yes',
  outdoorSafeArrangement: 'yes',
  outdoorPreventBuildingEntry: 'yes',
  hasOutdoorProtectiveCover: 'no',
  outdoorRefrigerantAccumulationPossible: 'no',
  outdoorEN3782_6_2_14Confirmed: ''
};
const charge = assessChargeLimit(base);
const assessment = assessInstallationSafetyRequirements(base, charge);
const byId = id => assessment.requirements.find(item => item.id === id);
assert.equal(byId('outdoor.safe-arrangement')?.status, 'passed');
assert.equal(byId('outdoor.prevent-refrigerant-entry')?.status, 'passed');
assert.equal(byId('outdoor.refrigerant-accumulation')?.status, 'passed');
assert.equal(byId('outdoor.cover-ventilation'), undefined);
assert.equal(byId('outdoor.en378-2-6-2-14'), undefined);
assert.equal(byId('outdoor.ignition-sources'), undefined);
assert.equal(byId('outdoor.safe-arrangement')?.source?.sourceSection, '4.2');

const accumulationState = {
  ...base,
  outdoorRefrigerantAccumulationPossible: 'yes',
  outdoorEN3782_6_2_14Confirmed: 'yes'
};
const accumulationAssessment = assessInstallationSafetyRequirements(accumulationState, assessChargeLimit(accumulationState));
assert.equal(accumulationAssessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14')?.status, 'passed');
assert.equal(accumulationAssessment.requirements.find(item => item.id === 'outdoor.en378-2-6-2-14')?.source?.sourceSection, '6.2.14');

const coverState = {
  ...base,
  hasOutdoorProtectiveCover: 'yes',
  outdoorCoverVentilated: 'no'
};
const coverAssessment = assessInstallationSafetyRequirements(coverState, assessChargeLimit(coverState));
assert.equal(coverAssessment.requirements.find(item => item.id === 'outdoor.cover-ventilation')?.status, 'failed');

const openState = {
  ...base,
  isOutdoorDefinitionConfirmed: '',
  outdoorSafeArrangement: '',
  outdoorPreventBuildingEntry: '',
  hasOutdoorProtectiveCover: '',
  outdoorRefrigerantAccumulationPossible: ''
};
const openAssessment = assessInstallationSafetyRequirements(openState, assessChargeLimit(openState));
assert.equal(openAssessment.status, 'not-assessed');
assert.ok(!openAssessment.requirements.some(item => item.id === 'outdoor.refrigerant-accumulation'));
assert.ok(!openAssessment.requirements.some(item => item.id.startsWith('detector.')));
assert.ok(!openAssessment.requirements.some(item => item.id.startsWith('alarm.')));

const accumulationWithFailedPrerequisite = { ...base, outdoorPreventBuildingEntry: 'no', outdoorRefrigerantAccumulationPossible: 'yes' };
const blockedFollowUps = assessInstallationSafetyRequirements(accumulationWithFailedPrerequisite, assessChargeLimit(accumulationWithFailedPrerequisite));
assert.ok(!blockedFollowUps.requirements.some(item => item.id === 'outdoor.refrigerant-accumulation'));
assert.ok(!blockedFollowUps.requirements.some(item => item.id.startsWith('detector.')));

const calculation = calculate(base);
assert.equal(calculation.effectiveState.chargeKg, '8');
assert.ok(calculation.installationSafetyAssessment.requirements.some(item => item.id === 'outdoor.safe-arrangement'));
console.log('EN 378 outdoor installation section 4.2 tests passed.');
