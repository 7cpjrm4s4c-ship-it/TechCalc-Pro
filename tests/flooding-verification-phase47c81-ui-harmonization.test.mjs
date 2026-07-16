import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { floodingSurfaceSchema, floodingCalculationSchema } from '../js/modules/flooding-verification/schema.js';

const field = (schema, key) => schema.fields.find(item => item.key === key);

test('surface type options follow the same roof/property separation as the rainwater module', () => {
  const options = field(floodingSurfaceSchema, 'surfaceAreaType').options;
  const roofValues = options({ surfaceCategory: 'roof' }).map(item => item.value);
  const propertyValues = options({ surfaceCategory: 'property' }).map(item => item.value);

  assert.ok(roofValues.includes('metal-roof'));
  assert.ok(!roofValues.includes('concrete-asphalt'));
  assert.ok(propertyValues.includes('concrete-asphalt'));
  assert.ok(!propertyValues.includes('metal-roof'));
});

test('DWA scope copy is rendered through the central notice field contract', () => {
  const group = floodingCalculationSchema.groups.find(item => item.title === 'Rückhalteraumnachweis nach DWA-A 117');
  const notice = field(floodingCalculationSchema, 'retentionScopeNotice');

  assert.equal(group.afterHtml, undefined);
  assert.ok(group.fields.includes('retentionScopeNotice'));
  assert.equal(notice.type, 'notice');
  assert.equal(notice.tone, 'compact');
  assert.equal(notice.visibleWhen({ dischargeMode: 'authority-discharge-limit' }), true);
  assert.equal(notice.visibleWhen({ dischargeMode: 'manual-full-flow' }), false);
});

test('central schema layout makes notices, actions and stats full width', () => {
  const css = readFileSync(new URL('../css/components-polish.css', import.meta.url), 'utf8');
  assert.match(css, /\.tc-fields\s*>\s*\.empty-state/);
  assert.match(css, /\.tc-fields\s*>\s*\.tc-action-row/);
  assert.match(css, /\.tc-fields\s*>\s*\.inline-stats/);
  assert.match(css, /grid-column:\s*1\s*\/\s*-1/);
});
