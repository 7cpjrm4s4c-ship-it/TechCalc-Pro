import assert from 'node:assert/strict';
import {
  addAuthorityTocPrelude,
  recordAuthorityTocEntry,
  renderAuthorityTableOfContents
} from '../js/core/pdf/authorityTableOfContents.js';
const entries = [];
assert.equal(addAuthorityTocPrelude(entries, 3), true);
assert.equal(addAuthorityTocPrelude(entries, 4), false, 'Zusammenfassung darf nur einmal erfasst werden.');
assert.equal(recordAuthorityTocEntry(entries, '1. Ergebniszusammenfassung', 3), true);
assert.equal(recordAuthorityTocEntry(entries, '4. Flächenübersicht (3)', 4), true);
assert.equal(recordAuthorityTocEntry(entries, '4. Flächenübersicht (3) (Fortsetzung)', 5), false, 'Fortsetzungen dürfen keinen zweiten TOC-Eintrag erzeugen.');
assert.equal(recordAuthorityTocEntry(entries, '13. Diagramme', 5), true);
assert.equal(recordAuthorityTocEntry(entries, 'ZUSAMMENFASSUNG', 3), false);
assert.deepEqual(entries.map(entry => entry.chapter), [0, 1, 4, 13]);
assert.deepEqual(entries.map(entry => entry.pageNumber), [3, 3, 4, 5]);
class FakeReport {
  constructor(images = {}) {
    this.images = images;
    this.pages = [[], [], []];
    this.page = this.pages[2];
    this.cursorY = 250;
    this.texts = [];
    this.lines = [];
    this.imagesDrawn = [];
  }
  text(value, ...args) { this.texts.push({ value, page: this.pages.indexOf(this.page), args }); }
  line(...args) { this.lines.push({ page: this.pages.indexOf(this.page), args }); }
  drawImage(name) { this.imagesDrawn.push(name); }
}
const report = new FakeReport();
const originalPage = report.page;
const originalCursorY = report.cursorY;
assert.equal(renderAuthorityTableOfContents(report, 1, entries, { title: 'Überflutungsnachweis' }), true);
assert.equal(report.page, originalPage, 'Renderer muss die aktive Inhaltsseite wiederherstellen.');
assert.equal(report.cursorY, originalCursorY, 'Renderer muss den Cursor wiederherstellen.');
const tocText = report.texts.filter(item => item.page === 1).map(item => item.value).join(' ');
assert.match(tocText, /INHALTSVERZEICHNIS/);
assert.match(tocText, /Zusammenfassung/);
assert.doesNotMatch(tocText, /Management Summary/);
assert.match(tocText, /1\. Ergebniszusammenfassung/);
assert.match(tocText, /13\. Diagramme/);
assert.match(tocText, /5/);

const unbrandedReport = new FakeReport({ appIcon: { width: 1, height: 1 }, companyLogo: { width: 2, height: 1 } });
assert.equal(renderAuthorityTableOfContents(
  unbrandedReport,
  1,
  entries,
  { title: 'Überflutungsnachweis' },
  { showTechCalcBranding: false }
), true);
const unbrandedTocText = unbrandedReport.texts.filter(item => item.page === 1).map(item => item.value).join(' ');
assert.doesNotMatch(unbrandedTocText, /TechCalc Pro/, 'table of contents must omit TechCalc product name after opt-out');
assert.doesNotMatch(unbrandedTocText, /HLSK QUICK TOOLS/, 'table of contents must omit TechCalc subtitle after opt-out');
assert.ok(!unbrandedReport.imagesDrawn.includes('ImAppIcon'), 'table of contents must omit TechCalc icon after opt-out');
assert.ok(unbrandedReport.imagesDrawn.includes('ImCompanyLogo'), 'table of contents must keep the company logo independent from TechCalc branding');
assert.match(unbrandedTocText, /INHALTSVERZEICHNIS/);

assert.equal(renderAuthorityTableOfContents(report, 99, entries, {}), false);
console.log('Phase 47C.10F measured table of contents ok');
