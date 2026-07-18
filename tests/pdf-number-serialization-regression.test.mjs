import assert from 'node:assert/strict';
import { pdfNumber } from '../js/core/pdf/pdfText.js';
import { GlobalPdfReport } from '../js/core/pdf/pdfLayout.js';
import { renderAuthorityCharts } from '../js/core/pdf/authorityCharts.js';

assert.equal(pdfNumber(110), '110');
assert.equal(pdfNumber(100), '100');
assert.equal(pdfNumber(90), '90');
assert.equal(pdfNumber(10), '10');
assert.equal(pdfNumber(1.2), '1.2');
assert.equal(pdfNumber(1.25), '1.25');
assert.equal(pdfNumber(-110), '-110');
assert.equal(pdfNumber(Number.NaN), '0');

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

const report = new GlobalPdfReport();
report.cursorY = 60;
assert.equal(renderAuthorityCharts(report, dto), true);
const stream = report.pages.flat().join('\n');

assert.doesNotMatch(stream, /\s24\s11\sre\sf/, '110-pt bars must never serialize as 11 pt.');
assert.match(stream, /\s24\s100\sre\sf|\s24\s110\sre\sf|\s24\s\d{2,3}(?:\.\d+)?\sre\sf/, 'Chart stream must retain full bar heights.');
assert.match(stream, /\s110(?:\.\d+)?\sre\sf|\s100(?:\.\d+)?\sre\sf|\s\d{2,3}(?:\.\d+)?\sre\sf/, 'PDF rectangle coordinates must retain trailing-zero integers.');

console.log('PDF number serialization regression ok');
