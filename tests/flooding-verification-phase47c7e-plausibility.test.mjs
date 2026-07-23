import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFloodingPlausibilityModel } from '../js/modules/flooding-verification/plausibilityModel.js';
import { buildFloodingDiagnosticModel } from '../js/modules/flooding-verification/diagnosticModel.js';

const baseResult = {
  combinedStorage: { status: 'complete' },
  averageCs: 0.7,
  averageCm: 0.4,
  invalidSurfaceCount: 0,
  duplicateSourceCount: 0,
  utilizationPercent: 80,
  rainInputValid: true,
  rain: {
    r2: { 5: 300, 10: 200, 15: 150 },
    r30: { 5: 500, 10: 350, 15: 250 },
    source: { dataset: 'KOSTRA-DWD', location: 'Raster 1', version: '2020' }
  },
  flooding: {
    equation20: { rawValueM3: 10 },
    equation21ByDuration: [
      { durationMinutes: 5, rawValueM3: 8 },
      { durationMinutes: 10, rawValueM3: 10 },
      { durationMinutes: 15, rawValueM3: 12 }
    ]
  },
  warnings: []
};

const applicability = { active: false, status: 'not-active', messages: [] };

test('plausible input produces no plausibility findings', () => {
  const model = buildFloodingPlausibilityModel({ result: baseResult, applicability });
  assert.equal(model.status, 'plausible');
  assert.equal(model.issues.length, 0);
});

test('coefficient relation is treated as hard inconsistency', () => {
  const model = buildFloodingPlausibilityModel({
    result: { ...baseResult, averageCs: 0.3, averageCm: 0.6 },
    applicability
  });
  assert.equal(model.status, 'failed');
  assert.ok(model.issues.some(item => item.code === 'CM_EXCEEDS_CS' && item.severity === 'error'));
});

test('rain duration order and return period relation are checked', () => {
  const model = buildFloodingPlausibilityModel({
    result: {
      ...baseResult,
      rain: {
        ...baseResult.rain,
        r2: { 5: 200, 10: 250, 15: 150 },
        r30: { 5: 190, 10: 350, 15: 250 }
      }
    },
    applicability
  });
  assert.ok(model.issues.some(item => item.code === 'RAIN_r(D,2)_DURATION_ORDER'));
  assert.ok(model.issues.some(item => item.code === 'RAIN_RETURN_PERIOD_5'));
});

test('extreme utilization and incomplete rain source create actionable findings', () => {
  const model = buildFloodingPlausibilityModel({
    result: {
      ...baseResult,
      utilizationPercent: 1200,
      rain: { ...baseResult.rain, source: { dataset: '', location: '', version: '' } }
    },
    applicability
  });
  assert.ok(model.issues.some(item => item.code === 'EXTREME_DISCHARGE_UTILIZATION'));
  assert.ok(model.issues.some(item => item.code === 'RAIN_SOURCE_INCOMPLETE'));
  assert.ok(model.messages.some(item => item.severity === 'recommendation'));
});

test('plausibility findings feed the central diagnostic model', () => {
  const diagnostic = buildFloodingDiagnosticModel({
    result: { ...baseResult, averageCs: 0.3, averageCm: 0.6 },
    applicability,
    retentionComparison: { messages: [] }
  });
  assert.equal(diagnostic.status, 'incomplete');
  assert.ok(diagnostic.messages.errors.some(item => item.text.includes('mittlere Abflussbeiwert')));
  assert.equal(diagnostic.plausibility.status, 'failed');
});
