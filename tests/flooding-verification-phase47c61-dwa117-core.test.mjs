import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculate,
  calculateDwa117Duration,
  calculateDwa117SimpleProcedure
} from '../js/modules/flooding-verification/logic.js';

const closeTo = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
};

test('DWA-A 117 duration row follows the contract formula', () => {
  const row = calculateDwa117Duration({
    durationMinutes: 15,
    rainIntensityLsHa: 180,
    throttleRainShareLsHa: 10,
    surchargeFactorFz: 1.1,
    reductionFactorFa: 0.95,
    effectiveAreaHa: 0.8
  });
  const expectedSpecific = (180 - 10) * 15 * 1.1 * 0.95 * 0.06;
  closeTo(row.specificStorageM3Ha, expectedSpecific);
  closeTo(row.volumeM3, expectedSpecific * 0.8);
  assert.equal(row.valid, true);
});

test('negative specific storage is clamped to zero without losing the raw value', () => {
  const row = calculateDwa117Duration({
    durationMinutes: 5,
    rainIntensityLsHa: 4,
    throttleRainShareLsHa: 10,
    surchargeFactorFz: 1,
    reductionFactorFa: 1,
    effectiveAreaHa: 1
  });
  assert.ok(row.rawSpecificStorageM3Ha < 0);
  assert.equal(row.specificStorageM3Ha, 0);
  assert.equal(row.volumeM3, 0);
  assert.equal(row.clampedToZero, true);
});

test('simple procedure derives Au and qDr,R,u and selects the largest duration volume', () => {
  const result = calculateDwa117SimpleProcedure({
    enabled: true,
    dischargeMode: 'authority-discharge-limit',
    authorityLimitLs: 8,
    weightedCmAreaM2: 8000,
    dryWeatherFlowLs: 1,
    upstreamThrottleFlowLs: 1,
    surchargeFactorFz: 1.1,
    reductionFactorFa: 0.9,
    rainByDuration: { 5: 240, 10: 180, 15: 150, 30: 100 }
  });
  closeTo(result.effectiveAreaHa, 0.8);
  closeTo(result.availableRainThrottleLs, 6);
  closeTo(result.throttleRainShareLsHa, 7.5);
  assert.equal(result.durationResults.length, 4);
  const maximum = Math.max(...result.durationResults.map(item => item.volumeM3));
  closeTo(result.governing.volumeM3, maximum);
  assert.equal(result.calculated, true);
});

test('simple procedure remains inactive outside authority-limit mode', () => {
  const result = calculateDwa117SimpleProcedure({
    enabled: true,
    dischargeMode: 'manual-full-flow',
    authorityLimitLs: 8,
    weightedCmAreaM2: 8000,
    surchargeFactorFz: 1,
    reductionFactorFa: 1,
    rainByDuration: { 10: 180 }
  });
  assert.equal(result.active, false);
  assert.equal(result.calculated, false);
  assert.equal(result.durationResults.length, 0);
});

test('module calculation integrates the DWA-A 117 core without changing flooding results', () => {
  const result = calculate({
    schemaVersion: 2,
    surfaces: [{ id: 'a', category: 'property', areaType: 'concrete-asphalt', area: '10000', cs: '1', cm: '0,8', isSealed: true }],
    meanSlopePercent: '2',
    rainDurationMode: 'automatic',
    rainR2Duration5: '300', rainR2Duration10: '200', rainR2Duration15: '150',
    rainR30Duration5: '500', rainR30Duration10: '350', rainR30Duration15: '280',
    dischargeMode: 'authority-discharge-limit',
    authorityLimitLs: '8',
    retentionEnabled: true,
    retentionDryWeatherFlowLs: '1',
    retentionUpstreamThrottleFlowLs: '1',
    retentionSurchargeFactorFz: '1,1',
    retentionReductionFactorFa: '0,9',
    retentionRainByDuration: { 5: '240', 10: '180', 15: '150' }
  });
  assert.equal(result.retention.active, true);
  assert.equal(result.retention.calculated, true);
  closeTo(result.retention.effectiveAreaHa, 0.8);
  assert.ok(result.flooding.governing.valueM3 >= 0);
});
