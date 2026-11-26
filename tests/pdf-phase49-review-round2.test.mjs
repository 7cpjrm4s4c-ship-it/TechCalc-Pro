import assert from 'node:assert/strict';

import { GlobalPdfReport } from '../core/pdf/pdfLayout.js';
import { PDF_PAGE, PDF_THEME } from '../core/pdf/reportTheme.js';
import { estimateTextWidth, splitPdfText } from '../core/pdf/pdfText.js';
import { lineSectionItems, reportSections } from '../core/pdf/pdfDataMapping.js';
import { buildRainwaterReportSections } from '../core/pdf/rainwaterReportSections.js';
import { installAuthorityCoverPage } from '../core/pdf/authorityPdfReport.js';
import hxModule from '../modules/hx-diagram/index.js';
import { calculate as calculateHx } from '../modules/hx-diagram/logic.js';
import { equipmentSizing } from '../modules/hx-diagram/results.js';

// Phase 49 Review-Runde 2 (B1-B4):
// B1: h,x PDF carries an "Erhitzer, Kühler und Befeuchter" section per saved
//     process, with rows from the same equipmentSizing() source as the UI card.
// B2: notes block wraps long hint texts within the value field (max 3 lines).
// B3: rainwater "Hinweise / Prüfhinweise" uses the unified notes-block style.
// B4: authority front-matter pages (cover, TOC, first protocol page) carry no
//     continuation band; the band starts with the first protocol follow-up page.

const project = {
  project: 'Phase 49 R2',
  projectNo: 'P49R2',
  client: 'QA',
  engineer: 'QA',
  showTechCalcBranding: true,
  companyName: '',
  companyAddress: '',
  documentVersion: '',
  checkedBy: '',
  approvedBy: ''
};

function pdfTextCommands(pdf) {
  return [...pdf.matchAll(/BT \/F[1-4] [0-9.]+ Tf ([0-9.\-]+) ([0-9.\-]+) Td <([0-9A-F]*)> Tj ET/g)]
    .map(([, x, y, hex]) => ({ x: Number(x), y: Number(y), text: Buffer.from(hex, 'hex').toString('latin1') }));
}

// --- B1: h,x equipment section per saved process ---
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
const summerRecord = savedHxRecord('Test Sommer', {
  tempC: 32, rhPercent: 40, targetTempC: 21, targetRhPercent: 55, airVolumeM3h: 20,
  heatingSupplyTempC: 45, heatingReturnTempC: 30, coolingSupplyTempC: 8, coolingReturnTempC: 10,
  process: 'cool-dehumidify'
});
const winterRecord = savedHxRecord('Test Winter', {
  tempC: -12, rhPercent: 90, targetTempC: 21, targetRhPercent: 50, airVolumeM3h: 20,
  heatingSupplyTempC: 45, heatingReturnTempC: 30, coolingSupplyTempC: 8, coolingReturnTempC: 10,
  process: 'adiabatic'
});
const hxDto = hxModule.report({ savedProcesses: [summerRecord, winterRecord] });
assert.deepEqual(hxDto.sections.map(section => section.title),
  ['Test Sommer', 'Erhitzer, Kühler und Befeuchter', 'Test Winter', 'Erhitzer, Kühler und Befeuchter'],
  'B1: each saved process adds an equipment section after its state-point section');
assert.deepEqual(hxDto.sections.map(section => section.recordIndex), [0, 0, 1, 1],
  'B1: sections of one record share recordIndex (one page per process)');
const summerEquipment = hxDto.sections[1];
const expectedSummerSizing = equipmentSizing(summerRecord.input, summerRecord.path, summerRecord.process);
assert.ok(expectedSummerSizing.rows.length > 0, 'fixture must produce equipment rows');
assert.deepEqual(summerEquipment.rows.map(row => row.join('|')),
  expectedSummerSizing.rows.map(row => [row.label, row.value, row.unit || ''].join('|')),
  'B1: PDF equipment rows must be exactly the equipmentSizing() rows (same source as UI)');
assert.ok(summerEquipment.rows.some(row => row[0] === 'Kühlerleistung' && row[1] !== '—'), 'B1: cooler power row present');
assert.ok(summerEquipment.rows.some(row => row[0] === 'Befeuchterleistung'), 'B1: humidifier row present');
const winterEquipment = hxDto.sections[3];
assert.ok(winterEquipment.rows.some(row => row[0] === 'Vorerhitzerleistung' || row[0] === 'Nacherhitzerleistung'),
  'B1: adiabatic process carries pre-/reheater rows');

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
const hxCommands = pdfTextCommands(hxPdf);
assert.equal(hxCommands.filter(cmd => cmd.text.startsWith('Erhitzer, Kühler und Befeuchter')).length, 2,
  'B1: equipment section title appears once per saved process in the PDF text layer');
assert.ok(hxCommands.some(cmd => cmd.text === 'Kühlerleistung'), 'B1: equipment rows appear in the PDF text layer');
assert.ok(hxCommands.some(cmd => cmd.text.includes('Test Sommer - h,x-Diagramm')), 'B1: diagram title still present');

// --- B2: notes block wraps long hints inside the value field ---
const LONG_WATER_NOTE = 'Die berechnete Patronenzahl gilt für die vollständige Erstbefüllung der Anlage inklusive Nachspeise-Reserve (VN). Im Regelbetrieb ist nur der deutlich geringere Ergänzungswasserbedarf über die Patrone zu führen; die Anzahl bezeichnet den Patronenvorrat, nicht die gleichzeitig eingebauten Patronen.';
const SHORT_NOTE = 'Arbeitsdruck muss mindestens so hoch wie der mögliche Enddruck am hydraulischen Einbindpunkt sein.';
const m = PDF_THEME.margin;
const w = PDF_PAGE.width - m * 2;
const innerX = m + 5;
const innerW = w - 10;
const labelW = innerW * 0.25;
const valueX = innerX + labelW;
const valueW = innerW * 0.75;
const boxRight = innerX + innerW;

const noteLines = splitPdfText(LONG_WATER_NOTE, valueW - 4, 6.35, 'F1');
assert.ok(noteLines.length <= 3, `B2: long water-treatment note must wrap into at most 3 lines (got ${noteLines.length})`);
assert.ok(noteLines.every(line => estimateTextWidth(line, 6.35, 'F1') <= valueW),
  'B2: every wrapped line must stay within the value field width');
assert.equal(splitPdfText(SHORT_NOTE, valueW - 4, 6.35, 'F1').length, 1,
  'B2: short notes keep their single-line rendering');

const notesReport = new GlobalPdfReport({});
notesReport.renderSection({
  title: 'Hinweise',
  isNotesBlock: true,
  rows: [['Wasseraufbereitung', LONG_WATER_NOTE, ''], ['Sprührohrentgaser', SHORT_NOTE, '']]
});
const valueCommands = notesReport.pages.flat()
  .map(cmd => cmd.match(/^BT \/F1 6\.35 Tf ([0-9.\-]+) [0-9.\-]+ Td <([0-9A-F]+)> Tj ET$/))
  .filter(Boolean)
  .map(match => ({ x: Number(match[1]), text: Buffer.from(match[2], 'hex').toString('latin1') }));
assert.ok(valueCommands.length >= 4, 'B2: both notes must render their value lines');
const longNoteCommands = valueCommands.filter(cmd => Math.abs(cmd.x - valueX) < 0.01 && /Patronenzahl|Regelbetrieb|Anzahl bezeichnet|Ergänzungswasserbedarf|Patronen/.test(cmd.text));
assert.ok(longNoteCommands.length >= 2 && longNoteCommands.length <= 3, 'B2: the long note is drawn in at most 3 lines');
for (const cmd of valueCommands) {
  const right = cmd.x + estimateTextWidth(cmd.text, 6.35, 'F1');
  assert.ok(right <= boxRight + 0.5, `B2: drawn line "${cmd.text.slice(0, 30)}…" overflows the notes field (right ${right.toFixed(2)} > ${boxRight.toFixed(2)})`);
}

// --- B3: rainwater warnings use the unified notes-block style ---
const rainDto = {
  metadata: { dtoType: 'techcalc.rainwater.report', moduleTitle: 'Regenwasser' },
  surfaces: [],
  warnings: ['Herstellerwert ohne Anstauhöhe prüfen.', 'NotüberlaufBemessung gegen Starkregenereignis kontrollieren.']
};
const rainSections = buildRainwaterReportSections(rainDto);
assert.equal(rainSections.length, 1, 'only the warnings section is produced for the fixture');
const rainNotes = rainSections[0];
assert.match(rainNotes.title, /Hinweise \/ Prüfhinweise/);
assert.equal(rainNotes.isNotesBlock, true, 'B3: rainwater warnings must be flagged as notes block');
assert.ok(!rainNotes.fullWidthRows, 'B3: fullWidthRows must no longer be set for the warnings section');
assert.deepEqual(rainNotes.rows[0].slice(0, 2), ['', 'Herstellerwert ohne Anstauhöhe prüfen.'],
  'B3: warning rows stay [label, text, unit] pairs with empty label');
const rainPdfSections = reportSections({ id: 'rainwater', title: 'Regenwasser', shortTitle: 'Regenwasser', reportSource: 'typed-dto', reportDto: rainDto });
const rainItems = lineSectionItems(rainPdfSections[0].rows, rainPdfSections[0].title, [], rainPdfSections[0].isNotesBlock);
assert.equal(rainItems.length, 1);
assert.equal(rainItems[0].isNotesBlock, true, 'B3: the notes flag survives into the rendered items');
const rainReport = new GlobalPdfReport({});
let notesBlockCalled = 0;
const originalNotesBlock = rainReport.notesBlock.bind(rainReport);
rainReport.notesBlock = item => { notesBlockCalled += 1; return originalNotesBlock(item); };
rainReport.renderSection(rainPdfSections[0]);
assert.equal(notesBlockCalled, 1, 'B3: rainwater warnings render through the central notesBlock renderer');

// --- B4: authority front-matter pages carry no continuation band ---
installAuthorityCoverPage(GlobalPdfReport);
const surfaces = Array.from({ length: 60 }, (_, index) => ({
  name: `Fläche ${index + 1}`,
  areaType: 'roof',
  areaM2: 100 + index,
  runoffCoefficientCs: 0.9,
  weightedCsAreaM2: 90 + index
}));
const floodingDto = {
  metadata: { dtoType: 'techcalc.flooding-verification.report', dtoVersion: 1, moduleTitle: 'Überflutungsnachweis', reportHeading: 'Behördennachweis' },
  summary: { planningVolumeM3: 42, governingLabel: 'DIN 1986-100' },
  projectReference: { authorityName: 'Stadtentwässerung', authorityReference: 'AZ-1' },
  surfaces,
  rainfall: { governingDurationMinutes: 15 },
  hydraulics: {},
  floodingVerification: { totalAreaM2: 3000 },
  retentionVerification: {},
  diagnostics: { statusLabel: 'ok', counts: { errors: 0, warnings: 0, hints: 0 }, items: [] },
  interpretation: {},
  sources: []
};
const floodingModuleData = {
  id: 'flooding-verification',
  title: 'Überflutungsnachweis',
  shortTitle: 'Überflutung',
  reportSource: 'typed-dto',
  reportDto: floodingDto
};
const floodingReport = new GlobalPdfReport({});
floodingReport.build(project, floodingModuleData);
assert.ok(floodingReport.pages.length >= 4, 'B4: fixture must produce cover, TOC and a multi-page protocol');
const bandCommand = /^BT \/F2 7 Tf [0-9.\-]+ [0-9.\-]+ Td <([0-9A-F]+)> Tj ET$/;
const pageBand = page => page.some(cmd => {
  const match = cmd.match(bandCommand);
  return Boolean(match) && Buffer.from(match[1], 'hex').toString('latin1') === 'TechCalc Pro';
});
const pageTexts = page => page
  .map(cmd => cmd.match(/Td <([0-9A-F]+)> Tj/))
  .filter(Boolean)
  .map(match => Buffer.from(match[1], 'hex').toString('latin1'));
for (let index = 0; index < 3; index += 1) {
  assert.ok(!pageBand(floodingReport.pages[index]),
    `B4: page ${index + 1} (front matter / first protocol page) must not carry the continuation band`);
}
for (let index = 3; index < floodingReport.pages.length; index += 1) {
  assert.ok(pageBand(floodingReport.pages[index]),
    `B4: page ${index + 1} (protocol follow-up page) must carry the continuation band`);
}
const projektCount = floodingReport.pages.flatMap(pageTexts).filter(text => text === 'PROJEKT').length;
assert.equal(projektCount, 1, 'B4: the full PROJEKT meta block appears exactly once (first protocol page)');
assert.ok(pageTexts(floodingReport.pages[2]).includes('PROJEKT'), 'B4: PROJEKT block stays on the first protocol page (page 3)');

console.log('phase 49 review round 2 (B1-B4) regression ok');
