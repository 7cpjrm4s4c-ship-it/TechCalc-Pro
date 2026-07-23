import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateDwa117Applicability } from '../js/modules/flooding-verification/retentionApplicability.js';

test('DWA-A 117 applicability is inactive outside authority limit mode', () => {
  const result = evaluateDwa117Applicability({ enabled: true, dischargeMode: 'manual-full-flow' });
  assert.equal(result.status, 'inactive');
  assert.equal(result.active, false);
});

test('DWA-A 117 applicability reports incomplete mandatory inputs', () => {
  const result = evaluateDwa117Applicability({ enabled: true, dischargeMode: 'authority-discharge-limit' });
  assert.equal(result.status, 'incomplete');
  assert.ok(result.messages[0].includes('fehlen'));
});

test('DWA-A 117 simple procedure is unrestricted inside all contract limits', () => {
  const result = evaluateDwa117Applicability({
    enabled: true,
    dischargeMode: 'authority-discharge-limit',
    catchmentAreaHa: 2,
    flowTimeMinutes: 10,
    recurrenceFrequencyPerYear: 0.2,
    throttleRainShareLsHa: 8,
    surchargeFactorFz: 1.1,
    reductionFactorFa: 0.95
  });
  assert.equal(result.status, 'applicable');
  assert.equal(result.unrestricted, true);
  assert.ok(result.checks.every(check => check.passed));
});

test('hard contract limit requires long-term simulation', () => {
  const result = evaluateDwa117Applicability({
    enabled: true,
    dischargeMode: 'authority-discharge-limit',
    catchmentAreaHa: 250,
    flowTimeMinutes: 20,
    recurrenceFrequencyPerYear: 0.05,
    throttleRainShareLsHa: 1.5,
    surchargeFactorFz: 1.1,
    reductionFactorFa: 0.95
  });
  assert.equal(result.status, 'long-term-simulation-required');
  assert.equal(result.unrestricted, false);
  assert.ok(result.messages.length >= 3);
});

test('empirical fA domain exceedance is marked as preliminary only', () => {
  const result = evaluateDwa117Applicability({
    enabled: true,
    dischargeMode: 'authority-discharge-limit',
    catchmentAreaHa: 2,
    flowTimeMinutes: 20,
    recurrenceFrequencyPerYear: 1.2,
    throttleRainShareLsHa: 45,
    surchargeFactorFz: 1.1,
    reductionFactorFa: 0.95
  });
  assert.equal(result.status, 'preliminary-only');
  assert.equal(result.unrestricted, false);
  assert.ok(result.checks.some(check => check.severity === 'empirical' && !check.passed));
});

test('area or flow-time rule passes when either criterion is fulfilled', () => {
  const result = evaluateDwa117Applicability({
    enabled: true,
    dischargeMode: 'authority-discharge-limit',
    catchmentAreaHa: 250,
    flowTimeMinutes: 10,
    recurrenceFrequencyPerYear: 0.2,
    throttleRainShareLsHa: 8,
    surchargeFactorFz: 1.1,
    reductionFactorFa: 0.95
  });
  assert.equal(result.status, 'applicable');
  assert.equal(result.checks.find(check => check.key === 'catchment-or-flow-time').passed, true);
});
