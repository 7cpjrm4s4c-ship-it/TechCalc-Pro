import assert from 'node:assert/strict';
import { prepareAuthorityDocument } from '../js/core/pdf/authorityLargeDocument.js';
import { authorityColumnModel } from '../js/core/pdf/authorityTableLayout.js';
import { validateRepeatedHeaders } from '../js/core/pdf/authorityHeaderPolicy.js';
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

for (const section of sections) {
  const sectionPages = document.pages.filter(page =>
    page.title === section.title || page.title === `${section.title} (Fortsetzung)`
  );
  assert.ok(sectionPages.length >= 1, `Abschnitt ${section.title} muss mindestens eine Seite erzeugen.`);
  assert.equal(validateRepeatedHeaders(sectionPages), true, `Header-Wiederholung muss innerhalb von ${section.title} gültig sein.`);
}

assert.ok(document.pages.slice(1).some(page => page.title.includes('(Fortsetzung)')));
assert.ok(document.pages.every(page => page.rows.length <= 250));
assert.ok(document.pages.every(page => page.header.columns.join('|') === 'Bezeichnung|Wert|Einheit'));
assert.equal(highlightToken('Maßgebendes DIN-Volumen', '24,50'), 'governing-value');
assert.equal(highlightToken('Warnungen', '2'), 'warning');
assert.equal(highlightToken('Handlungsempfehlung', 'Prüfen'), 'recommendation');
assert.ok(document.pages.flatMap(page => page.decoratedRows).every(row => row.align.valueAlign === 'right' && row.align.unitAlign === 'right'));

const json = JSON.stringify(document);
assert.ok(json.length > 1000);
assert.deepEqual(JSON.parse(json).totalRows, 622);

console.log('47C.9D authority table layout regression gate ok');
