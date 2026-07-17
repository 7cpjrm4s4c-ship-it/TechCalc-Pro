import assert from 'node:assert/strict';
import {
  addAuthorityTocPrelude,
  recordAuthorityTocEntry,
  renderAuthorityTableOfContents
} from '../js/core/pdf/authorityTableOfContents.js';

const entries = [];
assert.equal(addAuthorityTocPrelude(entries, 3), true);
assert.equal(addAuthorityTocPrelude(entries, 4), false, 'Management Summary darf nur einmal erfasst werden.');
assert.equal(recordAuthorityTocEntry(entries, '1. Ergebniszusammenfassung', 3), true);
assert.equal(recordAuthorityTocEntry(entries, '4. Flächenübersicht (3)', 4), true);
assert.equal(recordAuthorityTocEntry(entries, '4. Flächenübersicht (3) (Fortsetzung)', 5), false, 'Fortsetzungen dürfen keinen zweiten TOC-Eintrag erzeugen.');
assert.equal(recordAuthorityTocEntry(entries, '13. Diagramme', 5), true);
assert.equal(recordAuthorityTocEntry(entries, 'MANAGEMENT SUMMARY', 3), false);
assert.deepEqual(entries.map(entry => entry.chapter), [0, 1, 4, 13]);
assert.deepEqual(entries.map(entry => entry.pageNumber), [3, 3, 4, 5]);

class FakeReport {
  constructor() {
    this.images = {};
    this.pages = [[], [], []];
    this.page = this.pages[2];
    this.cursorY = 250;
    this.texts = [];
    this.lines = [];
  }
  text(value, ...args) { this.texts.push({ value, page: this.pages.indexOf(this.page), args }); }
  line(...args) { this.lines.push({ page: this.pages.indexOf(this.page), args }); }
  drawImage() {}
}

const report = new FakeReport();
const originalPage = report.page;
const originalCursorY = report.cursorY;
assert.equal(renderAuthorityTableOfContents(report, 1, entries, { title: 'Überflutungsnachweis' }), true);
assert.equal(report.page, originalPage, 'Renderer muss die aktive Inhaltsseite wiederherstellen.');
assert.equal(report.cursorY, originalCursorY, 'Renderer muss den Cursor wiederherstellen.');
const tocText = report.texts.filter(item => item.page === 1).map(item => item.value).join(' ');
assert.match(tocText, /INHALTSVERZEICHNIS/);
assert.match(tocText, /Management Summary/);
assert.match(tocText, /1\. Ergebniszusammenfassung/);
assert.match(tocText, /13\. Diagramme/);
assert.match(tocText, /5/);
assert.equal(renderAuthorityTableOfContents(report, 99, entries, {}), false);

console.log('Phase 47C.10F measured table of contents ok');
