import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';

const state = {
  schemaVersion: 4,
  systemName: 'Test',
  applicationType: 'heat-pump',
  installationType: 'stationary',
  productCategory: 'self-contained-ac-heat-pump',
  constructionType: 'self-contained',
  ratedCapacityKw: '192,9',
  refrigerantId: 'R-513A',
  chargeKg: '24,4',
  assessmentDate: '28.02.2028',
  placedOnMarketDate: '12.03.2027',
  installedAtSiteDate: '21.01.2028',
  plannedActivity: 'installation',
  refrigerantOrigin: 'new',
  preChargedStatus: 'yes',
  leakDetectionSystemStatus: 'no',
  hermeticallySealedStatus: 'no',
  hermeticallySealedLabelStatus: 'no',
  coolingBelowMinus50Status: 'no',
  siteSafetyRestrictionStatus: 'no',
  nationalSafetyStandardRestrictionStatus: 'no',
  cascadePrimaryCircuitStatus: 'no',
  specificRefrigerantLossPercent: '0',
  personCertificationStatus: 'verified',
  companyCertificationStatus: 'verified'
};

const calculation = calculate(state);
const dto = buildFGasesReportDto({ state, calculation, generatedAt: '2028-02-28T08:00:00.000Z' });
const sections = buildFGasesReportSections(dto);
const system = sections.find(section => section.title.startsWith('2.'));
assert.ok(system.rows.some(row => row[0] === 'Produkt-/Anlagenkategorie' && row[1] === 'In sich geschlossenes Klima-/Wärmepumpensystem'));
assert.ok(system.rows.some(row => row[0] === 'Zu prüfende Tätigkeit' && row[1] === 'Installation'));
assert.ok(!system.rows.some(row => /self-contained-ac-heat-pump|installation$/.test(String(row[1]))));

const documentation = sections.find(section => section.title.startsWith('5.'));
const operator = sections.find(section => section.title.startsWith('6.'));
assert.ok(documentation.rows.every(row => !/^\d+\./.test(String(row[0]))));
assert.ok(operator.rows.every(row => !/^\d+\./.test(String(row[0]))));
assert.ok([...documentation.rows, ...operator.rows].every(row => !/FG-\d+/.test(row.join(' '))));
assert.ok([...documentation.rows, ...operator.rows].every(row => !/Chemikalien-Klimaschutzverordnung \(ChemKlimaschutzV\)/.test(row[1])));

const regulations = sections.find(section => section.title.startsWith('7.'));
assert.equal(regulations.title, '7. Angewendete Rechtsgrundlagen');
assert.ok(regulations.rows.every(row => !/FG-\d+/.test(row.join(' '))));
assert.ok(regulations.rows.some(row => /VO \(EU\) 2024\/573|ChemKlimaschutzV|ChemG/.test(row[0])));
assert.ok(regulations.rows.every(row => !/EU-FGAS:|DE-CHEM/.test(row.join(' '))));

console.log('F-Gases PDF language/layout regression passed.');
