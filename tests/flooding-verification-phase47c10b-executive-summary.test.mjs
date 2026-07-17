import assert from 'node:assert/strict';
import { buildAuthorityExecutiveSummary } from '../js/core/pdf/authorityExecutiveSummary.js';
import { installAuthorityCoverPage, renderAuthorityExecutiveSummary } from '../js/core/pdf/authorityPdfReport.js';

const moduleData = {
  id: 'flooding-verification',
  reportSource: 'typed-dto',
  reportDto: {
    summary: {
      status: 'complete-with-warnings',
      planningVolumeM3: 75.51,
      dinVolumeM3: 75.51,
      dwaVolumeM3: 15.4,
      governingLabel: 'DIN 1986-100',
      governingReason: 'Das DIN-Bemessungsvolumen ist maßgebend.'
    },
    rainfall: { governingDurationMinutes: 15 },
    floodingVerification: { totalAreaM2: 3000 },
    diagnostics: {
      statusLabel: 'Berechnung vollständig mit Warnungen',
      counts: { errors: 0, warnings: 2, hints: 1 },
      items: [{ type: 'warning', message: 'Der verfügbare Abfluss ist kleiner als der erforderliche Regenwasserabfluss.' }]
    },
    interpretation: {
      summary: 'Für das vorliegende Projekt ist ein Speichervolumen von 75,51 m3 anzusetzen.',
      recommendation: 'Speichervolumen in der weiteren Planung berücksichtigen.'
    }
  }
};

const summary = buildAuthorityExecutiveSummary(moduleData);
assert.equal(summary.kind, 'authority-executive-summary');
assert.equal(summary.planningVolumeM3, 75.51);
assert.equal(summary.governingDurationMinutes, 15);
assert.equal(summary.totalAreaM2, 3000);
assert.equal(summary.errors, 0);
assert.equal(summary.warnings, 2);
assert.equal(summary.hints, 1);
assert.match(summary.criticalNotice, /verfügbare Abfluss/);

const commands = [];
const report = {
  cursorY: 100,
  ensureSpace: () => false,
  text: value => commands.push(['text', String(value)]),
  rect: (...args) => commands.push(['rect', ...args]),
  line: (...args) => commands.push(['line', ...args])
};
renderAuthorityExecutiveSummary(report, moduleData);
assert.ok(commands.some(command => command[0] === 'text' && command[1] === 'MANAGEMENT SUMMARY'));
assert.ok(commands.some(command => command[0] === 'text' && command[1].includes('75,51 m3')));
assert.ok(commands.some(command => command[0] === 'text' && command[1].includes('2 Warnungen')));
assert.ok(report.cursorY > 100, 'summary renderer must advance the report cursor');

class FakePdfReport {
  constructor() {
    this.images = {};
    this.pages = [[]];
    this.page = this.pages[0];
    this.cursorY = 30;
    this.summaryRenderedBeforeSections = false;
  }
  addPage() { this.pages.push([]); this.page = this.pages.at(-1); this.cursorY = 30; }
  text(value) { if (value === 'MANAGEMENT SUMMARY') this.summaryRenderedBeforeSections = true; }
  line() {}
  rect() {}
  drawImage() {}
  ensureSpace() { return false; }
  projectData() { this.cursorY += 30; }
  build(project) {
    this.projectData(project);
    assert.equal(this.summaryRenderedBeforeSections, true, 'summary must be rendered after project data and before report sections');
    return 'pdf';
  }
}

installAuthorityCoverPage(FakePdfReport);
const hookedReport = new FakePdfReport();
assert.equal(hookedReport.build({ project: 'Test' }, moduleData), 'pdf');
assert.equal(hookedReport.pages.length, 2);

const legacyReport = new FakePdfReport();
legacyReport.summaryRenderedBeforeSections = false;
legacyReport.build = function legacyBuild(project) { this.projectData(project); return 'legacy'; };
assert.equal(legacyReport.build({}, { id: 'rainwater' }), 'legacy');
assert.equal(legacyReport.summaryRenderedBeforeSections, false);

console.log('Phase 47C.10B executive summary ok');
