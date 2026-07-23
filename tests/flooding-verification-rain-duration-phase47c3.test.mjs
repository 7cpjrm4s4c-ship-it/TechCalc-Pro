import test from 'node:test';
import assert from 'node:assert/strict';
import { automaticRainDuration, calculate } from '../js/modules/flooding-verification/logic.js';

test('Phase 47C.3 maps slope and sealed share to governing duration', () => {
  assert.equal(automaticRainDuration('0,5', 0.5), 15);
  assert.equal(automaticRainDuration('0,5', 0.51), 10);
  assert.equal(automaticRainDuration('1,0', 0.2), 10);
  assert.equal(automaticRainDuration('4,0', 0.9), 10);
  assert.equal(automaticRainDuration('4,1', 0.5), 10);
  assert.equal(automaticRainDuration('4,1', 0.51), 5);
});

test('Phase 47C.3 requires a reason before manual duration becomes active', () => {
  const base = {
    schemaVersion: 2,
    meanSlopePercent: '0,5',
    rainDurationMode: 'manual',
    manualRainDuration: '5',
    surfaces: [{ id: 'a', category: 'roof', areaType: 'metal-roof', area: '100', cs: '1,0', cm: '0,9' }],
    rainR2Duration5: '300', rainR2Duration10: '250', rainR2Duration15: '220',
    rainR30Duration5: '500', rainR30Duration10: '420', rainR30Duration15: '370'
  };
  const fallback = calculate(base);
  assert.equal(fallback.durationSource, 'automatic');
  assert.equal(fallback.governingDurationMinutes, 10);

  const manual = calculate({ ...base, manualRainDurationReason: 'Behördliche Vorgabe' });
  assert.equal(manual.durationSource, 'manual');
  assert.equal(manual.governingDurationMinutes, 5);
  assert.equal(manual.rainInputValid, true);
});
