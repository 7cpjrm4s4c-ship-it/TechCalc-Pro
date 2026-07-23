import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { ENGINEERING_NUMBER_FORMATS, formatEngineeringNumber } from '../js/core/numberService.js';
import { results } from '../js/modules/flooding-verification/results.js';

test('central engineering profiles format technical quantities consistently in German', () => {
  assert.equal(formatEngineeringNumber(143.234, 'volume'), '143,23');
  assert.equal(formatEngineeringNumber(47.685, 'flow'), '47,69');
  assert.equal(formatEngineeringNumber(1234.5, 'area'), '1.234,50');
  assert.equal(formatEngineeringNumber(69.04, 'percent'), '69,0');
  assert.equal(formatEngineeringNumber(1.234, 'factor'), '1,23');
  assert.equal(formatEngineeringNumber(323.456, 'rainIntensity'), '323,46');
  assert.equal(formatEngineeringNumber(15, 'duration'), '15');
  assert.equal(formatEngineeringNumber(0, 'volume'), '0,00');
  assert.equal(formatEngineeringNumber(undefined, 'volume'), '—');
});

test('engineering profile contract exposes the agreed precision per quantity', () => {
  assert.deepEqual(ENGINEERING_NUMBER_FORMATS.volume, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  assert.deepEqual(ENGINEERING_NUMBER_FORMATS.flow, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  assert.deepEqual(ENGINEERING_NUMBER_FORMATS.area, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  assert.deepEqual(ENGINEERING_NUMBER_FORMATS.percent, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  assert.deepEqual(ENGINEERING_NUMBER_FORMATS.factor, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  assert.deepEqual(ENGINEERING_NUMBER_FORMATS.rainIntensity, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

test('flooding result model uses central profiles for visible numeric output', () => {
  const model = results({ meanSlopePercent: 2, schemaVersion: 2 }, {
    schemaVersion: 2,
    totalArea: 1234.5,
    sealedArea: 1000,
    sealedShare: 0.69,
    criticalArea: 850,
    criticalShare: 0.69,
    requiredRainFlowLs: 47.685,
    availableFlowLs: 60,
    utilizationPercent: 79.475,
    dischargeAdequate: true,
    dischargeMode: 'manual-full-flow',
    rainInputValid: true,
    flooding: {
      equation20: { valid: true, durationMinutes: 10, rain30: 323.456, rain2: 200.123, totalAreaM2: 1234.5, weightedCsAreaM2: 1000.555, rawValueM3: 143.234, valueM3: 143.234 },
      equation21ByDuration: [],
      equation21Governing: {},
      governing: { source: 'equation-20' }
    },
    retention: { active: false, durationResults: [] },
    combinedStorage: { planningVolumeM3: 143.234, dinVolumeM3: 143.234, governingLabel: 'DIN 1986-100', governingReason: 'DIN ist maßgebend.' }
  });

  assert.equal(model.primary.primary.value, '143,23');
  assert.equal(model.primary.rows.find(row => row.label === 'DIN 1986-100').value, '143,23');
  assert.equal(model.primary.rows.find(row => row.label === 'Kritischer Flächenanteil').value, '69,0');

  const discharge = model.groups.find(group => group.title === 'Leitungs- und Abflussnachweis');
  assert.equal(discharge.rows.find(row => row.label.includes('Erforderlicher Regenwasserabfluss')).value, '47,69');
  assert.equal(discharge.rows.find(row => row.label === 'Auslastung').value, '79,5');

  const equation20 = model.groups.find(group => group.title === 'Gleichung (20)');
  assert.equal(equation20.rows.find(row => row.label === 'r(10,30)').value, '323,46');
  assert.equal(equation20.rows.find(row => row.label === 'Gesamtfläche Ages').value, '1.234,50');
  assert.equal(equation20.rows.find(row => row.label === 'Rohwert').value, '143,23');
});

test('flooding results contain no local number formatter', () => {
  const source = readFileSync(new URL('../js/modules/flooding-verification/results.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\.toLocaleString\s*\(/);
  assert.doesNotMatch(source, /\.toFixed\s*\(/);
  assert.match(source, /formatEngineeringNumber/);
});