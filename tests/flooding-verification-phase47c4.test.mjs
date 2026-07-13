import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAcceptSurfaceAdd } from '../js/modules/flooding-verification/controller.js';
import { surfaceCollectionItems } from '../js/modules/flooding-verification/schema.js';
import { calculate, lookupFullFlow, sizePipe } from '../js/modules/flooding-verification/logic.js';

const surfaceDraft = {
  surfaceCategory: 'roof',
  surfaceName: 'Norddach',
  surfaceAreaType: 'tile-roof',
  surfaceArea: '100',
  surfaceCs: '1,0',
  surfaceCm: '0,8'
};

test('Phase 47C.3.2 suppresses immediate duplicate surface actions', () => {
  assert.equal(shouldAcceptSurfaceAdd(surfaceDraft, 1000), true);
  assert.equal(shouldAcceptSurfaceAdd(surfaceDraft, 1200), false);
  assert.equal(shouldAcceptSurfaceAdd(surfaceDraft, 1700), true);
});

test('Phase 47C.3.2 renders German surface labels with explicit separation', () => {
  const [item] = surfaceCollectionItems({ surfaces: [{ id: 'a', name: 'Norddach', category: 'roof', areaType: 'tile-roof', area: '100', cs: '1,0' }] });
  assert.equal(item.title, 'Norddach ·');
  assert.match(item.subtitle, /Dachfläche/);
  assert.match(item.subtitle, /Ziegel\/Abdichtungsbahn/);
  assert.doesNotMatch(item.subtitle, /tile-roof/);
});

test('Phase 47C.4 uses exact full-flow table values and sizes the smallest adequate DN', () => {
  const existing = lookupFullFlow('DN 100', '10');
  assert.equal(existing?.qFullLs, 5.0);
  assert.equal(existing?.lookupMode, 'exact');
  assert.equal(lookupFullFlow('DN 100', '11'), null);
  assert.equal(sizePipe(6, '10')?.dn, 'DN 125');
});

test('Phase 47C.4 calculates Qr and distinguishes authority limits from Qfull', () => {
  const base = {
    schemaVersion: 2,
    surfaces: [{ id: 'a', category: 'roof', areaType: 'tile-roof', area: '1000', cs: '1,0', cm: '0,8' }],
    meanSlopePercent: '1,0',
    rainDurationMode: 'automatic',
    rainR2Duration5: '300', rainR2Duration10: '200', rainR2Duration15: '150',
    rainR30Duration5: '500', rainR30Duration10: '400', rainR30Duration15: '350',
    dischargeMode: 'authority-discharge-limit',
    authorityLimitLs: '15',
    authorityReference: 'Bescheid 123'
  };
  const result = calculate(base);
  assert.equal(result.requiredRainFlowLs, 20);
  assert.equal(result.discharge?.qFullLs, null);
  assert.equal(result.discharge?.qLimitLs, 15);
  assert.equal(result.dischargeAdequate, false);
});