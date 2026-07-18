import assert from 'node:assert/strict';
import { buildAuthorityChartModel, renderAuthorityCharts } from '../js/core/pdf/authorityCharts.js';
import { applyAuthorityReportPolicy } from '../js/core/pdf/authorityReportPolicy.js';
import { isDwaVerificationRequired } from '../js/core/pdf/authorityReportScope.js';

const baseDto = {
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

const unrestrictedDto = {
  ...baseDto,
  hydraulics: { dischargeMode: 'unrestricted-discharge' }
};
const restrictedDto = {
  ...baseDto,
  hydraulics: { dischargeMode: 'authority-discharge-limit' }
};

assert.equal(isDwaVerificationRequired(unrestrictedDto), false);
assert.equal(isDwaVerificationRequired(restrictedDto), true);

const dwaSection = {
  title: '9. DWA-A 117 - Anwendungs- und Parameterprüfung',
  rows: [['Nachweis aktiv', 'ja']]
};
assert.equal(applyAuthorityReportPolicy(dwaSection, unrestrictedDto), null, 'DWA-Kapitel müssen ohne behördliche Einleitungsbegrenzung entfallen.');
assert.ok(applyAuthorityReportPolicy(dwaSection, restrictedDto), 'DWA-Kapitel müssen bei behördlicher Einleitungsbegrenzung erhalten bleiben.');

const summarySection = {
  title: '1. Ergebniszusammenfassung',
  rows: [
    ['Planerisch anzusetzendes Speichervolumen', '75,51 m³'],
    ['Maßgebender Nachweis', 'DIN 1986-100'],
    ['DIN 1986-100', '75,51 m³'],
    ['DWA-A 117', '15,40 m³']
  ]
};
assert.equal(applyAuthorityReportPolicy(summarySection, unrestrictedDto).rows.some(row => row[0] === 'DWA-A 117'), false);
assert.equal(applyAuthorityReportPolicy(summarySection, restrictedDto).rows.some(row => row[0] === 'DWA-A 117'), true);

const sourceSection = {
  title: '12. Quellen, Versionen und Nachweisidentität',
  rows: [
    ['DIN 1986-100', 'Überflutungsnachweis'],
    ['DWA-A 117', 'Rückhalteraumnachweis'],
    ['KOSTRA-DWD', 'Regenspenden']
  ]
};
assert.deepEqual(
  applyAuthorityReportPolicy(sourceSection, unrestrictedDto).rows.map(row => row[0]),
  ['DIN 1986-100', 'KOSTRA-DWD']
);

const unrestrictedModel = buildAuthorityChartModel(unrestrictedDto);
assert.equal(unrestrictedModel.din.length, 3);
assert.equal(unrestrictedModel.dwa.length, 0);
assert.equal(unrestrictedModel.comparison.length, 0);

const restrictedModel = buildAuthorityChartModel(restrictedDto);
assert.equal(restrictedModel.dwa.length, 3);
assert.equal(restrictedModel.comparison.length, 2);

class FakeReport {
  constructor() {
    this.cursorY = 100;
    this.texts = [];
    this.rects = [];
    this.lines = [];
  }
  ensureSpace() { return false; }
  sectionTitle(value) { this.texts.push(value); this.cursorY += 11; }
  rect(...args) { this.rects.push(args); }
  text(value) { this.texts.push(value); }
  line(...args) { this.lines.push(args); }
}

const report = new FakeReport();
assert.equal(renderAuthorityCharts(report, unrestrictedDto), true);
const renderedText = report.texts.join(' ');
assert.match(renderedText, /DIN 1986-100/);
assert.doesNotMatch(renderedText, /DWA-A 117/);
assert.doesNotMatch(renderedText, /Vergleich der maßgebenden Speichervolumina/);
assert.match(renderedText, /8\. Diagramme/);

console.log('Phase 47D conditional DWA PDF scope ok');
