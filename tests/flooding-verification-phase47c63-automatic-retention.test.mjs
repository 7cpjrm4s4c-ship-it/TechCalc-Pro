import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRetentionRainByDuration, deriveRetentionFactors } from '../js/modules/flooding-verification/calculationAdapter.js';
import { evaluateDwa117Applicability } from '../js/modules/flooding-verification/retentionApplicability.js';

const baseState = {
  retentionRecurrenceFrequencyPerYear: '0,5',
  rainR2Duration5: '323',
  rainR2Duration10: '211',
  rainR2Duration15: '161',
  retentionRainDuration5: '',
  retentionRainDuration10: '',
  retentionRainDuration15: '',
  retentionRiskClass: 'medium',
  retentionFlowTimeMinutes: '10',
  authorityLimitLs: '5',
  retentionDryWeatherFlowLs: '0',
  retentionUpstreamThrottleFlowLs: '0',
  surfaces: [{ area: 1000, cm: 0.5 }]
};

test('maps r(D,2) automatically to r(D,n) for n = 0.5/a', () => {
  assert.deepEqual(buildRetentionRainByDuration(baseState), { 5: '323', 10: '211', 15: '161' });
});

test('explicit retention rain values override automatic r(D,2) values', () => {
  assert.equal(buildRetentionRainByDuration({ ...baseState, retentionRainDuration10: '250' })[10], '250');
});

test('does not relabel out-of-domain fA as a missing input', () => {
  const factors = deriveRetentionFactors({
    ...baseState,
    surfaces: [{ area: 100, cm: 0.2 }]
  });
  assert.equal(factors.reductionFactorWithinDomain, false);
  const applicability = evaluateDwa117Applicability({
    enabled: true,
    dischargeMode: 'authority-discharge-limit',
    catchmentAreaHa: 0.01,
    flowTimeMinutes: 10,
    recurrenceFrequencyPerYear: 0.5,
    throttleRainShareLsHa: factors.throttleRainShareLsHa,
    surchargeFactorFz: factors.surchargeFactorFz,
    reductionFactorFa: factors.reductionFactorFa
  });
  assert.equal(applicability.status, 'preliminary-only');
  assert.ok(applicability.messages.some(message => message.includes('fA-Gültigkeit')));
  assert.ok(applicability.messages.every(message => !message.includes('fehlen: Abminderungsfaktor')));
});
