import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('47C.9A keeps the global PDF engine as the single export and layout path', () => {
  const app = read('js/core/app.js');
  const exportModule = read('js/core/pdfExport.js');

  assert.match(app, /import\('\.\/pdfExport\.js'\)/);
  assert.match(exportModule, /collectCurrentModule/);
  assert.match(exportModule, /GlobalPdfReport/);
  assert.match(exportModule, /report\.build\(project, moduleData\)/);
});

test('47C.9A documents typed DTO precedence and legacy DOM fallback', () => {
  const review = read('docs/phases/phase-47c9a-pdf-reporting-architecture-review.md');

  assert.match(review, /Typed Report DTO statt Modul-DOM-Scraping/);
  assert.match(review, /legacy[-\s]?fallback/i);
  assert.match(review, /Keine Neuberechnung im Reporting/);
  assert.match(review, /reportAdapter\.js ab 47C\.9B/);
  assert.match(review, /pdfDataMapping\.js/);
  assert.match(review, /pdfLayout\.js/);
});

test('47C.9A defines the complete authorities-report scope', () => {
  const review = read('docs/phases/phase-47c9a-pdf-reporting-architecture-review.md');
  const requiredSections = [
    'metadata',
    'projectReference',
    'summary',
    'surfaces',
    'rainfall',
    'hydraulics',
    'floodingVerification',
    'retentionVerification',
    'comparisons',
    'diagnostics',
    'interpretation',
    'sources'
  ];

  requiredSections.forEach(section => assert.match(review, new RegExp(`\\b${section}\\b`)));
  assert.match(review, /identische maßgebende Ergebnisse in UI und Report/);
  assert.match(review, /vollständiger Offline-Export/);
});