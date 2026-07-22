import assert from 'node:assert/strict';
import { prepareAuthorityDocument } from '../js/core/pdf/authorityLargeDocument.js';
import { authorityColumnModel } from '../js/core/pdf/authorityTableLayout.js';
import { highlightToken } from '../js/core/pdf/authorityHighlightPolicy.js';

const rows = Array.from({ length: 620 }, (_, index) => [
  `Fläche ${index + 1}`,
  String((index + 1) * 1.25).replace('.', ','),
  'm²'
]);
const sections = [
  { title: '4. Flächenübersicht', rows },
  { title: '8. DIN 1986-100 – Gleichung (21)', rows: [['Maßgebendes DIN-Volumen', '24,50', 'm³']] },
  { title: '10. DWA-A 117 – Dauerstufenvergleich', rows: [['Maßgebendes Rückhaltevolumen', '31,20', 'm³']] }
];

const columns = authorityColumnModel(480);
assert.equal(Math.round(columns.label + columns.value + columns.unit), 480);
assert.deepEqual(columns.align, ['left', 'right', 'right']);

const document = prepareAuthorityDocument(sections, { contentHeight: 180, width: 480 });
assert.equal(document.totalRows, 622);
assert.equal(document.largeDocument, true);
assert.ok(document.pageCount > 10);
assert.ok(document.pages.every(page => page.header.repeat === true));
assert.ok(document.pages.every(page => page.header.columns.join('|') === 'Bezeichnung|Wert|Einheit'));
assert.ok(document.pages.every(page => page.rows.length <= 250));

const continuationPages = document.pages.filter(page => page.continued === true);
assert.ok(continuationPages.length > 0, 'Große Tabellen müssen Fortsetzungsseiten erzeugen.');
assert.ok(continuationPages.every(page => page.title.endsWith('(Fortsetzung)')));

const sectionStartPages = document.pages.filter(page => page.continued === false);
assert.equal(sectionStartPages.length, sections.length, 'Jeder Tabellenabschnitt muss mit einer eigenen Startseite beginnen.');
assert.deepEqual(sectionStartPages.map(page => page.title), sections.map(section => section.title));

assert.equal(highlightToken('Maßgebendes DIN-Volumen', '24,50'), 'governing-value');
assert.equal(highlightToken('Warnungen', '2'), 'warning');
assert.equal(highlightToken('Handlungsempfehlung', 'Prüfen'), 'recommendation');
assert.ok(document.pages.flatMap(page => page.decoratedRows).every(row => row.align.valueAlign === 'right' && row.align.unitAlign === 'right'));

const json = JSON.stringify(document);
assert.ok(json.length > 1000);
assert.deepEqual(JSON.parse(json).totalRows, 622);

console.log('47C.9D authority table layout regression gate ok');