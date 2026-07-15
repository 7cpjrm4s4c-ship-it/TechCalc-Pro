import assert from 'node:assert/strict';
import { deriveCombinedStorage } from '../js/modules/flooding-verification/calculationAdapter.js';
import { results } from '../js/modules/flooding-verification/results.js';

const dinGoverns = deriveCombinedStorage({
  flooding: { governing: { valueM3: 143.23 } },
  retention: { calculated: true, governing: { volumeM3: 16.59 } }
}, true);
assert.equal(dinGoverns.planningVolumeM3, 143.23);
assert.equal(dinGoverns.governingSource, 'din-1986-100');
assert.equal(dinGoverns.governingLabel, 'DIN 1986-100');
assert.equal(dinGoverns.status, 'complete');
assert.equal(dinGoverns.requiresDwaCheck, true);
assert.match(dinGoverns.governingReason, /DIN 1986-100/);

const dwaGoverns = deriveCombinedStorage({
  flooding: { governing: { valueM3: 40 } },
  retention: { calculated: true, governing: { volumeM3: 55 } }
}, true);
assert.equal(dwaGoverns.planningVolumeM3, 55);
assert.equal(dwaGoverns.governingSource, 'dwa-a-117');
assert.equal(dwaGoverns.governingLabel, 'DWA-A 117');
assert.equal(dwaGoverns.status, 'complete');
assert.match(dwaGoverns.governingReason, /größere erforderliche Speichervolumen/);

const equal = deriveCombinedStorage({
  flooding: { governing: { valueM3: 25 } },
  retention: { calculated: true, governing: { volumeM3: 25 } }
}, true);
assert.equal(equal.planningVolumeM3, 25);
assert.equal(equal.governingSource, 'both');
assert.equal(equal.governingLabel, 'DIN 1986-100 und DWA-A 117');
assert.equal(equal.status, 'complete');

const noAuthority = deriveCombinedStorage({
  flooding: { governing: { valueM3: 30 } },
  retention: { calculated: true, governing: { volumeM3: 80 } }
}, false);
assert.equal(noAuthority.planningVolumeM3, 30);
assert.equal(noAuthority.governingSource, 'din-1986-100');
assert.equal(noAuthority.status, 'din-only');
assert.equal(noAuthority.dwaVolumeM3, null);

const pendingDwa = deriveCombinedStorage({
  flooding: { governing: { valueM3: 31 } },
  retention: { calculated: false, governing: null }
}, true);
assert.equal(pendingDwa.planningVolumeM3, 31);
assert.equal(pendingDwa.status, 'pending-dwa');
assert.match(pendingDwa.governingLabel, /DWA-A 117 noch offen/);

const pendingDin = deriveCombinedStorage({
  flooding: { governing: null },
  retention: { calculated: true, governing: { volumeM3: 44 } }
}, true);
assert.equal(pendingDin.planningVolumeM3, 44);
assert.equal(pendingDin.status, 'pending-din');
assert.match(pendingDin.governingLabel, /DIN noch offen/);

const incomplete = deriveCombinedStorage({
  flooding: { governing: null },
  retention: { calculated: false, governing: null }
}, true);
assert.equal(incomplete.planningVolumeM3, null);
assert.equal(incomplete.status, 'incomplete');
assert.equal(incomplete.governingSource, 'unavailable');

const model = results({}, {
  combinedStorage: dinGoverns,
  floodingCalculationAvailable: true,
  flooding: {
    governing: { source: 'equation-21', valueM3: 143.23 },
    equation20: { valid: true, durationMinutes: 10, valueM3: 100.5 },
    equation21Governing: { valid: true, durationMinutes: 15, valueM3: 143.23 },
    equation21ByDuration: []
  },
  retention: {
    active: true,
    calculated: true,
    governing: { durationMinutes: 15, volumeM3: 16.59 },
    durationResults: [{ durationMinutes: 15, rainIntensityLsHa: 161, volumeM3: 16.59, valid: true }]
  },
  dischargeMode: 'authority-discharge-limit',
  criticalShare: 0.69,
  warnings: []
});
assert.equal(model.primary.primary.label, 'Planerisch anzusetzendes Speichervolumen');
assert.equal(model.primary.primary.value, '143,23');
assert.equal(model.primary.rows.find(row => row.label === 'Maßgebender Nachweis')?.value, 'DIN 1986-100');
assert.equal(model.primary.rows.find(row => row.label === 'DIN 1986-100')?.value, '143,23');
assert.equal(model.primary.rows.find(row => row.label === 'DWA-A 117')?.value, '16,59');
assert.equal(model.primary.rows.filter(row => row.label === 'Planerisch anzusetzendes Speichervolumen').length, 0);
assert.equal(model.primary.rows.filter(row => row.label === 'DIN 1986-100').length, 1);
assert.equal(model.primary.rows.filter(row => row.label === 'DWA-A 117').length, 1);

console.log('flooding-verification-combined-storage: ok');
