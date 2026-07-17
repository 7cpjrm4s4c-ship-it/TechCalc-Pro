import assert from 'node:assert/strict';
import { buildAuthorityChartModel, renderAuthorityCharts } from '../js/core/pdf/authorityCharts.js';

const dto = {
  summary: {
    dinVolumeM3: 75.51,
    dwaVolumeM3: 15.4,
    governingLabel: 'DIN 1986-100',
    governingSource: 'din'
  },
  durationComparison: {
    din: [
      { durationMinutes: 5, valueM3: 51 },
      { durationMinutes: 10, valueM3: 66.18 },
      { durationMinutes: 15, valueM3: 75.51 }
    ],
    dwa: [
      { durationMinutes: 5, volumeM3: 10.66 },
      { durationMinutes: 10, volumeM3: 13.68 },
      { durationMinutes: 15, volumeM3: 15.4 }
    ]
  },
  floodingVerification: { equation21Governing: { durationMinutes: 15, valueM3: 75.51 } },
  retentionVerification: { governing: { durationMinutes: 15, volumeM3: 15.4 } }
};

const model = buildAuthorityChartModel(dto);
assert.deepEqual(model.din.map(item => item.value), [51, 66.18, 75.51]);
assert.deepEqual(model.dwa.map(item => item.value), [10.66, 13.68, 15.4]);
assert.equal(model.din[2].governing, true);
assert.equal(model.dwa[2].governing, true);
assert.equal(model.comparison[0].governing, true);
assert.equal(model.comparison[1].governing, false);

class FakeReport {
  constructor() {
    this.cursorY = 100;
    this.rects = [];
    this.texts = [];
    this.lines = [];
    this.ensureCalls = [];
  }
  ensureSpace(height, options) { this.ensureCalls.push({ height, options }); return false; }
  sectionTitle(value) { this.texts.push(value); this.cursorY += 11; }
  rect(...args) { this.rects.push(args); }
  text(value) { this.texts.push(value); }
  line(...args) { this.lines.push(args); }
}

const report = new FakeReport();
assert.equal(renderAuthorityCharts(report, dto), true);
assert.ok(report.ensureCalls.length >= 1, 'Diagrammblock muss Seitenraum reservieren.');
assert.ok(report.rects.length >= 12, 'Rahmen und Balken müssen als PDF-Vektoren gerendert werden.');
assert.match(report.texts.join(' '), /13\. Diagramme/);
assert.match(report.texts.join(' '), /DIN 1986-100/);
assert.match(report.texts.join(' '), /DWA-A 117/);
assert.match(report.texts.join(' '), /75,51 m³/);
assert.ok(report.cursorY > 400, 'Cursor muss hinter den Diagrammblock verschoben werden.');

const emptyReport = new FakeReport();
assert.equal(renderAuthorityCharts(emptyReport, {}), false);
assert.equal(emptyReport.rects.length, 0);

console.log('Phase 47C.10E authority charts ok');
