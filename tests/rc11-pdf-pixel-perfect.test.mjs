import assert from 'node:assert/strict';
import { GlobalPdfReport } from '../js/core/pdf/pdfLayout.js';
import { sanitizeText, splitPdfText } from '../js/core/pdf/pdfText.js';
import { PDF_PAGE, PDF_THEME, REPORT_TEMPLATE_VERSION } from '../js/core/pdf/reportTheme.js';
import { reportSections } from '../js/core/pdf/pdfDataMapping.js';

const longRows = Array.from({ length: 96 }, (_, index) => [
  `Sehr langer Tabellenparameter ${index + 1} mit Umlauten äöü und Sonderzeichen`,
  `${(index + 1) * 12.345}`,
  index % 3 === 0 ? 'm³/h ± Δp → µ-Wert' : 'Pa/m'
]);

const moduleData = {
  id: 'drinking-water',
  title: 'Trinkwasser Dimensionierung',
  shortTitle: 'Trinkwasser',
  sections: [
    { title: 'Ergebnis Zusammenfassung mit sehr langer Überschrift für Umbruchvalidierung', rows: longRows }
  ]
};

const project = {
  project: 'Projekt mit sehr langer Bezeichnung und Sonderzeichen äöüß – Neubau Ostflügel',
  projectNo: 'TC-2026-RC11',
  client: 'Muster Auftraggeber GmbH & Co. KG',
  engineer: 'QA Engineering',
  companyName: 'Muster Ingenieure GmbH',
  companyAddress: 'Sehr lange Straße 123, 12345 Musterstadt, Deutschland, Telefon +49 123 456789, E-Mail qa@example.test',
  documentVersion: 'RC.11 Pixel Perfect QA',
  checkedBy: 'QA',
  approvedBy: 'SVP Engineering'
};

assert.equal(REPORT_TEMPLATE_VERSION, 'global-report-template-9-rc11-1-pdf-table-dedupe');
assert.equal(sanitizeText('m³/h ± Δp → µ-Wert Ø 18 × 1,0'), 'm3/h +/- Deltap -> u-Wert DN 18 x 1,0');
assert.ok(splitPdfText('A'.repeat(180), 42, 6.25).length > 1, 'long tokens must be wrapped');

const hxSections = reportSections({
  id: 'hx-diagram',
  title: 'h,x-Diagramm',
  sections: [{
    title: 'Berechnete Zustandspunkte',
    rows: [
      ['1 Ausgang', 'Theta32,00 °C | Phi39 % | x11,87 g/kg | h62,59 kJ/kg', '', ''],
      ['2 Taupunkt', 'Theta16,71 °C | Phi100 % | x11,87 g/kg | h46,87 kJ/kg', '', '']
    ]
  }, {
    title: 'Gespeicherte Prozesse',
    rows: [
      ['Bezeichnung', '-', '', ''],
      ['Bezeichnung', 'Test Winter', '', ''],
      ['Prozess', 'Erhitzen + adiabate befeuchten', '', '']
    ]
  }]
});
assert.equal(hxSections[0].rows[0][0], '1 Ausgang');
assert.ok(!/^1$/.test(hxSections[0].rows[0][0]), 'h,x point index must not be emitted as standalone label');
assert.equal(hxSections[1].rows[1][0], 'Bezeichnung 2');


const report = new GlobalPdfReport();
const blob = report.build(project, moduleData);
assert.equal(blob.type, 'application/pdf');
const pdf = await blob.text();
assert.match(pdf, /^%PDF-1\.4/);
assert.match(pdf, /<536569746520[0-9A-F]+20766F6E20[0-9A-F]+>/);

const textCommands = [...pdf.matchAll(/BT \/F[1-4] [0-9.]+ Tf ([0-9.\-]+) ([0-9.\-]+) Td <[0-9A-F]*> Tj ET/g)];
assert.ok(textCommands.length > 100, 'expected a populated report');
for (const [, rawX, rawY] of textCommands) {
  const x = Number(rawX);
  const y = Number(rawY);
  assert.ok(x >= PDF_THEME.margin - 18, `text x underflows page: ${x}`);
  assert.ok(x <= PDF_PAGE.width - PDF_THEME.margin + 6, `text x overflows page: ${x}`);
  assert.ok(y >= 4, `text y underflows page footer boundary: ${y}`);
  assert.ok(y <= PDF_PAGE.height - PDF_THEME.margin + 12, `text y overflows page top boundary: ${y}`);
}

const rectCommands = [...pdf.matchAll(/[0-9.]+ w ([0-9.\-]+) ([0-9.\-]+) ([0-9.]+) ([0-9.]+) re [BfS]/g)];
for (const [, rawX, rawY, rawW, rawH] of rectCommands) {
  const x = Number(rawX), y = Number(rawY), w = Number(rawW), h = Number(rawH);
  assert.ok(x >= PDF_THEME.margin - 2, `rect x underflows page: ${x}`);
  assert.ok(x + w <= PDF_PAGE.width - PDF_THEME.margin + 2, `rect x overflows page: ${x + w}`);
  assert.ok(y >= PDF_THEME.margin - 2, `rect y underflows page: ${y}`);
  assert.ok(y + h <= PDF_PAGE.height - PDF_THEME.margin + 2, `rect y overflows page: ${y + h}`);
}

const imageCommands = [...pdf.matchAll(/q ([0-9.]+) 0 0 ([0-9.]+) ([0-9.\-]+) ([0-9.\-]+) cm \/Im[A-Za-z]+ Do Q/g)];
for (const [, rawW, rawH, rawX, rawY] of imageCommands) {
  const w = Number(rawW), h = Number(rawH), x = Number(rawX), y = Number(rawY);
  assert.ok(w > 0 && h > 0, 'image dimensions must be positive');
  assert.ok(x >= PDF_THEME.margin - 2, `image x underflows page: ${x}`);
  assert.ok(x + w <= PDF_PAGE.width - PDF_THEME.margin + 2, `image x overflows page: ${x + w}`);
  assert.ok(y >= PDF_THEME.margin - 2, `image y underflows page: ${y}`);
  assert.ok(y + h <= PDF_PAGE.height - PDF_THEME.margin + 2, `image y overflows page: ${y + h}`);
}

console.log('rc11 pdf pixel perfect gate ok');
