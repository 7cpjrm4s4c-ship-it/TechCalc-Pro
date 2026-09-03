import assert from 'node:assert/strict';

import {
  assessAlternativeRiskManagementC3,
  assessChargeLimit,
  calculateComfortChargeLimit,
  calculateFactorySealedChargeLimit,
  calculateFlammabilityMassLimits,
  calculateMinimumComfortFloorArea,
  calculateMinimumFactorySealedFloorArea,
  calculateRefrigerantConcentration,
  getToxicityConcentrationLimit
} from '../js/modules/en-378-safety-check/chargeLimitCalculation.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { getEN378SafetyData } from '../js/utils/refrigerants/index.js';

const r32 = getEN378SafetyData('R-32');
assert.equal(r32.safetyClass, 'A2L');
assert.equal(getToxicityConcentrationLimit(r32), 0.30);
assert.deepEqual(calculateFlammabilityMassLimits(0.307), { m1Kg: 1.228, m2Kg: 7.982, m3Kg: 39.91 });
assert.equal(calculateRefrigerantConcentration('2,5', '50'), 0.05);

const baseState = {
  refrigerantId: 'R-32',
  chargeKg: '2.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical'
};

const chargeLimit = assessChargeLimit(baseState);
assert.equal(chargeLimit.status, 'passed');
assert.equal(chargeLimit.maximumAllowedChargeKg, 3.0700000000000003);
assert.equal(chargeLimit.checks.find(check => check.id === 'charge-limit.toxicity').status, 'passed');
assert.equal(chargeLimit.checks.find(check => check.id === 'charge-limit.flammability').status, 'passed');

const excessiveCharge = assessChargeLimit({ ...baseState, chargeKg: '4' });
assert.equal(excessiveCharge.status, 'failed');
assert.equal(excessiveCharge.checks.find(check => check.id === 'charge-limit.flammability').status, 'failed');

const a1 = assessChargeLimit({ ...baseState, refrigerantId: 'R-134a', chargeKg: '5' });
assert.equal(a1.checks.find(check => check.id === 'charge-limit.flammability').status, 'not-applicable');

const c3 = assessAlternativeRiskManagementC3({ safetyData: r32, chargeKg: '4', roomVolumeM3: '50', locationLevel: 'other' });
assert.equal(c3.status, 'failed');
assert.equal(c3.rule, 'between-qlmv-and-qlav');
assert.equal(c3.requirements.length, 1);

const comfortLimit = calculateComfortChargeLimit({ lflKgM3: r32.lflKgM3, floorAreaM2: '25', mountingType: 'wall' });
const comfortArea = calculateMinimumComfortFloorArea({ chargeKg: comfortLimit, lflKgM3: r32.lflKgM3, mountingType: 'wall' });
assert.ok(Math.abs(comfortArea - 25) < 0.0000001);

const sealedLimit = calculateFactorySealedChargeLimit({ lflKgM3: r32.lflKgM3, floorAreaM2: '25' });
const sealedArea = calculateMinimumFactorySealedFloorArea({ chargeKg: sealedLimit, lflKgM3: r32.lflKgM3 });
assert.ok(Math.abs(sealedArea - 25) < 0.0000001);

const calculation = calculate(baseState);
assert.equal(calculation.status, 'acceptable');
assert.equal(calculation.chargeLimitAssessment.status, 'passed');
assert.doesNotThrow(() => JSON.stringify(calculation.chargeLimitAssessment));

console.log('EN 378 charge limit calculation tests passed.');
