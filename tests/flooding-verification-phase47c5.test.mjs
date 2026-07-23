import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculate,
  calculateFloodingEquation20,
  calculateFloodingEquation21
} from '../js/modules/flooding-verification/logic.js';

const closeTo = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
};

test('Gleichung (20) follows the contract without applying Cs to the r(D,30) term', () => {
  const result = calculateFloodingEquation20({
    durationMinutes: 10,
    rain30: 300,
    rain2: 200,
    totalAreaM2: 1000,
    weightedCsAreaM2: 600
  });
  const expected = (300 * 1000 - 200 * 600) * 10 * 60 / (10000 * 1000);
  closeTo(result.valueM3, expected);
  assert.equal(result.valid, true);
});

test('Gleichung (21) uses documented Qab and duration', () => {
  const result = calculateFloodingEquation21({ durationMinutes: 15, rain30: 250, totalAreaM2: 1000, dischargeLs: 10 });
  const expected = (250 * 1000 / 10000 - 10) * 15 * 60 / 1000;
  closeTo(result.valueM3, expected);
  assert.equal(result.valid, true);
});

test('negative flooding volumes are clamped to zero and diagnosed', () => {
  const result = calculateFloodingEquation21({ durationMinutes: 5, rain30: 100, totalAreaM2: 100, dischargeLs: 20 });
  assert.ok(result.rawValueM3 < 0);
  assert.equal(result.valueM3, 0);
  assert.equal(result.clampedToZero, true);
});

test('calculate compares equation 20 with all equation 21 duration levels', () => {
  const result = calculate({
    schemaVersion: 2,
    surfaces: [
      { id: 'a', category: 'roof', areaType: 'metal-roof', area: '1000', cs: '1', cm: '0,9', isSealed: true },
      { id: 'b', category: 'property', areaType: 'lawn-flat', area: '1000', cs: '0,2', cm: '0,1', isSealed: false }
    ],
    meanSlopePercent: '0,5',
    rainDurationMode: 'automatic',
    rainR2Duration5: '300',
    rainR2Duration10: '200',
    rainR2Duration15: '150',
    rainR30Duration5: '500',
    rainR30Duration10: '350',
    rainR30Duration15: '280',
    dischargeMode: 'manual-full-flow',
    manualFullFlowLs: '20',
    manualFullFlowSource: 'Testwert'
  });

  assert.equal(result.governingDurationMinutes, 15);
  assert.equal(result.flooding.equation21ByDuration.length, 3);
  assert.deepEqual(result.flooding.equation21ByDuration.map(item => item.durationMinutes), [5, 10, 15]);
  const max21 = Math.max(...result.flooding.equation21ByDuration.map(item => item.valueM3));
  closeTo(result.flooding.equation21Governing.valueM3, max21);
  const expectedOverall = Math.max(result.flooding.equation20.valueM3, max21);
  closeTo(result.flooding.governing.valueM3, expectedOverall);
  assert.equal(result.floodingCalculationAvailable, true);
});

test('authority limit is the Qab source for equation 21', () => {
  const result = calculate({
    schemaVersion: 2,
    surfaces: [{ id: 'a', category: 'property', areaType: 'concrete-asphalt', area: '1000', cs: '1', cm: '0,9', isSealed: true }],
    meanSlopePercent: '2',
    rainDurationMode: 'automatic',
    rainR2Duration5: '300', rainR2Duration10: '200', rainR2Duration15: '150',
    rainR30Duration5: '500', rainR30Duration10: '350', rainR30Duration15: '280',
    dischargeMode: 'authority-discharge-limit',
    authorityLimitLs: '5',
    authorityReference: 'Bescheid'
  });
  assert.equal(result.flooding.dischargeSource, 'authority-limit');
  assert.ok(result.flooding.equation21ByDuration.every(item => item.dischargeLs === 5));
  assert.ok(result.warnings.some(message => message.includes('DWA-A 117')));
});
