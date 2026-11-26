import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { GlobalPdfReport } from '../core/pdf/pdfLayout.js';
import { REPORT_TEMPLATE_VERSION } from '../core/pdf/reportTheme.js';
import { lineSectionItems, reportSections } from '../core/pdf/pdfDataMapping.js';
import { buildGenericModuleReportDto } from '../core/pdf/typedDtoReportAdapter.js';
import { buildVentilationReportDto } from '../modules/ventilation/reportAdapter.js';
import { buildHeatingCoolingReportDto } from '../modules/heating-cooling/reportAdapter.js';
import { calculate as calculateHeatingCooling } from '../modules/heating-cooling/logic.js';
import hxModule from '../modules/hx-diagram/index.js';
import { calculate as calculateHx } from '../modules/hx-diagram/logic.js';

// Phase 49 – PDF-Export Review-Nacharbeiten (global-report-template-11-review-fixes):
// A1: no "Berichtszusammenfassung" section in generic module PDFs; empty module
//     results fall back to one section titled with the report heading stating
//     "Keine Ergebnisdaten verfügbar".
// A2: no "Eingaben" section in generic module PDFs.
// A3: result section titles are the saved record names; no
//     "Leitungsabschnitt"/"Gespeicherte Leitungsabschnitte" titles remain.
// A4: each saved h,x process contributes exactly one image XObject
//     (ImChart1, ImChart2) and its diagram title to the PDF byte stream.

assert.equal(REPORT_TEMPLATE_VERSION, 'global-report-template-11-review-fixes');

const META_TITLE = /^(?:\d+\.\s*)?(berichtszusammenfassung|eingaben)$/i;
const FORBIDDEN_TITLE = /leitungsabschnitt/i;

function pdfTextLayer(pdf) {
  return [...pdf.matchAll(/<([0-9A-F]+)> Tj/g)].map(match => Buffer.from(match[1], 'hex').toString('latin1')).join('\n');
}

const project = {
  project: 'Phase 49 Review',
  projectNo: 'P49',
  client: 'QA',
  engineer: 'QA',
  showTechCalcBranding: true,
  companyName: '',
  companyAddress: '',
  documentVersion: '',
  checkedBy: '',
  approvedBy: ''
};

// --- A1 + A2 + A3: generic typed-DTO pipeline (pipe-sizing style savedPipes) ---
const genericDto = buildGenericModuleReportDto({
  config: { id: 'pipe-sizing', title: 'Rohrdimensionierung' },
  schema: { fields: [{ name: 'dn', label: 'Nennweite' }] },
  state: {
    dn: '32',
    savedPipes: [
      { name: 'Strang A', result: { system: 'Stahl', dn: 32, pressureLoss: 120 } },
      { state: { system: 'Kupfer', dn: 25 } }
    ]
  },
  calculation: { pressureLoss: 120 },
  resultModel: { sections: [{ title: 'Ergebnis', rows: [['Druckverlust', '120', 'Pa/m']] }] },
  generatedAt: '2026-11-26T00:00:00.000Z',
  calculationCached: true
});
assert.ok(genericDto.sections.every(section => !META_TITLE.test(section.title)),
  'A2: typed DTO adapter must not emit an Eingaben section');

const pipeModuleData = {
  id: 'pipe-sizing',
  title: 'Rohrdimensionierung',
  shortTitle: 'Rohrdimensionierung',
  reportSource: 'typed-dto',
  reportDto: genericDto
};
const pipeSections = reportSections(pipeModuleData);
const pipeTitles = pipeSections.map(section => section.title);
assert.ok(pipeTitles.length > 0, 'saved records must produce sections');
assert.ok(pipeTitles.every(title => !META_TITLE.test(title)), 'A1/A2: no Berichtszusammenfassung/Eingaben section titles');
assert.ok(pipeTitles.every(title => !FORBIDDEN_TITLE.test(title)), 'A3: no Leitungsabschnitt section titles');
assert.ok(pipeTitles.includes('Strang A'), 'A3: section title must be the saved record name');
assert.ok(pipeTitles.includes('Kupfer, DN 25'), 'A3: unnamed records fall back to a descriptive system/DN title');

const pipeReport = new GlobalPdfReport({});
const pipePdf = await pipeReport.build(project, pipeModuleData).text();
const pipeText = pdfTextLayer(pipePdf);
assert.ok(!/berichtszusammenfassung/i.test(pipeText), 'A1: PDF text layer must not contain Berichtszusammenfassung');
assert.ok(!FORBIDDEN_TITLE.test(pipeText), 'A3: PDF text layer must not contain Leitungsabschnitt');
assert.ok(pipeText.includes('Strang A'), 'A3: PDF text layer contains the saved record name as section title');

// --- A1 fallback: module without any result sections ---
const emptyModuleData = {
  id: 'pipe-sizing',
  title: 'Rohrdimensionierung',
  shortTitle: 'Rohrdimensionierung',
  reportSource: 'typed-dto',
  reportDto: {
    metadata: { moduleId: 'pipe-sizing', moduleTitle: 'Rohrdimensionierung', reportHeading: 'Berechnungsprotokoll' },
    sections: []
  }
};
const emptySections = reportSections(emptyModuleData);
assert.equal(emptySections.length, 1, 'A1 fallback: exactly one section');
assert.equal(emptySections[0].title, 'Berechnungsprotokoll', 'A1 fallback: section carries the report title without numbering');
assert.ok(emptySections[0].rows.some(row => /Keine Ergebnisdaten verfügbar/.test(String(row[1]))),
  'A1 fallback: section states that no result data is available');

// --- A3: lineSectionItems title precedence and neutral fallback ---
const namedBlock = lineSectionItems([['Bezeichnung', 'Strang A', ''], ['Leistung', '10', 'kW']], 'Gespeicherte Berechnungen');
assert.equal(namedBlock[0].title, 'Strang A', 'designation row wins over the section title');
const sectionFallbackBlock = lineSectionItems([['Leistung', '10', 'kW']], 'Gespeicherte Berechnungen');
assert.equal(sectionFallbackBlock[0].title, 'Gespeicherte Berechnungen', 'section title is the second fallback');
const neutralBlock = lineSectionItems([['Leistung', '10', 'kW']]);
assert.equal(neutralBlock[0].title, 'Berechnung 1', 'final fallback is a neutral title, never Leitungsabschnitt');
assert.ok(!FORBIDDEN_TITLE.test(neutralBlock[0].title));

// --- A3: ventilation and heating-cooling saved records under their names ---
const ventDto = buildVentilationReportDto({
  state: {},
  activeState: {},
  calculation: {},
  lineSections: [
    { name: 'Halle 1', powerKw: '10', volumeFlowM3h: '1000', massFlowKgh: '1200', deltaT: '5', supplyTemp: '20', roomTemp: '22', modeLabel: 'Heizung' },
    { name: 'Halle 2', powerKw: '20', volumeFlowM3h: '2000', massFlowKgh: '2400', deltaT: '8', supplyTemp: '18', roomTemp: '26', modeLabel: 'Kühlung' }
  ]
});
const ventSections = reportSections({ id: 'ventilation', title: 'Lüftung', shortTitle: 'Lüftung', reportSource: 'typed-dto', reportDto: ventDto });
assert.ok(ventSections.every(section => !META_TITLE.test(section.title) && !FORBIDDEN_TITLE.test(section.title)),
  'A1-A3: ventilation PDF section titles');
const ventBlocks = ventSections.filter(section => section.isLineSection).flatMap(section => lineSectionItems(section.rows, section.title));
assert.deepEqual(ventBlocks.map(block => block.title), ['Halle 1', 'Halle 2'],
  'each saved ventilation record appears under its stored name');

const hcState = { mode: 'heating', mediumId: 'water', pipeSystemId: 'steel', lineSections: [{ id: 'line-1', name: 'Testabschnitt', powerKw: '10', massFlowKgh: '860', volumeFlowM3h: '0.862', deltaT: '10' }] };
const hcActive = { mode: 'heating', mediumId: 'water', pipeSystemId: 'steel', calcTarget: 'power', powerW: '10000', powerUnit: 'W', massFlowKgh: '', massFlowUnit: 'kg/h', deltaT: '10' };
const hcDto = buildHeatingCoolingReportDto({
  state: hcState,
  activeState: hcActive,
  calculation: calculateHeatingCooling(hcActive),
  lineSections: hcState.lineSections,
  generatedAt: '2026-11-26T00:00:00.000Z'
});
const hcSections = reportSections({ reportSource: 'typed-dto', reportDto: hcDto });
assert.ok(hcSections.every(section => !META_TITLE.test(section.title) && !FORBIDDEN_TITLE.test(section.title)),
  'A1-A3: heating-cooling PDF section titles');
const hcSaved = hcSections.find(section => section.isLineSection && section.title === 'Gespeicherte Berechnungen');
assert.ok(hcSaved, 'heating-cooling keeps a collective section that is not Leitungsabschnitte');
assert.deepEqual(lineSectionItems(hcSaved.rows, hcSaved.title).map(block => block.title), ['Testabschnitt'],
  'each saved heating-cooling record appears under its stored name');

// --- A4: h,x PDF byte stream carries one image XObject per saved process ---
function savedHxRecord(name, input) {
  const result = calculateHx(input);
  return {
    name,
    label: name,
    process: input.process,
    processLabel: result.changeType || input.process,
    input: { ...input, label: name },
    path: result.processPath
  };
}
const hxDto = hxModule.report({
  savedProcesses: [
    savedHxRecord('Test Sommer', { tempC: 32, rhPercent: 40, targetTempC: 21, targetRhPercent: 55, airVolumeM3h: 20, process: 'cool-dehumidify' }),
    savedHxRecord('Test Winter', { tempC: -12, rhPercent: 90, targetTempC: 21, targetRhPercent: 50, airVolumeM3h: 20, process: 'adiabatic' })
  ]
});
assert.equal(hxDto.charts.length, 2, 'each saved h,x process exposes its own chart SVG');
assert.deepEqual(hxDto.sections.map(section => section.chartIndex), [0, undefined, 1, undefined]);
assert.deepEqual(hxDto.sections.map(section => section.title),
  ['Test Sommer', 'Erhitzer, Kühler und Befeuchter', 'Test Winter', 'Erhitzer, Kühler und Befeuchter'],
  'B1: each saved h,x process gets an equipment section after its state points');

function fakeChartImage(seed) {
  const binary = Buffer.from(`ffd8ffe000${seed}ffd9`, 'hex');
  return { dataUrl: `data:image/jpeg;base64,${binary.toString('base64')}`, width: 1300, height: 820 };
}
const hxModuleData = {
  id: 'hx-diagram',
  title: 'h,x-Diagramm',
  shortTitle: 'h,x-Diagramm',
  reportDto: hxDto,
  reportSource: 'typed-dto'
};
const hxReport = new GlobalPdfReport({ chartImages: [fakeChartImage('01'), fakeChartImage('02')] });
const hxPdf = await hxReport.build(project, hxModuleData).text();
assert.match(hxPdf, /\/ImChart1 \d+ 0 R/, 'A4: first process chart must be an ImChart1 XObject resource');
assert.match(hxPdf, /\/ImChart2 \d+ 0 R/, 'A4: second process chart must be an ImChart2 XObject resource');
assert.equal((hxPdf.match(/\/Type \/XObject \/Subtype \/Image/g) || []).length, 2,
  'A4: exactly one image XObject per saved h,x process');
assert.match(hxPdf, /cm \/ImChart1 Do Q/, 'A4: first chart is drawn on its process page');
assert.match(hxPdf, /cm \/ImChart2 Do Q/, 'A4: second chart is drawn on its process page');
const hxText = pdfTextLayer(hxPdf);
assert.ok(hxText.includes('Test Sommer - h,x-Diagramm'), 'A4: diagram title of the first process appears in the text layer');
assert.ok(hxText.includes('Test Winter - h,x-Diagramm'), 'A4: diagram title of the second process appears in the text layer');
assert.ok(hxText.includes('Test Sommer') && hxText.includes('Test Winter'), 'A4: process sections carry the record names');
assert.ok(!META_TITLE.test('Test Sommer'));

// --- A4 root-cause guards: rasterization must not fail silently ---
const chartRenderSource = readFileSync(new URL('../core/pdf/pdfChartRender.js', import.meta.url), 'utf8');
assert.doesNotMatch(chartRenderSource, /[^a-zA-Z]eight - 1/, 'cropCanvasToContent must not reference an undefined identifier');
assert.match(chartRenderSource, /maxY = Math\.min\(height - 1, maxY \+ padding\)/,
  'cropCanvasToContent must clamp to the canvas height');
const layoutSource = readFileSync(new URL('../core/pdf/pdfLayout.js', import.meta.url), 'utf8');
assert.doesNotMatch(layoutSource, /chartImages\)\.filter\(Boolean\)/,
  'chart image slots must stay aligned with section.chartIndex (no index shift on failed rasterization)');
const exportSource = readFileSync(new URL('../core/pdf/pdfExport.js', import.meta.url), 'utf8');
assert.match(exportSource, /images\[index\] = await svgToJpeg/,
  'chartImagesForReport must preserve chart indices instead of compacting them');

console.log('phase 49 PDF review fixes (template 11) regression ok');
