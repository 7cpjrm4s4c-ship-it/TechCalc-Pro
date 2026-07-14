import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { automaticRainDuration, calculate } from '../js/modules/flooding-verification/logic.js';
import { buildFloodingSurfaceRecord } from '../js/modules/flooding-verification/controller.js';

const viewSource = fs.readFileSync(new URL('../js/modules/flooding-verification/view.js', import.meta.url), 'utf8');
const schemaSource = fs.readFileSync(new URL('../js/modules/flooding-verification/schema.js', import.meta.url), 'utf8');

test('Phase 47C.4.5 uses central stack spacing for every dynamic island', () => {
  assert.match(viewSource, /class="tc-stack" data-flooding-dynamic="surface-form"/);
  assert.match(viewSource, /class="tc-stack" data-flooding-dynamic="calculation-form"/);
  assert.match(viewSource, /class="tc-stack" data-flooding-dynamic="result"/);
});

test('Phase 47C.4.5 applies documented duration thresholds', () => {
  assert.equal(automaticRainDuration('0,5', 0.5), 15);
  assert.equal(automaticRainDuration('0,5', 0.51), 10);
  assert.equal(automaticRainDuration('2,0', 0.2), 10);
  assert.equal(automaticRainDuration('5,0', 0.5), 10);
  assert.equal(automaticRainDuration('5,0', 0.51), 5);
});

test('Phase 47C.4.5 recalculates sealed state from the selected area type', () => {
  const existing = { id: 'a', isSealed: false, areaType: 'lawn-flat' };
  const record = buildFloodingSurfaceRecord({
    currentState: {
      surfaces: [existing], surfaceCategory: 'property', surfaceAreaType: 'concrete-asphalt',
      surfaceArea: '100', surfaceCs: '1', surfaceCm: '0,9'
    },
    id: 'a', name: 'Hof', existing
  });
  assert.equal(record.isSealed, true);
});

test('Phase 47C.4.5 includes sealed roof and property areas in the share', () => {
  const result = calculate({
    schemaVersion: 2,
    surfaces: [
      { id: 'r', category: 'roof', areaType: 'tile-roof', area: '100', cs: '1', cm: '0,8' },
      { id: 'p', category: 'property', areaType: 'concrete-asphalt', area: '100', cs: '1', cm: '0,9' },
      { id: 'g', category: 'property', areaType: 'lawn-flat', area: '200', cs: '0,2', cm: '0,1' }
    ],
    meanSlopePercent: '0,5', rainDurationMode: 'automatic',
    rainR2Duration5: '300', rainR2Duration10: '200', rainR2Duration15: '150',
    rainR30Duration5: '500', rainR30Duration10: '400', rainR30Duration15: '350',
    dischargeMode: 'manual-full-flow', manualFullFlowLs: '100'
  });
  assert.equal(result.sealedArea, 200);
  assert.equal(result.totalArea, 400);
  assert.equal(result.sealedShare, 0.5);
  assert.equal(result.governingDurationMinutes, 15);
});

test('Phase 47C.4.5 documents that roof and property surfaces form the sealed share', () => {
  assert.match(schemaSource, /Dach- und Grundstücksflächen/);
});
