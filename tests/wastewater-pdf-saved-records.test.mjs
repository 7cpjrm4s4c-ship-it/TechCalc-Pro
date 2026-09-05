import assert from 'node:assert/strict';

import wastewaterModule from '../js/modules/wastewater/index.js';
import { calculate } from '../js/modules/wastewater/logic.js';
import { buildWastewaterRecord } from '../js/modules/wastewater/controller.js';
import { reportSections } from '../js/core/pdf/pdfDataMapping.js';

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
    { id: 'fixture-1', typeId: 'wc-6', quantity: '2' },
    { id: 'fixture-2', typeId: 'washbasin', quantity: '3' },
    { id: 'fixture-3', typeId: 'custom', quantity: '1', customName: 'Laborbecken', customDu: '1,3', customDn: 'DN 50' }
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
assert.ok(rows.some(row => row[0] === 'Nutzungsart' && row[1].includes('Wohnhäuser')));
assert.ok(rows.some(row => row[0] === 'Leitungsart' && row[1] === 'Fallleitung'));
assert.ok(rows.some(row => row[0] === 'Abzweigart Fallleitung' && row[1] === 'mit Innenradius'));
assert.ok(rows.some(row => row[0] === 'Entwässerungsgegenstand' && row[1].includes('WC mit 6,0 l')));
assert.ok(rows.some(row => row[0] === 'Entwässerungsgegenstand' && row[1].includes('Laborbecken')));
assert.ok(rows.some(row => row[0] === 'Anschlusswert gesamt' && row[1] === '4' && row[2] === 'DU'));
assert.ok(rows.some(row => row[0] === 'Dimensionierungsansatz' && row[1].includes('Tabelle 8')));
assert.ok(rows.some(row => row[0] === 'Berechnungsansatz' && row[1].includes('Qww = K × √ΣDU')));
assert.ok(rows.some(row => row[0] === 'Ausgewählte Nennweite' && row[1] === 'DN 100'));
assert.ok(!rows.some(row => ['Qtot', 'Qww', 'Sum Du', 'Line Type'].includes(row[0])));

console.log('wastewater saved-record PDF content regression ok');
