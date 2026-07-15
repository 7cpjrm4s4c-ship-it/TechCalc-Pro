import assert from 'node:assert/strict';
import { resolveRetentionRainInput } from '../js/modules/flooding-verification/calculationAdapter.js';
import { buildCalculationDisplayState } from '../js/modules/flooding-verification/view.js';

const state = {
  retentionRecurrenceFrequencyPerYear: '1',
  retentionRainDuration5: '',
  retentionRainDuration10: '',
  retentionRainDuration15: '',
  retentionRainByDuration: {},
  rainR2Duration5: '323',
  rainR2Duration10: '211',
  rainR2Duration15: '161'
};

const resolved = resolveRetentionRainInput(state);
assert.equal(resolved.automaticTwoYearFallback, true);
assert.equal(resolved.effectiveRecurrence, 0.5);
assert.deepEqual({ ...resolved.rainByDuration }, { 5: '323', 10: '211', 15: '161' });

const display = buildCalculationDisplayState(state, {
  retention: {
    rainByDuration: resolved.rainByDuration,
    effectiveRecurrenceFrequencyPerYear: resolved.effectiveRecurrence,
    dryWeatherFlowLs: 0,
    upstreamThrottleFlowLs: 0
  }
});
assert.equal(display.retentionRecurrenceFrequencyPerYear, '0,5');
assert.equal(display.retentionRainDuration5, '323');
assert.equal(display.retentionRainDuration10, '211');
assert.equal(display.retentionRainDuration15, '161');

const projectSpecific = resolveRetentionRainInput({
  ...state,
  retentionRecurrenceFrequencyPerYear: '1',
  retentionRainDuration5: '350',
  retentionRainDuration10: '250',
  retentionRainDuration15: '190'
});
assert.equal(projectSpecific.automaticTwoYearFallback, false);
assert.equal(projectSpecific.effectiveRecurrence, 1);
assert.deepEqual({ ...projectSpecific.rainByDuration }, { 5: '350', 10: '250', 15: '190' });

console.log('flooding-verification-retention-rain-recurrence-regression: ok');
