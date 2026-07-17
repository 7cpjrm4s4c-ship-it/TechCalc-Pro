import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildFloodingReportSections } from '../js/core/pdf/floodingReportSections.js';

const surfaces = Array.from({ length: 205 }, (_, index) => ({
  id: `surface-${index + 1}`,
  name: `Fläche ${index + 1}`,
  areaType: 'Dachfläche',
  areaM2: 100 + index,
  runoffCoefficientCs: 1,
  meanRunoffCoefficientCm: 0.9,
  weightedCsAreaM2: 100 + index,
  source: index % 2 ? 'local' : 'rainwater',
  imported: index % 2 === 0
}));

const durations = Array.from({ length: 101 }, (_, index) => ({
  durationMinutes: index + 1,
  rainIntensityLsHa: 200 - index,
  specificStorageM3Ha: 10 + index,
  volumeM3: 1 + index / 10,
  valid: true
}));

const dto = {
  metadata: {
    dtoType: 'techcalc.flooding-verification.report', dtoVersion: 1,
    moduleTitle: 'Überflutungsnachweis', schemaVersion: 2,
    appVersion: '1.4.0-dev.2', generatedAt: '2026-07-17T12:00:00.000Z'
  },
  projectReference: { projectName: 'Testprojekt', authorityName: 'Behörde' },
  summary: {
    status: 'complete', planningVolumeM3: 12.5, dinVolumeM3: 12.5, dwaVolumeM3: 11,
    governingLabel: 'DIN 1986-100', governingReason: 'DIN ist maßgebend.', rule: 'Größerer Wert ist anzusetzen.'
  },
  interpretation: {
    summary: 'Nachweis vollständig.', discharge: 'Leitung ausreichend.', dwa: 'Anwendbar.',
    normative: 'DIN 1986-100 und DWA-A 117.', recommendation: 'Volumen bereitstellen.'
  },
  surfaces,
  rainfall: {
    entryMode: 'manual', durationMode: 'automatic', automaticDurationMinutes: 10,
    governingDurationMinutes: 10, sourceDataset: 'KOSTRA-DWD', sourceLocation: 'Teststadt',
    sourceVersion: '2020', valid: true,
    r2ByDuration: { 5: 300, 10: 250, 15: 220 },
    r30ByDuration: { 5: 500, 10: 420, 15: 380 }, r100ByDuration: { 5: 620 }
  },
  hydraulics: {
    dischargeMode: 'table-existing-pipe', requiredRainFlowLs: 12, availableFlowLs: 18,
    utilizationPercent: 66.7, adequate: true, pipeNominalDiameterDn: 'DN 150', pipeSlopePercent: 1
  },
  floodingVerification: {
    equation20: { valid: true, durationMinutes: 10, rain30: 420, rain2: 250, totalAreaM2: 1000, weightedCsAreaM2: 900, rawValueM3: 12.5, valueM3: 12.5 },
    equation21ByDuration: durations.slice(0, 3), equation21Governing: durations[2],
    governing: { source: 'equation-20', durationMinutes: 10, valueM3: 12.5 }, totalAreaM2: 1000
  },
  retentionVerification: {
    active: true, calculated: true, effectiveRecurrenceFrequencyPerYear: 0.5,
    surchargeFactorFz: 1.15, reductionFactorFa: 0.9, throttleRainShareLsHa: 10,
    durationResults: durations, governing: durations[100],
    factorSource: { surcharge: 'DWA-A 117 Tabelle 2', reduction: 'DWA-A 117 Anhang B', rain: 'KOSTRA-DWD' }
  },
  diagnostics: {
    status: 'complete', statusLabel: 'vollständig', statusReason: 'Alle Prüfungen erfolgreich.',
    counts: { errors: 0, warnings: 1, recommendations: 1, hints: 0 },
    items: [{ type: 'warning', title: 'Prüfhinweis', message: 'Randbedingung dokumentieren.', recommendation: 'Behördenvorgabe beilegen.' }]
  },
  sources: [
    { id: 'DIN-1986-100', title: 'DIN 1986-100', role: 'Überflutungsnachweis' },
    { id: 'DWA-A-117', title: 'DWA-A 117', role: 'Rückhalteraumnachweis' }
  ]
};

const sections = buildFloodingReportSections(dto);
assert.equal(sections.length, 12, 'Behördennachweis muss zwölf definierte Kapitel enthalten.');
assert.deepEqual(sections.map(section => section.title.split('.')[0]), ['1','2','3','4','5','6','7','8','9','10','11','12']);
assert.match(sections[0].title, /Ergebniszusammenfassung/);
assert.match(sections[3].title, /Flächenübersicht \(205\)/);
assert.ok(sections[3].rows.length >= 205 * 6, 'Große Flächenlisten müssen vollständig gemappt werden.');
assert.ok(sections[9].rows.length >= 101, 'Große DWA-Dauerstufenlisten müssen vollständig gemappt werden.');
assert.match(sections[11].rows.map(row => row.join(' ')).join(' '), /DIN 1986-100/);
assert.doesNotThrow(() => JSON.stringify(sections));
assert.deepEqual(buildFloodingReportSections({ metadata: { dtoType: 'unknown' } }), []);

const builderSource = fs.readFileSync(new URL('../js/core/pdf/floodingReportSections.js', import.meta.url), 'utf8');
const mapperSource = fs.readFileSync(new URL('../js/core/pdf/pdfDataMapping.js', import.meta.url), 'utf8');
const layoutSource = fs.readFileSync(new URL('../js/core/pdf/pdfLayout.js', import.meta.url), 'utf8');
assert.doesNotMatch(builderSource, /document\.|querySelector|innerHTML|canvas/i, 'Section Builder muss DOM-frei bleiben.');
assert.match(builderSource, /formatEngineeringNumber/, 'Zahlenformatierung muss den zentralen Number-Service verwenden.');
assert.match(mapperSource, /buildFloodingReportSections\(moduleData\.reportDto\)/, 'Typed DTO muss in zentrale PDF-Abschnitte überführt werden.');
assert.match(mapperSource, /reportSource === 'typed-dto'/, 'Typed-DTO-Pfad muss explizit priorisiert werden.');
assert.match(mapperSource, /collectLegacyDomModule/, 'Legacy-Fallback muss erhalten bleiben.');
assert.match(layoutSource, /\(Fortsetzung\)/, 'Mehrseitige Abschnitte müssen Fortsetzungsüberschriften erhalten.');
assert.match(layoutSource, /Seite \$\{index \+ 1\} von \$\{total\}/, 'PDF muss Seitenzahlen enthalten.');

console.log('Flooding verification phase 47C.9C authority PDF sections ok');
