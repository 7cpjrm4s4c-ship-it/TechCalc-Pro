import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { surfaceTypeLabel } from '../js/core/pdf/authorityTables.js';
import { areaTypes } from '../js/shared/rainwaterDomainTables.js';

for (const areaType of areaTypes) {
  assert.equal(
    surfaceTypeLabel(areaType.id),
    areaType.name,
    `Flächenart ${areaType.id} muss mit der deutschen Domänenbezeichnung ausgegeben werden.`
  );
  assert.notEqual(surfaceTypeLabel(areaType.id), areaType.id);
}

assert.equal(surfaceTypeLabel('green-extensive-flat'), 'Extensivbegrünung ≤ 5°');
assert.equal(surfaceTypeLabel('paving-permeable'), 'Wasserdurchlässige Pflasterfläche');
assert.equal(surfaceTypeLabel('unknown-import-value'), 'Freie Fläche / eigener Abflussbeiwert');

const pdfReportSource = await readFile(
  new URL('../js/core/pdf/authorityPdfReport.js', import.meta.url),
  'utf8'
);
assert.match(pdfReportSource, /const EXECUTIVE_SUMMARY_TITLE = 'ZUSAMMENFASSUNG'/);
assert.doesNotMatch(pdfReportSource, /MANAGEMENT SUMMARY/);

console.log('Phase 47D German PDF labels ok');