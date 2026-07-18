import assert from 'node:assert/strict';
import { authorityChartScaleMaximum, buildAuthorityChartModel, renderAuthorityCharts } from '../js/core/pdf/authorityCharts.js';
import { PDF_THEME } from '../js/core/pdf/reportTheme.js';

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
assert.ok(authorityChartScaleMaximum(model.din) > 75.51, 'Die Achsenskalierung muss oberhalb des Datenmaximums liegen.');
assert.ok(authorityChartScaleMaximum(model.dwa) > 15.4, 'Auch kleine Diagramme benötigen eine Skalenreserve.');

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
assert.equal(report.ensureCalls[0].options, undefined, 'Die Seitenreservierung darf keinen doppelten Fortsetzungstitel erzeugen.');
assert.ok(report.rects.length >= 12, 'Rahmen und Balken müssen als PDF-Vektoren gerendert werden.');
assert.match(report.texts.join(' '), /12\. Diagramme/);
assert.match(report.texts.join(' '), /DIN 1986-100/);
assert.match(report.texts.join(' '), /DWA-A 117/);
assert.match(report.texts.join(' '), /75,51 m³/);
assert.ok(report.cursorY > 400, 'Cursor muss hinter den Diagrammblock verschoben werden.');

const durationBarRects = report.rects.filter(args => args[2] <= 24 && args[3] > 1);
assert.equal(durationBarRects.length >= 6, true, 'Alle DIN- und DWA-Dauerstufen müssen als Balken gerendert werden.');
const dinBars = durationBarRects.slice(0, 3);
const dwaBars = durationBarRects.slice(3, 6);
assert.ok(dinBars[2][3] > dinBars[1][3] && dinBars[1][3] > dinBars[0][3], 'DIN-Balkenhöhen müssen den Volumina folgen.');
assert.ok(dwaBars[2][3] > dwaBars[1][3] && dwaBars[1][3] > dwaBars[0][3], 'DWA-Balkenhöhen müssen den Volumina folgen.');
assert.ok(dinBars[2][3] < 110, 'Der größte DIN-Balken darf die obere Plotgrenze nicht exakt berühren.');
assert.ok(dwaBars[2][3] < 110, 'Der größte DWA-Balken darf die obere Plotgrenze nicht exakt berühren.');

for (const bar of durationBarRects.slice(0, 6)) {
  assert.equal(bar[4].stroke, null, 'Kein Dauerstufenbalken darf einen Rahmen erhalten.');
  assert.equal(bar[4].width, 0, 'Alle Dauerstufenbalken müssen dieselbe rahmenlose Geometrie verwenden.');
}
assert.deepEqual(dinBars[0][4].fill, PDF_THEME.muted);
assert.deepEqual(dinBars[1][4].fill, PDF_THEME.muted);
assert.deepEqual(dinBars[2][4].fill, PDF_THEME.accent, 'Der maßgebende DIN-Balken muss ausschließlich über die Füllfarbe hervorgehoben werden.');
assert.deepEqual(dwaBars[0][4].fill, PDF_THEME.muted);
assert.deepEqual(dwaBars[1][4].fill, PDF_THEME.muted);
assert.deepEqual(dwaBars[2][4].fill, PDF_THEME.accent, 'Der maßgebende DWA-Balken muss ausschließlich über die Füllfarbe hervorgehoben werden.');
assert.equal(report.lines.length, 9, 'Es dürfen nur die drei Rasterlinien je Diagramm gezeichnet werden; zusätzliche Kontur- oder Kopflinien sind unzulässig.');

const emptyReport = new FakeReport();
assert.equal(renderAuthorityCharts(emptyReport, {}), false);
assert.equal(emptyReport.rects.length, 0);

console.log('Phase 47C.10E authority charts ok');