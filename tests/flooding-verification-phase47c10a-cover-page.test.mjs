import assert from 'node:assert/strict';
import { buildAuthorityCoverPage } from '../js/core/pdf/authorityCoverPage.js';
import { installAuthorityCoverPage, isFloodingAuthorityReport } from '../js/core/pdf/authorityPdfReport.js';

const moduleData = {
  id: 'flooding-verification',
  title: 'Überflutungsnachweis',
  reportSource: 'typed-dto',
  reportDto: {
    summary: { planningVolumeM3: 75.51, governingLabel: 'DIN 1986-100' },
    projectReference: { authorityName: 'Stadtentwässerung', authorityReference: 'AZ-47' },
    metadata: { appVersion: '1.4.0-dev.2', generatedAt: '2026-07-17T12:00:00.000Z' }
  }
};

const cover = buildAuthorityCoverPage({
  project: { project: 'Test Projekt', projectNo: '12345', client: 'Test', engineer: 'Planer' },
  moduleData
});

assert.equal(cover.kind, 'authority-cover');
assert.equal(cover.project, 'Test Projekt');
assert.equal(cover.planningVolume, 75.51);
assert.equal(cover.governingVerification, 'DIN 1986-100');
assert.equal(cover.authority, 'Stadtentwässerung');
assert.equal(isFloodingAuthorityReport(moduleData), moduleData.reportDto);

class FakePdfReport {
  constructor() {
    this.images = {};
    this.pages = [[]];
    this.page = this.pages[0];
    this.addPageCalls = 0;
    this.originalBuildCalls = 0;
  }
  addPage() { this.pages.push([]); this.page = this.pages.at(-1); this.addPageCalls += 1; }
  text() {}
  line() {}
  rect() {}
  drawImage() {}
  build() { this.originalBuildCalls += 1; return 'pdf'; }
}

assert.equal(installAuthorityCoverPage(FakePdfReport), true);
assert.equal(installAuthorityCoverPage(FakePdfReport), false, 'installation must be idempotent');
const report = new FakePdfReport();
assert.equal(report.build({ project: 'Test Projekt' }, moduleData), 'pdf');
assert.equal(report.addPageCalls, 1, 'cover must be followed by a dedicated report page');
assert.equal(report.pages.length, 2, 'cover and report must be separate pages');
assert.equal(report.originalBuildCalls, 1);

const legacy = new FakePdfReport();
legacy.build({}, { id: 'rainwater', reportSource: 'legacy-dom' });
assert.equal(legacy.addPageCalls, 0, 'other reports must retain the existing layout');

console.log('Phase 47C.10A authority cover page ok');
