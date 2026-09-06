import assert from 'node:assert/strict';

import drinkingWaterModule from '../js/modules/drinking-water/index.js';
import { createConsumer, createSingleGroup, createUsageUnit } from '../js/modules/drinking-water/logic.js';
import { lineSectionItems, reportSections } from '../js/core/pdf/pdfDataMapping.js';

function fixture(typeId, count, patch = {}) {
  return {
    ...createConsumer({ typeId, count, permanent: Boolean(patch.permanent) }),
    id: `${typeId}-${count}`,
    ...patch
  };
}

const usageUnit = createUsageUnit({
  name: 'WC Kern EG',
  consumers: [
    fixture('wcCistern', 5),
    fixture('urinalFlush', 3),
    fixture('basin', 2)
  ]
});
usageUnit.id = 'unit-wc-core-eg';

const singleGroup = createSingleGroup({
  name: 'Putzräume/Außenarmatur',
  consumers: [
    fixture('tapDn15', 1),
    fixture('utilitySinkMixer', 5)
  ]
});
singleGroup.id = 'single-cleaning-outdoor';

const snapshot = {
  buildingType: 'school',
  waterHeatingMode: 'central',
  savedUsageUnits: [usageUnit],
  savedSingleConsumers: [singleGroup]
};

drinkingWaterModule.calculate(snapshot);
const dto = drinkingWaterModule.report(snapshot);
const sections = reportSections({
  id: 'drinking-water',
  title: 'Trinkwasserberechnung',
  shortTitle: 'Trinkwasser',
  reportDto: dto,
  reportSource: 'typed-dto'
});
const blocks = sections
  .filter(section => section.isLineSection)
  .flatMap(section => lineSectionItems(section.rows));
const blockTitles = blocks.map(block => block.title);

assert.deepEqual(blockTitles, [
  '1. Berechnungsergebnisse',
  '2. Dimensionierung Hauseinführung',
  '3. WC Kern EG',
  '4. Putzräume/Außenarmatur',
  '5. Zusammenstellung Einrichtungsgegenstände'
]);

const rows = blocks.flatMap(block => block.rows);
assert.ok(rows.some(row => row[0] === 'Gebäude-/Nutzungsart' && row[1] === 'Schule / Verwaltungsgebäude'));
assert.ok(rows.some(row => row[0] === 'Warmwasserbereitung' && row[1] === 'Zentrale Warmwasserbereitung'));
assert.ok(rows.some(row => row[0] === 'Spitzendurchfluss' && row[2] === 'l/s'));
assert.ok(rows.some(row => row[0] === 'Gesamtsummendurchfluss' && row[2] === 'l/s'));
assert.ok(rows.some(row => row[0] === 'Nennweite Hauseinführung' && /^DN /.test(row[1])));
assert.ok(rows.some(row => row[0] === 'Wasserzähler' && /^Q3 /.test(row[1])));
assert.ok(rows.some(row => row[0] === 'Q3 Wasserzähler' && row[2] === 'm³/h'));
assert.ok(!rows.some(row => row[1] === 'school'));

const summary = blocks.find(block => block.title === '5. Zusammenstellung Einrichtungsgegenstände');
assert.ok(summary, 'Zusammenstellung der Einrichtungsgegenstände muss abschließend ausgegeben werden');
const fixtureRows = summary.rows;
const spuelkasten = fixtureRows.find(row => row[0] === '1. Spülkasten');
const urinal = fixtureRows.find(row => row[0] === '2. Urinal-Druckspüler');
const basin = fixtureRows.find(row => row[0] === '3. Waschtisch / Bidet');
const tap = fixtureRows.find(row => row[0] === '4. Auslauf DN15');
const utility = fixtureRows.find(row => row[0] === '5. Ausgussbecken MB');

assert.ok(spuelkasten?.[1].includes('Anzahl 5 Stk.'));
assert.ok(spuelkasten?.[1].includes('Berechnungsdurchfluss je Stück 0,13 l/s'));
assert.ok(spuelkasten?.[1].includes('Summe Berechnungsdurchfluss 0,65 l/s'));
assert.ok(spuelkasten?.[1].includes('Mindestfließdruck 0,05 bar'));
assert.ok(spuelkasten?.[1].includes('nur Kaltwasser'));
assert.ok(urinal?.[1].includes('Anzahl 3 Stk.'));
assert.ok(basin?.[1].includes('mit Warmwasser'));
assert.ok(tap?.[1].includes('Anzahl 1 Stk.'));
assert.ok(utility?.[1].includes('Anzahl 5 Stk.'));
assert.ok(!fixtureRows.some(row => /^Einrichtungsgegenstand \d+$/.test(row[0])));

console.log('drinking-water saved-record PDF result and fixture summary regression ok');
