import assert from 'node:assert/strict';
import test from 'node:test';
import { results } from '../js/modules/flooding-verification/results.js';
import { buildRetentionDurationComparison } from '../js/modules/flooding-verification/retentionDurationComparison.js';

const durationResults = [
  { durationMinutes: 5, rainIntensityLsHa: 323, throttleRainShareLsHa: 39.06, surchargeFactorFz: 1.2, reductionFactorFa: 0.984, specificStorageM3Ha: 100.55, volumeM3: 12.87, valid: true },
  { durationMinutes: 10, rainIntensityLsHa: 211, throttleRainShareLsHa: 39.06, surchargeFactorFz: 1.2, reductionFactorFa: 0.984, specificStorageM3Ha: 121.8, volumeM3: 15.59, valid: true },
  { durationMinutes: 15, rainIntensityLsHa: 161, throttleRainShareLsHa: 39.06, surchargeFactorFz: 1.2, reductionFactorFa: 0.984, specificStorageM3Ha: 129.57, volumeM3: 16.59, valid: true }
];

test('DWA duration comparison exposes exactly one governing row and explicit statuses', () => {
  const comparison = buildRetentionDurationComparison(durationResults);
  assert.equal(comparison.rows.filter(row => row.status === 'governing').length, 1);
  assert.equal(comparison.rows.find(row => row.durationMinutes === 15).statusLabel, 'maßgebend');
  assert.equal(comparison.rows.find(row => row.durationMinutes === 5).statusLabel, 'gültig');
});

test('47C.7B groups applicability, compacts governing result and prioritizes diagnostics', () => {
  const model = results({
    retentionFlowTimeMinutes: 5,
    retentionRecurrenceFrequencyPerYear: 0.5,
    meanSlopePercent: 1
  }, {
    dischargeMode: 'authority-discharge-limit',
    totalArea: 5800,
    sealedArea: 4000,
    sealedShare: 4000 / 5800,
    criticalArea: 4200,
    criticalShare: 4200 / 5800,
    requiredRainFlowLs: 47.69,
    availableFlowLs: 5,
    utilizationPercent: 953.7,
    dischargeAdequate: false,
    rainInputValid: true,
    schemaVersion: 2,
    automaticDurationMinutes: 10,
    governingDurationMinutes: 10,
    floodingCalculationAvailable: true,
    flooding: {
      equation20: { valid: true, durationMinutes: 10, rain30: 371, rain2: 211, totalAreaM2: 5800, weightedCsAreaM2: 2260, rawValueM3: 100.496, valueM3: 100.5 },
      equation21ByDuration: [{ durationMinutes: 15, rain30: 283, valueM3: 143.23, valid: true }],
      equation21Governing: { durationMinutes: 15, valueM3: 143.23, valid: true },
      governing: { source: 'equation-21', valueM3: 143.23 }
    },
    retention: {
      active: true,
      calculated: true,
      effectiveRecurrenceFrequencyPerYear: 0.5,
      throttleRainShareLsHa: 39.06,
      surchargeFactorFz: 1.2,
      reductionFactorFa: 0.984,
      durationResults,
      governing: { durationMinutes: 15, volumeM3: 16.59 }
    },
    combinedStorage: {
      planningVolumeM3: 143.23,
      dinVolumeM3: 143.23,
      dwaVolumeM3: 16.59,
      governingLabel: 'Überflutungsnachweis nach DIN 1986-100',
      governingReason: 'DIN ist maßgebend.'
    },
    warnings: ['Der verfügbare Abfluss ist kleiner als der erforderliche Regenwasserabfluss.']
  });

  const applicability = model.groups.find(group => group.title === 'DWA-A 117 – Anwendungsprüfung');
  assert.deepEqual(applicability.groups.map(group => group.title), ['Anwendungsbereich', 'Gültigkeit fA', 'Berechnung']);

  const durationGroup = model.groups.find(group => group.title === 'DWA-A 117 – Dauerstufenvergleich');
  assert.equal(durationGroup.rows.length, 3);
  assert.ok(durationGroup.rows[2].label.includes('Vs,u'));
  assert.ok(durationGroup.rows[2].label.includes('maßgebend'));

  const governingGroup = model.groups.find(group => group.title === 'DWA-A 117 – Maßgebende Dauerstufe');
  assert.equal(governingGroup.rows.length, 5);
  assert.equal(governingGroup.rows.find(row => row.label === 'Status').value, 'maßgebend');

  assert.equal(model.primary.rows.length, 8);
  assert.deepEqual(model.primary.rows.slice(0, 5).map(row => row.label), [
    'Maßgebender Nachweis',
    'DIN 1986-100',
    'DWA-A 117',
    'Maßgebende Gleichung DIN',
    'Maßgebende Regendauer DIN'
  ]);
  assert.equal(model.primary.rows.at(-1).label, 'Begründung');
  assert.equal(model.primary.rows.at(-1).span, 3);

  assert.deepEqual(model.notices.map(notice => notice.title), ['Warnungen', 'Empfehlungen']);
  assert.equal(model.notices[0].messages[0].prefix, 'Warnung');
  assert.equal(model.notices[1].messages[0].prefix, 'Empfehlung');
  assert.ok(model.notices[1].messages.some(message => message.text.includes('Notentwässerung')));
});
