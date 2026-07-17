import assert from 'node:assert/strict';
import { applyAuthorityReportPolicy } from '../js/core/pdf/authorityReportPolicy.js';

const dto = {
  hydraulics: { dischargeMode: 'authority-discharge-limit' }
};

const summary = applyAuthorityReportPolicy({
  title: '1. Ergebniszusammenfassung',
  rows: [
    ['Planerisch anzusetzendes Speichervolumen', '75,51', 'm³'],
    ['Maßgebender Nachweis', 'DIN 1986-100', ''],
    ['DIN 1986-100', '75,51', 'm³'],
    ['DWA-A 117', '15,40', 'm³'],
    ['Nachweisstatus', 'vollständig', ''],
    ['Begründung', 'DIN ist maßgebend.', ''],
    ['Bemessungsregel', 'Größerer Wert.', '']
  ]
}, dto);
assert.deepEqual(summary.rows.map(row => row[0]), [
  'Planerisch anzusetzendes Speichervolumen',
  'Maßgebender Nachweis',
  'DIN 1986-100',
  'DWA-A 117'
]);

const interpretation = applyAuthorityReportPolicy({
  title: '2. Planerische Interpretation',
  rows: [
    ['Zusammenfassung', 'Doppelter Ergebnistext', ''],
    ['Leitungsnachweis', 'Warnender Text', ''],
    ['DWA-A 117', 'Einfaches Verfahren anwendbar.', ''],
    ['Normative Aussage', 'Größerer Wert ist anzusetzen.', ''],
    ['Handlungsempfehlung', 'Doppelter Empfehlungstext', '']
  ]
}, dto);
assert.equal(interpretation.title, '2. Planerische Einordnung');
assert.deepEqual(interpretation.rows.map(row => row[0]), ['DWA-A 117', 'Normative Aussage']);

const hydraulics = applyAuthorityReportPolicy({
  title: '6. Leitungs- und Abflussnachweis',
  rows: [
    ['Betriebsart', 'behördliche Einleitungsbegrenzung', ''],
    ['Erforderlicher Regenwasserabfluss Qᵣ', '31,65', 'l/s'],
    ['Verfügbarer Abfluss Qab', '1,00', 'l/s'],
    ['Auslastung', '3.165,0', '%'],
    ['Nachweis', 'nicht ausreichend / unvollständig', ''],
    ['Nennweite', 'DN 100', ''],
    ['Gefälle', '1,0', '%'],
    ['Quelle Qab', 'Behördliche Vorgabe', ''],
    ['Behördliche Einleitungsbegrenzung', '1,00', 'l/s']
  ]
}, dto);
assert.equal(hydraulics.title, '6. Behördliche Einleitungsrandbedingung');
assert.deepEqual(hydraulics.rows.map(row => row[0]), [
  'Betriebsart',
  'Quelle Qab',
  'Zulässiger Einleitungsabfluss'
]);
assert.doesNotMatch(JSON.stringify(hydraulics), /Auslastung|nicht ausreichend|erforderlicher Regenwasserabfluss/i);

assert.equal(applyAuthorityReportPolicy({
  title: '11. Diagnosen, Warnungen und Empfehlungen',
  rows: [['Warnungen', '2', '']]
}, dto), null);

const sources = applyAuthorityReportPolicy({
  title: '12. Quellen, Versionen und Nachweisidentität',
  rows: [['DIN 1986-100', 'Überflutungsnachweis', '']]
}, dto);
assert.match(sources.title, /^11\./);

const emptyReference = applyAuthorityReportPolicy({
  title: '3. Projekt- und Behördenreferenz',
  rows: [
    ['Projektbezeichnung', 'siehe Dokumentkopf', ''],
    ['Behörde / Netzbetreiber', '—', ''],
    ['Aktenzeichen / Referenz', '-', '']
  ]
}, dto);
assert.equal(emptyReference, null);

console.log('Phase 47C.11 final authority report policy ok');
