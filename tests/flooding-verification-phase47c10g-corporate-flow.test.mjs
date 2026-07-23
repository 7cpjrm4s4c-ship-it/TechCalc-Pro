import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildAuthorityCorporateData, renderAuthorityCorporateBlock } from '../js/core/pdf/authorityCorporateBlock.js';
import { renderSurfaceTable } from '../js/core/pdf/authorityTables.js';

const data = buildAuthorityCorporateData(
  { companyName: 'Scherr+Klimke AG' },
  {
    title: 'Überflutungsnachweis',
    reportDto: { metadata: { appVersion: '1.4.0-dev.2', generatedAt: '2026-07-17T20:26:31.000Z' } }
  }
);
assert.equal(data.company, 'Scherr+Klimke AG');
assert.equal(data.documentVersion, '1.4.0-dev.2');
assert.equal(data.module, 'Überflutungsnachweis');
assert.equal(data.generatedAt, '17.07.2026');

class FakeReport {
  constructor() {
    this.cursorY = 500;
    this.rects = [];
    this.texts = [];
    this.lines = [];
    this.ensureCalls = [];
    this.sectionTitles = [];
  }
  ensureSpace(height, options) { this.ensureCalls.push({ height, options }); return true; }
  rect(...args) { this.rects.push(args); }
  text(value) { this.texts.push(value); }
  line(...args) { this.lines.push(args); }
  sectionTitle(value) { this.sectionTitles.push(value); this.cursorY += 11; }
}

const report = new FakeReport();
assert.equal(renderAuthorityCorporateBlock(report, { companyName: 'Scherr+Klimke AG' }, {
  title: 'Überflutungsnachweis',
  reportDto: { metadata: { appVersion: '1.4.0-dev.2', generatedAt: '2026-07-17T20:26:31.000Z' } }
}), true);
assert.ok(report.ensureCalls[0].height <= 62, 'Corporate-Block muss kompakt bleiben.');
assert.match(report.texts.join(' '), /DOKUMENTINFORMATION/);
assert.match(report.texts.join(' '), /1\.4\.0-dev\.2/);
assert.doesNotMatch(report.texts.join(' '), /Anschrift/);

const tableReport = new FakeReport();
renderSurfaceTable(tableReport, { surfaces: [{ name: 'Dach', areaType: 'Dachfläche', areaM2: 100, runoffCoefficientCs: 0.9, weightedCsAreaM2: 90 }] });
assert.equal(tableReport.sectionTitles.length, 1, 'Tabellenüberschrift darf nach Seitenumbruch nicht doppelt erzeugt werden.');
assert.equal(tableReport.ensureCalls[0].options, undefined, 'Authority-Tabelle darf keine zusätzliche Fortsetzungsüberschrift anfordern.');

const integrationSource = fs.readFileSync(new URL('../js/core/pdf/authorityPdfReport.js', import.meta.url), 'utf8');
assert.match(integrationSource, /renderAuthorityCorporateBlock/);
assert.doesNotMatch(integrationSource, /originalCorporateBlock\.call/);

console.log('Phase 47C.10G corporate flow ok');
