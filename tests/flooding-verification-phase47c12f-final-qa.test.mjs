import assert from 'node:assert/strict';
import { applyAuthorityReportPolicy, authorityPublicChapterTitle } from '../js/core/pdf/authorityReportPolicy.js';

const titles = [
  '1. Ergebniszusammenfassung',
  '2. Planerische Interpretation',
  '4. Flächenübersicht (3)',
  '5. Regendaten und Berechnungsgrundlagen',
  '6. Leitungs- und Abflussnachweis',
  '7. DIN 1986-100 - Gleichung (20)',
  '7. DIN 1986-100 - Gleichung (20) (Fortsetzung)',
  '8. DIN 1986-100 - Gleichung (21), Dauerstufenvergleich',
  '9. DWA-A 117 - Anwendungs- und Parameterprüfung',
  '10. DWA-A 117 - Dauerstufenvergleich',
  '12. Quellen, Versionen und Nachweisidentität'
];

const expected = [
  '1. Ergebniszusammenfassung',
  '2. Planerische Einordnung',
  '3. Flächenübersicht',
  '4. Regendaten und Berechnungsgrundlagen',
  '5. Behördliche Einleitungsrandbedingung',
  '6. DIN 1986-100 - Gleichung (20)',
  '6. DIN 1986-100 - Gleichung (20) (Fortsetzung)',
  '7. DIN 1986-100 - Gleichung (21), Dauerstufenvergleich',
  '8. DWA-A 117 - Anwendungs- und Parameterprüfung',
  '9. DWA-A 117 - Dauerstufenvergleich',
  '10. Verwendete Regelwerke und Datengrundlagen'
];

assert.deepEqual(titles.map(authorityPublicChapterTitle), expected);

const publicSections = titles.map(title => applyAuthorityReportPolicy({
  title,
  rows: [['DIN 1986-100', 'Überflutungsnachweis'], ['KOSTRA-DWD', 'Regenspenden']]
}, { hydraulics: { dischargeMode: 'authority-discharge-limit' } })).filter(Boolean);

const chapterNumbers = publicSections
  .map(section => Number(/^([0-9]+)\./.exec(section.title)?.[1]))
  .filter(Number.isFinite);

assert.deepEqual([...new Set(chapterNumbers)], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.equal(authorityPublicChapterTitle('Unnummerierter Titel'), 'Unnummerierter Titel');

console.log('Phase 47C.12F final PDF QA numbering gate ok');
