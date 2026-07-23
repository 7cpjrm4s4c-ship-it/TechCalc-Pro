import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRetentionDurationComparison } from '../js/modules/flooding-verification/retentionDurationComparison.js';

test('duration comparison sorts by duration and marks the maximum as governing', () => {
  const comparison = buildRetentionDurationComparison([
    { durationMinutes: 30, rainIntensityLsHa: 120, throttleRainShareLsHa: 5, surchargeFactorFz: 1.1, reductionFactorFa: 0.95, specificStorageM3Ha: 216, volumeM3: 32.4, valid: true },
    { durationMinutes: 10, rainIntensityLsHa: 220, throttleRainShareLsHa: 5, surchargeFactorFz: 1.1, reductionFactorFa: 0.95, specificStorageM3Ha: 134.8, volumeM3: 20.22, valid: true },
    { durationMinutes: 20, rainIntensityLsHa: 160, throttleRainShareLsHa: 5, surchargeFactorFz: 1.1, reductionFactorFa: 0.95, specificStorageM3Ha: 194.37, volumeM3: 29.1555, valid: true }
  ]);

  assert.deepEqual(comparison.rows.map(item => item.durationMinutes), [10, 20, 30]);
  assert.equal(comparison.governing.durationMinutes, 30);
  assert.equal(comparison.governing.volumeM3, 32.4);
  assert.equal(comparison.rows.filter(item => item.isGoverning).length, 1);
  assert.deepEqual(comparison.rows.map(item => item.rank), [3, 2, 1]);
});

test('equal maxima use the shorter duration deterministically', () => {
  const comparison = buildRetentionDurationComparison([
    { durationMinutes: 20, volumeM3: 30, valid: true },
    { durationMinutes: 10, volumeM3: 30, valid: true }
  ]);
  assert.equal(comparison.governing.durationMinutes, 10);
  assert.equal(comparison.rows.find(item => item.durationMinutes === 10).isGoverning, true);
});

test('invalid and clamped duration levels are diagnosed', () => {
  const comparison = buildRetentionDurationComparison([
    { durationMinutes: 5, volumeM3: 0, clampedToZero: true, valid: true },
    { durationMinutes: 15, volumeM3: null, valid: false }
  ]);
  assert.equal(comparison.rows[0].status, 'clamped-to-zero');
  assert.equal(comparison.rows[1].status, 'invalid');
  assert.equal(comparison.messages.length, 2);
});

test('comparison model is immutable and preserves full calculation parameters', () => {
  const comparison = buildRetentionDurationComparison([
    { durationMinutes: 15, rainIntensityLsHa: 180, throttleRainShareLsHa: 4, surchargeFactorFz: 1.2, reductionFactorFa: 0.9, specificStorageM3Ha: 171.072, volumeM3: 25.6608, valid: true }
  ]);
  assert.equal(Object.isFrozen(comparison), true);
  assert.equal(Object.isFrozen(comparison.rows), true);
  assert.equal(comparison.governing.specificStorageM3Ha, 171.072);
  assert.equal(comparison.governing.reductionFactorFa, 0.9);
});
