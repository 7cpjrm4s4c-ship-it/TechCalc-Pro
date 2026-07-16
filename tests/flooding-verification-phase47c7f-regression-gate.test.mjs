import assert from 'node:assert/strict';
import test from 'node:test';
import { calculate } from '../js/modules/flooding-verification/calculationAdapter.js';
import { results } from '../js/modules/flooding-verification/results.js';

const completeState = () => ({
  schemaVersion: 2,
  surfaces: [
    { id: 'roof-1', category: 'roof', areaType: 'metal-roof', area: '2000', cs: '1', cm: '0,9', isSealed: true },
    { id: 'yard-1', category: 'property', areaType: 'concrete-asphalt', area: '2000', cs: '1', cm: '0,9', isSealed: true },
    { id: 'lawn-1', category: 'property', areaType: 'lawn-flat', area: '1800', cs: '0,2', cm: '0,1', isSealed: false }
  ],
  meanSlopePercent: '1,0',
  rainDurationMode: 'automatic',
  rainR2Duration5: '323',
  rainR2Duration10: '211',
  rainR2Duration15: '161',
  rainR30Duration5: '570',
  rainR30Duration10: '371',
  rainR30Duration15: '283',
  rainR100Duration5: '703',
  rainSourceDataset: 'KOSTRA-DWD',
  rainSourceLocation: 'Raster 200145',
  rainSourceVersion: '2020',
  rainEntryMode: 'manual',
  dischargeMode: 'authority-discharge-limit',
  authorityLimitLs: '5',
  authorityReference: 'Behördliche Vorgabe',
  retentionRecurrenceFrequencyPerYear: '0,5',
  retentionFlowTimeMinutes: '5',
  retentionRiskClass: 'low',
  retentionDryWeatherFlowLs: '0',
  retentionUpstreamThrottleFlowLs: '0',
  retentionRainDuration5: '',
  retentionRainDuration10: '',
  retentionRainDuration15: '',
  retentionRainByDuration: {}
});

const findGroup = (model, title) => model.groups.find(group => group.title === title);

test('complete authority scenario stays deterministic across calculation and result model', () => {
  const state = completeState();
  const first = calculate(state);
  const second = calculate(structuredClone(state));

  assert.deepEqual(second, first);
  assert.equal(first.floodingCalculationAvailable, true);
  assert.equal(first.retention.active, true);
  assert.equal(first.retention.calculated, true);
  assert.equal(first.retention.effectiveRecurrenceFrequencyPerYear, 0.5);
  assert.deepEqual(first.retention.rainByDuration, { 5: '323', 10: '211', 15: '161' });
  assert.ok(first.retention.surchargeFactorFz > 0);
  assert.ok(first.retention.reductionFactorFa > 0);
  assert.ok(first.combinedStorage.planningVolumeM3 >= first.combinedStorage.dinVolumeM3);
  assert.ok(first.combinedStorage.planningVolumeM3 >= first.combinedStorage.dwaVolumeM3);

  const model = results(state, first);
  assert.equal(model.primary.primary.value, first.combinedStorage.planningVolumeM3.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  assert.ok(findGroup(model, 'Planerische Interpretation'));
  assert.ok(findGroup(model, 'Nachweisstatus'));
  assert.ok(findGroup(model, 'DWA-A 117 – Dauerstufenvergleich'));
  assert.ok(findGroup(model, 'DWA-A 117 – Maßgebende Dauerstufe'));
  assert.equal(model.diagnostic.plausibility.status, 'plausible');
});

test('surface changes update all dependent result values without stale output', () => {
  const state = completeState();
  const before = calculate(state);
  const changed = structuredClone(state);
  changed.surfaces[0].area = '3000';
  const after = calculate(changed);

  assert.notEqual(after.totalArea, before.totalArea);
  assert.notEqual(after.requiredRainFlowLs, before.requiredRainFlowLs);
  assert.notEqual(after.flooding.governing.valueM3, before.flooding.governing.valueM3);
  assert.notEqual(after.combinedStorage.planningVolumeM3, before.combinedStorage.planningVolumeM3);
  assert.equal(results(changed, after).primary.primary.value, after.combinedStorage.planningVolumeM3.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
});

test('incomplete rain input propagates consistently through calculation, diagnostics and primary card', () => {
  const state = completeState();
  state.rainR30Duration10 = '';
  const result = calculate(state);
  const model = results(state, result);

  assert.equal(result.rainInputValid, false);
  assert.equal(result.floodingCalculationAvailable, false);
  assert.equal(model.diagnostic.status, 'incomplete');
  assert.ok(model.diagnostic.counts.errors > 0);
  assert.equal(model.primary.primary.value, '—');
});

test('manual DWA rain values override automatic two-year mapping', () => {
  const state = completeState();
  state.retentionRecurrenceFrequencyPerYear = '1,0';
  state.retentionRainDuration5 = '410';
  state.retentionRainDuration10 = '290';
  state.retentionRainDuration15 = '220';
  const result = calculate(state);

  assert.equal(result.retention.effectiveRecurrenceFrequencyPerYear, 1);
  assert.deepEqual(result.retention.rainByDuration, { 5: '410', 10: '290', 15: '220' });
  assert.equal(result.retention.automaticTwoYearFallback, false);
});
