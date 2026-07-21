import test from 'node:test';
import assert from 'node:assert/strict';
import schema from '../js/modules/flooding-verification/schema.js';
import {
  buildFloodingSurfaceRecord,
  hydrateFloodingSurfaceRecord
} from '../js/modules/flooding-verification/controller.js';
import { calculate } from '../js/modules/flooding-verification/logic.js';
import { savedVerificationModel } from '../js/modules/flooding-verification/savedRecords.js';

const draft = {
  surfaces: [], activeSurfaceId: null,
  surfaceCategory: 'roof', surfaceName: 'Norddach', surfaceAreaType: 'tile-roof',
  surfaceArea: '100', surfaceCs: '1,0', surfaceCm: '0,8'
};

test('47C.4.4 valid surface drafts build a normalized saved record', () => {
  const record = buildFloodingSurfaceRecord({
    currentState: draft,
    id: 'surface-1'
  });

  assert.equal(record.id, 'surface-1');
  assert.equal(record.name, 'Norddach');
  assert.equal(record.category, 'roof');
  assert.equal(record.areaType, 'tile-roof');
  assert.equal(record.area, '100');
  assert.equal(record.cs, '1,0');
  assert.equal(record.cm, '0,8');
  assert.equal(record.origin, 'manual');

  assert.equal(buildFloodingSurfaceRecord({
    currentState: { ...draft, surfaceArea: '' }
  }), null);
});

test('47C.4.4 stored surfaces hydrate the complete editor state', () => {
  const surface = {
    id: 'surface-1', category: 'property', name: 'Hof',
    areaType: 'concrete-asphalt', area: '80', cs: '1,0', cm: '0,9'
  };
  const patch = hydrateFloodingSurfaceRecord({ item: surface });

  assert.equal(patch.activeSurfaceId, surface.id);
  assert.equal(patch.surfaceName, 'Hof');
  assert.equal(patch.surfaceCategory, 'property');
  assert.equal(patch.surfaceAreaType, 'concrete-asphalt');
  assert.equal(patch.surfaceArea, '80');
  assert.equal(patch.surfaceCs, '1,0');
  assert.equal(patch.surfaceCm, '0,9');
});

test('47C.4.4 mean slope is an immediate field and changes the automatic duration', () => {
  const field = schema.fields.find(item => item.key === 'meanSlopePercent');
  assert.equal(field.commit, 'immediate');
  const base = {
    surfaces: [{ id: 'a', category: 'property', areaType: 'lawn-flat', area: '100', cs: '0,2', cm: '0,1', isSealed: false }],
    rainDurationMode: 'automatic',
    rainR2Duration5: '300', rainR2Duration10: '250', rainR2Duration15: '200',
    rainR30Duration5: '500', rainR30Duration10: '400', rainR30Duration15: '350',
    dischargeMode: 'manual-full-flow', manualFullFlowLs: '10'
  };
  assert.equal(calculate({ ...base, meanSlopePercent: '0,5' }).governingDurationMinutes, 15);
  assert.equal(calculate({ ...base, meanSlopePercent: '2,0' }).governingDurationMinutes, 10);
});

test('47C.4.4 snapshot action is visibly enabled and saved mode controls are explicit', () => {
  const snapshot = schema.fields.find(item => item.key === 'rainwaterImport');
  assert.equal(snapshot.disabled, undefined);
  assert.equal(snapshot.variant, 'primary');
  assert.equal(savedVerificationModel({ activeVerificationId: null }).addDisabled, false);
  assert.equal(savedVerificationModel({ activeVerificationId: null }).updateDisabled, true);
  assert.equal(savedVerificationModel({ activeVerificationId: 'saved-1' }).addDisabled, true);
  assert.equal(savedVerificationModel({ activeVerificationId: 'saved-1' }).updateDisabled, false);
});