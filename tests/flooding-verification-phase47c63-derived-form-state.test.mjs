import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCalculationDisplayState } from '../js/modules/flooding-verification/view.js';

test('automatic retention values hydrate the calculation form display state', () => {
  const state = {
    retentionDryWeatherFlowLs: '0',
    retentionUpstreamThrottleFlowLs: '0',
    retentionRainDuration5: '',
    retentionRainDuration10: '',
    retentionRainDuration15: ''
  };
  const result = {
    retention: {
      dryWeatherFlowLs: 0,
      upstreamThrottleFlowLs: 0,
      rainByDuration: { 5: 323, 10: 211, 15: 161 }
    }
  };

  const display = buildCalculationDisplayState(state, result);
  assert.equal(display.retentionDryWeatherFlowLs, '0');
  assert.equal(display.retentionUpstreamThrottleFlowLs, '0');
  assert.equal(display.retentionRainDuration5, '323');
  assert.equal(display.retentionRainDuration10, '211');
  assert.equal(display.retentionRainDuration15, '161');
});

test('manual retention rain values keep precedence over derived values', () => {
  const display = buildCalculationDisplayState({
    retentionRainDuration5: '400',
    retentionRainDuration10: '300',
    retentionRainDuration15: '200'
  }, {
    retention: { rainByDuration: { 5: 323, 10: 211, 15: 161 } }
  });

  assert.equal(display.retentionRainDuration5, '400');
  assert.equal(display.retentionRainDuration10, '300');
  assert.equal(display.retentionRainDuration15, '200');
});
