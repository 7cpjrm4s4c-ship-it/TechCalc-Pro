import assert from 'node:assert/strict';

import pressureHoldingModule from '../modules/pressure-holding/index.js';
import { calculate } from '../modules/pressure-holding/logic.js';
import { buildPressureRecord } from '../modules/pressure-holding/controller.js';
import { reportSections } from '../core/pdf/pdfDataMapping.js';

const baseState = {
  plantName: 'Test Heizung',
  systemType: 'heating',
  holdingType: 'dynamic',
  dynamicType: 'reflexomat',
  heatPowerKw: 250,
  systemVolumeL: '16.000',
  additionalVolumeL: 0,
  waterContentMode: 'manual',
  specificWaterContent: 15,
  frostMode: 'water',
  tMaxC: 80,
  tMinC: 10,
  staticHeightM: 15,
  staticPressureBar: 1.5,
  safetyValveBar: 3,
  connectionType: 'default',
  pumpPressureBar: 0,
  includeServitec: 'false'
};

function germanInteger(value) {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value);
}

const result = calculate(baseState);
assert.equal(result.systemVolume, 16000, 'calculation must use 16.000 l as 16,000 litres');
assert.ok(result.selectedStandardVolume > 0, 'calculation must determine a standard vessel volume');

const expectedStandardRaw = String(Math.round(result.selectedStandardVolume));
const expectedStandardPdf = germanInteger(result.selectedStandardVolume);

const record = buildPressureRecord(baseState, result, [], 'pressure-test', 'Test Heizung');
assert.equal(record.result.systemVolume, 16000, 'saved pressure record must preserve the litre value used by the calculation');
assert.equal(record.result.selectedStandardVolume, result.selectedStandardVolume, 'saved pressure record must preserve the calculated standard vessel volume');
assert.ok(record.rows.some(row => row[0] === 'Anlagenvolumen' && row[1] === '16000' && row[2] === 'l'));
assert.ok(record.rows.some(row => row[0] === 'Standardvolumen' && row[1] === expectedStandardRaw && row[2] === 'l'));
assert.ok(record.rows.some(row => row[0] === 'Ausdehnungskoeffizient'));
assert.ok(record.rows.some(row => row[0] === 'Ausdehnungsvolumen'));
assert.ok(record.rows.some(row => row[0] === 'Wasservorlage'));
assert.ok(record.rows.some(row => row[0] === 'Volumenfaktor'));

pressureHoldingModule.calculate(baseState);
const dto = pressureHoldingModule.report({ ...baseState, savedPlants: [record] });
const sections = reportSections({
  id: 'pressure-holding',
  title: 'Druckhaltung',
  shortTitle: 'Druckhaltung',
  reportDto: dto,
  reportSource: 'typed-dto'
});
// After Review-Runde 2 req 4: each saved record is split into Druckhaltung and accessory blocks
const druckhaltungSection = sections.find(section => section.isLineSection && section.title.includes('Druckhaltung'));
assert.ok(druckhaltungSection, 'saved pressure records must have Druckhaltung section');
const rows = druckhaltungSection.rows;
assert.ok(rows.some(row => row[0] === 'Anlagenvolumen' && row[1] === '16.000' && row[2] === 'l'));
assert.ok(rows.some(row => row[0] === 'Standardvolumen' && row[1] === expectedStandardPdf && row[2] === 'l'));
assert.ok(rows.some(row => row[0] === 'Ausdehnungskoeffizient'));
assert.ok(rows.some(row => row[0] === 'Verdampfungsdruck'));
assert.ok(rows.some(row => row[0] === 'Verwendeter statischer Druck'));

// After Workshop-Ergebnis: PDF-Blockstruktur - each accessory is a separate block
// Check that accessory blocks exist (Entgasung, Nachspeisung, Wasseraufbereitung, Sicherheitsventil)
const entgasungSection = sections.find(section => section.isLineSection && section.title.includes('Entgasung'));
const nachspeisungSection = sections.find(section => section.isLineSection && section.title.includes('Nachspeisung'));
const wasseraufbereitungSection = sections.find(section => section.isLineSection && section.title.includes('Wasseraufbereitung'));
const sicherheitsventilSection = sections.find(section => section.isLineSection && section.title.includes('Sicherheitsventil'));

// At least one accessory block should exist (Sicherheitsventil is always present)
assert.ok(sicherheitsventilSection, 'saved pressure records must have Sicherheitsventil section');

// Verify that the accessory blocks are in the correct order after Druckhaltung
const druckhaltungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Druckhaltung'));
const entgasungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Entgasung'));
const nachspeisungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Nachspeisung'));
const wasseraufbereitungIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Wasseraufbereitung'));
const sicherheitsventilIndex = sections.findIndex(s => s.isLineSection && s.title.includes('Sicherheitsventil'));

// All accessory blocks should come after Druckhaltung
if (entgasungIndex >= 0) assert.ok(entgasungIndex > druckhaltungIndex, 'Entgasung block should come after Druckhaltung');
if (nachspeisungIndex >= 0) assert.ok(nachspeisungIndex > druckhaltungIndex, 'Nachspeisung block should come after Druckhaltung');
if (wasseraufbereitungIndex >= 0) assert.ok(wasseraufbereitungIndex > druckhaltungIndex, 'Wasseraufbereitung block should come after Druckhaltung');
assert.ok(sicherheitsventilIndex > druckhaltungIndex, 'Sicherheitsventil block should come after Druckhaltung');

console.log('pressure-holding saved-record PDF values and intermediate results ok');
