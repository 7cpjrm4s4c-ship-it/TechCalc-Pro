import assert from 'node:assert/strict';

import wastewaterModule from '../js/modules/wastewater/index.js';
import { calculate } from '../js/modules/wastewater/logic.js';
import { buildWastewaterRecord } from '../js/modules/wastewater/controller.js';
import { lineSectionItems, reportSections } from '../js/core/pdf/pdfDataMapping.js';

const state = {
  name: 'Test Strang 1',
  usageType: 'residential',
  kValue: '0,5',
  lineType: 'stack',
  branchType: 'with-radius',
  fillRatio: '0.5',
  slopeCmM: '1,0',
  pipeLengthM: '4',
  bends90: '2',
  continuousFlow: '0',
  pumpFlow: '0',
  rainFlow: '0',
  hasWc: 'no',
  fixtures: [
    { id: 'fixture-1', typeId: 'washbasin', quantity: '5' },
    { id: 'fixture-2', typeId: 'shower-plug', quantity: '1' },
    { id: 'fixture-3', typeId: 'urinal-flush', quantity: '3' },
    { id: 'fixture-4', typeId: 'wc-6', quantity: '4' }
  ]
};

const result = calculate(state);
const legacyRecord = {
  name: 'Test Strang 1',
  state,
  result: { qtot: result.qtot, qww: result.qww, sumDu: result.sumDu, dn: result.selected?.dn, lineType: state.lineType },
  rows: [
    ['Qtot', String(result.qtot), ''],
    ['Qww', String(result.qww), ''],
    ['Sum Du', String(result.sumDu), ''],
    ['Nennweite', result.selected?.dn, ''],
    ['Line Type', state.lineType, '']
  ]
};
const record = buildWastewaterRecord(state, result, [], 'wastewater-test', 'Test Strang 1');
wastewaterModule.calculate(state);
const dto = wastewaterModule.report({ ...state, savedCalculations: [legacyRecord, record] });
const sections = reportSections({
  id: 'wastewater',
  title: 'Schmutzwasser',
  shortTitle: 'Schmutzwasser',
  reportDto: dto,
  reportSource: 'typed-dto'
});
const section = sections.find(item => item.isLineSection && item.title === 'Berechnung');
assert.ok(section, 'gespeicherter Schmutzwasser-Record muss als eigener PDF-Abschnitt exportiert werden');
const rows = section.rows;
const blocks = lineSectionItems(rows);
const blockTitles = blocks.map(item => item.title);
assert.deepEqual(blockTitles, ['Test Strang 1', 'Einrichtungsgegenstände', 'Berechnungsergebnisse']);

assert.ok(rows.some(row => row[0] === 'Nutzungsart' && row[1].includes('Wohnhäuser')));
assert.ok(rows.some(row => row[0] === 'Leitungsart' && row[1] === 'Fallleitung'));
assert.ok(rows.some(row => row[0] === 'Abzweigart Fallleitung' && row[1] === 'mit Innenradius'));

const fixtureRows = blocks.find(item => item.title === 'Einrichtungsgegenstände')?.rows || [];
const urinal = fixtureRows.find(row => row[0] === '3. Einzelurinal mit Druckspüler');
const wc = fixtureRows.find(row => row[0] === '4. WC mit 6,0 l Spülkasten/Druckspüler');
assert.ok(urinal, 'Urinal mit Druckspüler muss als eigener Gegenstand erscheinen');
assert.ok(wc, 'WC mit 6 l Spülkasten muss als eigener Gegenstand erscheinen');
assert.match(urinal[1], /Anzahl 3 Stk\./);
assert.match(urinal[1], /DU-Wert 0,5 DU\/Stk\./);
assert.match(urinal[1], /Summe DU 1,5 DU/);
assert.match(urinal[1], /Mindestnennweite DN 50/);
assert.match(wc[1], /Anzahl 4 Stk\./);
assert.match(wc[1], /DU-Wert 2 DU\/Stk\./);
assert.match(wc[1], /Summe DU 8 DU/);
assert.match(wc[1], /Mindestnennweite DN 80 bis DN 100/);
assert.equal(fixtureRows.length, state.fixtures.length);
assert.ok(!rows.some(row => ['Entwässerungsgegenstand', 'Anzahl', 'Anschlusswert je Stück', 'Anschlusswert gesamt', 'Mindestnennweite Gegenstand'].includes(row[0])));

assert.ok(rows.some(row => row[0] === 'Summe Anschlusswerte' && row[1] === '12,8' && row[2] === 'DU'));
assert.ok(rows.some(row => row[0] === 'Dimensionierungsansatz' && row[1].includes('Tabelle 8')));
assert.ok(rows.some(row => row[0] === 'Berechnungsansatz' && row[1].includes('Schmutzwasserabfluss Qww')));
assert.ok(rows.some(row => row[0] === 'Berechnungsansatz' && row[1].includes('Wurzel(ΣDU)')));
assert.ok(rows.some(row => row[0] === 'Ausgewählte Nennweite' && row[1] === 'DN 100'));
assert.ok(!rows.some(row => ['Qtot', 'Qww', 'Sum Du', 'Line Type'].includes(row[0])));

console.log('wastewater saved-record PDF content regression ok');
