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

test('result model labels equation 20 and equation 21 durations separately', () => {
  const result = calculate(authorityState);
  const model = results(authorityState, result);
  const labels = model.primary.rows.map(row => row.label);
  assert.ok(labels.includes('Regendauer Gleichung (20)'));
  assert.ok(labels.includes('Maßgebende Dauer Gleichung (21)'));
  assert.ok(!labels.includes('Maßgebende Dauer'));
});

test('incomplete DWA input remains active and reports concrete missing values', () => {
  const result = calculate({ ...authorityState, retentionSurchargeFactorFz: '', retentionRainDuration5: '', retentionRainDuration10: '', retentionRainDuration15: '' });
  assert.equal(result.retention.active, true);
  assert.equal(result.retention.calculated, false);
  assert.ok(result.retention.errors.some(message => message.includes('Zuschlagsfaktor')));
  assert.ok(result.retention.errors.some(message => message.includes('Regenspenden')));
});
