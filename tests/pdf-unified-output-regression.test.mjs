import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GlobalPdfReport } from '../core/pdf/pdfLayout.js';
import { REPORT_TEMPLATE_VERSION } from '../core/pdf/reportTheme.js';
import { collectCurrentModule, lineSectionItems, reportSections } from '../core/pdf/pdfDataMapping.js';

// Unified PDF output across all modules (global-report-template-11):
// 1. One document heading for every calculation module, including h,x-Diagramm.
// 2. One unified section style per section type; lineBlock styling is retired.
// 3. Identical repeated section titles are disambiguated with an (i/n) suffix.
// 4. Follow-up pages carry the compact continuation band; the full project
//    meta block is only rendered on the first page.
// 5. Review fixes (Phase 49): no Berichtszusammenfassung/Eingaben sections in
//    generic module PDFs; result sections carry the saved record's name.

const pdfLayoutSource = readFileSync(new URL('../core/pdf/pdfLayout.js', import.meta.url), 'utf8');
assert.equal(REPORT_TEMPLATE_VERSION, 'global-report-template-11-review-fixes');

assert.match(pdfLayoutSource, /function dedupeSectionTitles/, 'renderer must disambiguate repeated section titles centrally');
assert.match(pdfLayoutSource, /this\.reportContext = \{ project, moduleData, date \};/, 'build must hand the report context to the continuation header');
assert.doesNotMatch(pdfLayoutSource, /\n  lineBlock\(/, 'the retired lineBlock renderer must not return');
assert.match(pdfLayoutSource, /this\.standardSection\(\{ \.\.\.section, title: item\.title \|\| section\.title, rows: item\.rows \}\);/,
  'regular sections must all use the unified standardSection style');

function pdfText(pdf) {
  return pdf.pages.join('\n').match(/<[0-9A-F]+>/g).map(token => Buffer.from(token.slice(1, -1), 'hex').toString('latin1')).join('\n');
}

const project = {
  project: 'Test Projekt',
  projectNo: '12345',
  client: 'Test',
  engineer: 'Test',
  showTechCalcBranding: true,
  companyName: '',
  companyAddress: '',
  documentVersion: '',
  checkedBy: '',
  approvedBy: ''
};

const moduleData = {
  id: 'drinking-water',
  title: 'Trinkwasserberechnung',
  shortTitle: 'Trinkwasser',
  reportSource: 'typed-dto',
  reportDto: {
    metadata: {
      moduleId: 'drinking-water',
      moduleTitle: 'Trinkwasserberechnung',
      reportHeading: 'Berechnungsprotokoll'
    },
    sections: [
      { title: 'Trinkwasser', rows: [['Spitzendurchfluss', '0,43', 'l/s'], ['Gesamtsummendurchfluss', '1,73', 'l/s']] },
      { title: 'Trinkwasser', rows: [['Auslegungsdurchfluss', '2,67', 'm³/h'], ['Nennweite Hauseinführung', 'DN 32', '']] }
    ]
  }
};

const report = new GlobalPdfReport({});
report.build(project, moduleData);
const text = pdfText(report);

assert.ok(text.includes('Trinkwasser (1/2)'), 'first of two identical section titles must be suffixed (1/2)');
assert.ok(text.includes('Trinkwasser (2/2)'), 'second of two identical section titles must be suffixed (2/2)');
assert.ok(text.includes('PROJEKT'), 'project meta block rendered on first page');
assert.equal(report.pages.length, 1, 'small fixtures fit on one page');

// Phase 49 review fixes: no meta/input sections, no generic line-section titles.
const genericTitles = reportSections(moduleData).map(section => section.title);
assert.ok(genericTitles.length > 0, 'fixture sections must survive the generic pipeline');
assert.ok(genericTitles.every(title => !/^(?:\d+\.\s*)?(berichtszusammenfassung|eingaben)$/i.test(title)),
  'generic module PDFs must not contain Berichtszusammenfassung or Eingaben sections');
assert.ok(!/berichtszusammenfassung/i.test(text), 'no Berichtszusammenfassung title in the PDF text layer');
const designationBlocks = reportSections(moduleData).flatMap(section => lineSectionItems(section.rows, section.title));
assert.ok(designationBlocks.every(block => !/leitungsabschnitt/i.test(block.title)),
  'no Leitungsabschnitt block titles in generic module PDFs');
const neutralBlocks = lineSectionItems([['Leistung', '10', 'kW']]);
assert.equal(neutralBlocks[0].title, 'Berechnung 1', 'fallback block title must be neutral, never Leitungsabschnitt');

// Empty module result: single section titled with the report heading.
const emptySections = reportSections({
  id: 'drinking-water',
  title: 'Trinkwasserberechnung',
  shortTitle: 'Trinkwasser',
  reportSource: 'typed-dto',
  reportDto: {
    metadata: { moduleId: 'drinking-water', moduleTitle: 'Trinkwasserberechnung', reportHeading: 'Berechnungsprotokoll' },
    sections: []
  }
});
assert.equal(emptySections.length, 1, 'empty module result must produce exactly one fallback section');
assert.equal(emptySections[0].title, 'Berechnungsprotokoll', 'fallback section carries the report title without numbering');
assert.ok(emptySections[0].rows.some(row => /Keine Ergebnisdaten verfügbar/.test(row[1])),
  'fallback section states that no result data is available');

// Continuation band: a long fixture forces a second page; the continuation
// page must carry the compact band while the full PROJEKT meta block must not
// repeat.
const longRows = Array.from({ length: 120 }, (_, index) => [`Zeile ${index + 1}`, String(index + 1), 'Pa/m']);
const longModuleData = {
  id: 'wastewater',
  title: 'Schmutzwasser',
  shortTitle: 'Schmutzwasser',
  reportSource: 'typed-dto',
  reportDto: {
    metadata: { moduleId: 'wastewater', moduleTitle: 'Schmutzwasser', reportHeading: 'Berechnungsprotokoll' },
    sections: [{ title: 'Berechnung', rows: longRows }]
  }
};
const longReport = new GlobalPdfReport({});
longReport.build({ ...project, client: 'AO'.repeat(400) }, longModuleData);
const longText = pdfText(longReport);
assert.ok(longReport.pages.length > 1, 'long fixture must paginate');
const projectBlockCount = (longText.match(/^PROJEKT$/gm) || []).length;
assert.equal(projectBlockCount, 1, 'the project meta block must only exist on the first page');
const bandCount = (longText.match(/Berechnungsprotokoll · Schmutzwasser · /g) || []).length;
assert.equal(bandCount, longReport.pages.length - 1, 'every continuation page must carry the unified continuation band');

// h,x-Diagramm shares the unified document heading.
const hxCollected = collectCurrentModule(new Map([[
  'hx-diagram',
  {
    title: 'h,x-Diagramm',
    shortTitle: 'h,x-Diagramm',
    report: () => ({
      metadata: {
        dtoType: 'techcalc.hx-diagram.report',
        dtoVersion: 1,
        moduleId: 'hx-diagram',
        moduleTitle: 'h,x-Diagramm',
        reportHeading: 'h,x-Diagramm'
      },
      sections: []
    }),
    state: { get: () => ({}) }
  }
]]), () => 'hx-diagram');
assert.equal(hxCollected.reportDto.metadata.reportHeading, 'Berechnungsprotokoll',
  'h,x-Diagramm must use the unified Berechnungsprotokoll heading');

const floodingCollected = collectCurrentModule(new Map([[
  'flooding-verification',
  {
    title: 'Überflutungsnachweis',
    shortTitle: 'Überflutungsnachweis',
    report: () => ({
      metadata: {
        dtoType: 'techcalc.flooding-verification.report',
        moduleId: 'flooding-verification',
        moduleTitle: 'Überflutungsnachweis',
        reportHeading: 'Behördennachweis'
      },
      sections: []
    }),
    state: { get: () => ({}) }
  }
]]), () => 'flooding-verification');
assert.equal(floodingCollected.reportDto.metadata.reportHeading, 'Behördennachweis',
  'authority-level reports keep their dedicated heading');

// Notes blocks keep their dedicated 1:3 layout through the unified pipeline.
const notesReport = new GlobalPdfReport({});
notesReport.renderSection({
  title: 'Hinweise',
  isNotesBlock: true,
  rows: [
    ['Sprührohrentgaser', 'Arbeitsdruck muss mindestens so hoch wie der mögliche Enddruck am hydraulischen Einbindpunkt sein.', ''],
    ['Nachspeiseeinrichtung', 'Nachspeiseleitung >= 10 m: kleines Refix-Ausdehnungsgefäß vorsehen.', '']
  ]
});
assert.ok(pdfText(notesReport).includes('Sprührohrentgaser'), 'notes blocks must keep rendering their rows');

console.log('unified PDF output regression (template 11) ok');
