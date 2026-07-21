import assert from 'node:assert/strict';
import test from 'node:test';
import { calculate, buildRetentionRainByDuration } from '../js/modules/flooding-verification/calculationAdapter.js';
import { results } from '../js/modules/flooding-verification/results.js';

const authorityState = {
  schemaVersion: 2,
  dischargeMode: 'authority-discharge-limit',
  authorityLimitLs: '5',
  surfaces: [{ id: 'a', category: 'property', areaType: 'concrete-asphalt', area: '10000', cs: '1', cm: '0,9', isSealed: true }],
  meanSlopePercent: '1',
  rainDurationMode: 'automatic',
  rainR2Duration5: '300', rainR2Duration10: '210', rainR2Duration15: '160',
  rainR30Duration5: '570', rainR30Duration10: '371', rainR30Duration15: '283',
  retentionRecurrenceFrequencyPerYear: '0,2',
  retentionFlowTimeMinutes: '10',
  retentionSurchargeFactorFz: '1,1',
  retentionReductionFactorFa: '0,9',
  retentionDryWeatherFlowLs: '0',
  retentionUpstreamThrottleFlowLs: '0',
  retentionRainDuration5: '420',
  retentionRainDuration10: '300',
  retentionRainDuration15: '240'
};

test('authority limit automatically activates and calculates DWA-A 117', () => {
  const result = calculate(authorityState);
  assert.equal(result.retention.active, true);
  assert.equal(result.retention.calculated, true);
  assert.equal(result.retention.durationResults.length, 3);
  assert.ok(result.retention.governing.volumeM3 >= 0);
  assert.ok(!result.warnings.some(message => message.includes('zusätzlich der Rückhaltenachweis')));
});

test('flat DWA rain inputs are mapped to the canonical duration model', () => {
  assert.deepEqual(buildRetentionRainByDuration(authorityState), { 5: '420', 10: '300', 15: '240' });
});

test('result model separates equation 20 from the equation 21 duration comparison', () => {
  const result = calculate(authorityState);
  const model = results(authorityState, result);
  const equation20 = model.groups.find(group => group.title === 'Gleichung (20)');
  const equation21 = model.groups.find(group => group.title === 'Gleichung (21) – Dauerstufenvergleich');
  const foundations = model.groups.find(group => group.title === 'Berechnungsgrundlagen');

  assert.ok(equation20);
  assert.ok(equation20.rows.some(row => row.label === 'Regendauer D der Gleichung (20)'));
  assert.ok(equation21);
  assert.ok(equation21.rows.length > 0);
  assert.ok(foundations.rows.some(row => row.label === 'Maßgebende Dauerstufe Gleichung (21)'));
  assert.ok(!model.primary.rows.some(row => row.label === 'Maßgebende Dauer'));
});

test('automatic factors and r(D,2) fallback keep authority-mode retention calculable', () => {
  const result = calculate({
    ...authorityState,
    retentionSurchargeFactorFz: '',
    retentionRainDuration5: '',
    retentionRainDuration10: '',
    retentionRainDuration15: ''
  });

  assert.equal(result.retention.active, true);
  assert.equal(result.retention.calculated, true);
  assert.equal(result.retention.automaticTwoYearFallback, true);
  assert.ok(result.retention.surchargeFactorFz > 0);
  assert.deepEqual(result.retention.rainByDuration, { 5: '300', 10: '210', 15: '160' });
  assert.ok(!result.retention.errors.some(message => message.includes('Zuschlagsfaktor')));
  assert.ok(!result.retention.errors.some(message => message.includes('Regenspenden')));
});
