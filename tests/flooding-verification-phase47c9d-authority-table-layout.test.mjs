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
assert.equal(document.pageCount, document.pages.length);
assert.ok(document.pages.length > sections.length, 'Die große Flächenliste muss auf mehrere Seiten verteilt werden.');
assert.ok(document.pages.every(page => page.header.repeat === true));
assert.ok(document.pages.every(page => page.header.columns.join('|') === 'Bezeichnung|Wert|Einheit'));
assert.ok(document.pages.every(page => page.rows.length <= 250));
assert.equal(document.pages.reduce((sum, page) => sum + page.rows.length, 0), document.totalRows);
assert.equal(document.pages.reduce((sum, page) => sum + page.decoratedRows.length, 0), document.totalRows);

const continuationPages = document.pages.filter(page => page.continued);
assert.ok(continuationPages.length > 0, 'Große Tabellen müssen Fortsetzungsseiten erzeugen.');
assert.ok(continuationPages.every(page => page.title.endsWith('(Fortsetzung)')));
assert.ok(document.pages.filter(page => !page.continued).every(page => !page.title.endsWith('(Fortsetzung)')));

assert.equal(highlightToken('Maßgebendes DIN-Volumen', '24,50'), 'governing-value');
assert.equal(highlightToken('Warnungen', '2'), 'warning');
assert.equal(highlightToken('Handlungsempfehlung', 'Prüfen'), 'recommendation');
assert.ok(document.pages.flatMap(page => page.decoratedRows).every(row => row.align.valueAlign === 'right' && row.align.unitAlign === 'right'));
assert.doesNotThrow(() => JSON.stringify(document));

console.log('47C.9D authority table layout regression gate ok');