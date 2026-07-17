import assert from 'node:assert/strict';
import {
  authorityTableKind,
  renderDurationTable,
  renderRainfallTable,
  renderSurfaceTable
} from '../js/core/pdf/authorityTables.js';

assert.equal(authorityTableKind('4. Flächenübersicht (3)'), 'surfaces');
assert.equal(authorityTableKind('5. Regendaten und Berechnungsgrundlagen'), 'rainfall');
assert.equal(authorityTableKind('8. DIN 1986-100 – Gleichung (21), Dauerstufenvergleich'), 'din-duration');
assert.equal(authorityTableKind('10. DWA-A 117 – Dauerstufenvergleich'), 'dwa-duration');
assert.equal(authorityTableKind('1. Ergebniszusammenfassung'), '');

class FakeReport {
  constructor() {
    this.cursorY = 80;
    this.textCalls = [];
    this.rectCalls = [];
    this.lineCalls = [];
    this.sectionTitles = [];
  }
  text(value, ...rest) { this.textCalls.push([String(value), ...rest]); }
  rect(...args) { this.rectCalls.push(args); }
  line(...args) { this.lineCalls.push(args); }
  ensureSpace() { return false; }
  sectionTitle(value) { this.sectionTitles.push(value); this.cursorY += 11; }
}

const dto = {
  surfaces: [
    { name: 'Flachdach', areaType: 'Extensiv begrünt', areaM2: 1000, runoffCoefficientCs: 0.5, weightedCsAreaM2: 500 },
    { name: 'Innenhof', areaType: 'Pflasterfläche', areaM2: 500, runoffCoefficientCs: 1, weightedCsAreaM2: 500 }
  ],
  rainfall: {
    r2ByDuration: { 5: 323, 10: 211, 15: 161 },
    r30ByDuration: { 5: 570, 10: 371, 15: 283 },
    r100ByDuration: { 5: 703 }
  },
  durationComparison: {
    din: [
      { durationMinutes: 5, volumeM3: 51 },
      { durationMinutes: 15, volumeM3: 75.51 }
    ],
    dwa: [
      { durationMinutes: 5, storageVolumeM3: 10.66 },
      { durationMinutes: 15, storageVolumeM3: 15.4 }
    ]
  },
  floodingVerification: { equation21Governing: { durationMinutes: 15 } },
  retentionVerification: { governing: { durationMinutes: 15 } }
};

const surfaces = new FakeReport();
renderSurfaceTable(surfaces, dto);
assert.equal(surfaces.sectionTitles[0], '4. Flächenübersicht (2)');
assert.ok(surfaces.textCalls.some(([value]) => value === 'Flachdach'));
assert.ok(surfaces.textCalls.some(([value]) => value === 'A · Cs [m2]'));
assert.ok(surfaces.rectCalls.length >= 2);

const rainfall = new FakeReport();
renderRainfallTable(rainfall, dto);
assert.ok(rainfall.textCalls.some(([value]) => value === 'r(D,30) [l/(s·ha)]'));
assert.ok(rainfall.textCalls.some(([value]) => value === '371,00'));

const din = new FakeReport();
renderDurationTable(din, dto, 'din');
assert.ok(din.textCalls.some(([value]) => value === '75,51 m3'));
assert.ok(din.textCalls.some(([value]) => value === 'maßgebend'));

const dwa = new FakeReport();
renderDurationTable(dwa, dto, 'dwa');
assert.ok(dwa.textCalls.some(([value]) => value === '15,40 m3'));
assert.ok(dwa.textCalls.some(([value]) => value === 'maßgebend'));

console.log('Phase 47C.10C professional authority tables ok');
