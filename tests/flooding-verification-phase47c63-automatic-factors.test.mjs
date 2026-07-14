import test from 'node:test';
import assert from 'node:assert/strict';
import { surchargeFactorFromRiskClass, calculateReductionFactorFa } from '../js/modules/flooding-verification/retentionFactors.js';
import { buildRetentionRainByDuration, deriveRetentionFactors, calculate } from '../js/modules/flooding-verification/calculationAdapter.js';

test('DWA-A 117 Tabelle 2 maps risk classes to fz', () => {
  assert.equal(surchargeFactorFromRiskClass('low'), 1.20);
  assert.equal(surchargeFactorFromRiskClass('medium'), 1.15);
  assert.equal(surchargeFactorFromRiskClass('high'), 1.10);
});

test('DWA-A 117 Appendix B derives fA deterministically', () => {
  const result = calculateReductionFactorFa({ flowTimeMinutes: 7, throttleRainShareLsHa: 11.68, recurrenceFrequencyPerYear: 0.2 });
  assert.equal(result.valid, true);
  assert.ok(Math.abs(result.value - 0.995) < 0.002);
});

test('retention duration fields are merged into canonical duration map', () => {
  assert.deepEqual(buildRetentionRainByDuration({ retentionRainDuration5: '300', retentionRainDuration10: '200', retentionRainDuration15: '150' }), { 5: '300', 10: '200', 15: '150' });
});

test('authority mode automatically enables retention and uses derived factors', () => {
  const state = {
    dischargeMode: 'authority-discharge-limit', authorityLimitLs: '5', retentionRiskClass: 'medium',
    retentionRecurrenceFrequencyPerYear: '0,2', retentionFlowTimeMinutes: '7',
    retentionDryWeatherFlowLs: '0', retentionUpstreamThrottleFlowLs: '0',
    retentionRainDuration5: '300', retentionRainDuration10: '200', retentionRainDuration15: '150',
    rainR2Duration10: '200', rainR30Duration5: '500', rainR30Duration10: '350', rainR30Duration15: '280',
    meanSlopePercent: '1', surfaces: [{ category: 'roof', area: '5000', cs: '1', cm: '0,833' }]
  };
  const factors = deriveRetentionFactors(state);
  assert.equal(factors.surchargeFactorFz, 1.15);
  assert.equal(factors.reductionFactorValid, true);
  const result = calculate(state);
  assert.equal(result.retention.active, true);
  assert.equal(result.retention.calculated, true);
  assert.equal(result.retention.durationResults.length, 3);
});
