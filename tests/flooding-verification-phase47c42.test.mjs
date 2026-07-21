import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, lookupFullFlow, resolvePipeSlopePercent, sizePipe } from '../js/modules/flooding-verification/logic.js';
import schema from '../js/modules/flooding-verification/schema.js';

test('47C.4.2 uses percent as the canonical pipe slope', () => {
  assert.equal(resolvePipeSlopePercent({ pipeSlopePercent: '1,0' }), 1);
  assert.equal(resolvePipeSlopePercent({ pipeSlopePermille: '10' }), 1);
  assert.equal(lookupFullFlow('DN 125', '1,0')?.qFullLs, 7.7);
});

test('47C.4.2 dimensions the smallest sufficient nominal diameter', () => {
  const selected = sizePipe(7.62, '1,0');
  assert.equal(selected?.dn, 'DN 125');
  assert.equal(selected?.qFullLs, 7.7);
});

test('47C.4.2 calculates dimensioning from the visible percent value', () => {
  const result = calculate({
    schemaVersion: 2,
    dischargeMode: 'table-size-pipe',
    pipeSlopePercent: '1,0',
    meanSlopePercent: '1,0',
    rainDurationMode: 'automatic',
    surfaces: [
      { id: 'roof', category: 'roof', areaType: 'green-extensive-10', area: '500', cs: '0,4', cm: '0,2' },
      { id: 'yard', category: 'property', areaType: 'green-intensive', area: '800', cs: '0,2', cm: '0,1' }
    ],
    rainR2Duration5: '323,3', rainR2Duration10: '211,7', rainR2Duration15: '161,1',
    rainR30Duration5: '570', rainR30Duration10: '317,7', rainR30Duration15: '283,3'
  });
  assert.equal(Number(result.requiredRainFlowLs.toFixed(3)), 7.621);
  assert.equal(result.discharge?.dn, 'DN 125');
  assert.equal(result.calculationAvailable, true);
});

test('47C.4.2 removes the misleading flooding-retention mode switch', () => {
  assert.equal(schema.fields.some(field => field.key === 'calculationMode'), false);
  assert.deepEqual(schema.groups[0].fields, [
    'rainR2Duration5',
    'rainR2Duration10',
    'rainR2Duration15',
    'rainR30Duration5',
    'rainR30Duration10',
    'rainR30Duration15',
    'rainR100Duration5'
  ]);
});
