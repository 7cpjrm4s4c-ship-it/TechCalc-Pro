import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateSurface } from '../js/modules/flooding-verification/logic.js';

test('Phase 47C.2 validates surface boundaries', () => {
  assert.equal(validateSurface({ category: 'roof', area: '100', cs: '1,0', cm: '0,9' }).valid, true);
  assert.equal(validateSurface({ category: 'roof', area: '0', cs: '1,1', cm: '-0,1' }).valid, false);
});

test('Phase 47C.2 calculates deterministic roof and property totals', () => {
  const result = calculate({
    schemaVersion: 2,
    surfaces: [
      { id: 'roof-1', category: 'roof', area: '100', cs: '1,0', cm: '0,9' },
      { id: 'property-1', category: 'property', area: '50', cs: '0,7', cm: '0,6' }
    ]
  });

  assert.equal(result.surfaceCount, 2);
  assert.equal(result.validSurfaceCount, 2);
  assert.equal(result.roofArea, 100);
  assert.equal(result.propertyArea, 50);
  assert.equal(result.totalArea, 150);
  assert.equal(result.weightedCsArea, 135);
  assert.equal(result.weightedCmArea, 120);
});

test('Phase 47C.2 ignores invalid records in totals', () => {
  const result = calculate({ surfaces: [
    { id: 'valid', category: 'roof', area: '25', cs: '0,8', cm: '0,5' },
    { id: 'invalid', category: 'property', area: '-5', cs: '2', cm: '0,5' }
  ] });

  assert.equal(result.invalidSurfaceCount, 1);
  assert.equal(result.totalArea, 25);
  assert.equal(result.weightedCsArea, 20);
});
