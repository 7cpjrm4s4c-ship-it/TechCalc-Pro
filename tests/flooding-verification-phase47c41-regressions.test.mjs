import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, lookupFullFlow, tableSlopePercent } from '../js/modules/flooding-verification/logic.js';
import { floodingSurfaceSubtitle } from '../js/modules/flooding-verification/controller.js';
import { verificationSnapshot, hydrateVerification, savedVerificationModel } from '../js/modules/flooding-verification/savedRecords.js';

const imported = {
  id: 'rain-1', sourceModule: 'rainwater', sourceId: 'source-1', origin: 'imported',
  category: 'property', areaType: 'concrete-asphalt', area: '800', cs: '0,2', cm: '0,1', isSealed: true
};

test('imported surfaces participate in the hydraulic calculation', () => {
  const result = calculate({
    schemaVersion: 2,
    surfaces: [imported],
    meanSlopePercent: '1',
    rainDurationMode: 'automatic',
    rainR2Duration10: '211,7',
    rainR30Duration5: '570', rainR30Duration10: '317,7', rainR30Duration15: '283,3',
    dischargeMode: 'table-size-pipe', pipeSlopePermille: '1,0'
  });
  assert.equal(result.validSurfaceCount, 1);
  assert.equal(result.totalArea, 800);
  assert.equal(result.weightedCsArea, 160);
  assert.ok(result.requiredRainFlowLs > 0);
});

test('pipe slope is interpreted and reported in percent', () => {
  assert.equal(tableSlopePercent('1,0'), 1);
  assert.equal(tableSlopePercent('10'), 10);
  assert.equal(lookupFullFlow('DN 125', '1,0')?.slopePercent, 1);
});

test('collection labels remain German and separated', () => {
  const item = { ...imported, name: 'Innenhof' };
  assert.equal(item.name, 'Innenhof');
  assert.equal(floodingSurfaceSubtitle(item), 'Grundstücksfläche · Beton/Asphalt');
});

test('saved verification snapshot keeps all surfaces and can be hydrated', () => {
  const current = { projectName: 'Projekt A', surfaces: [imported], savedVerifications: [], savedVerificationName: 'Nachweis A' };
  const record = { id: 'saved-1', ...verificationSnapshot(current, { totalArea: 800, surfaceCount: 1, dischargeMode: 'table-size-pipe' }) };
  assert.equal(record.state.surfaces.length, 1);
  const hydrated = hydrateVerification(record, { savedVerifications: [record] });
  assert.equal(hydrated.surfaces.length, 1);
  assert.equal(hydrated.activeVerificationId, 'saved-1');
  assert.equal(savedVerificationModel({ savedVerifications: [record] }).items.length, 1);
});
