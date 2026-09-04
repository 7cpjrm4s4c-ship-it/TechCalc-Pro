import assert from 'node:assert/strict';

import pressureHoldingModule from '../js/modules/pressure-holding/index.js';
import { calculate } from '../js/modules/pressure-holding/logic.js';
import { buildPressureRecord } from '../js/modules/pressure-holding/controller.js';
import { reportSections } from '../js/core/pdf/pdfDataMapping.js';

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

const result = calculate(baseState);
assert.equal(result.systemVolume, 16000, 'calculation must use 16.000 l as 16,000 litres');

const record = buildPressureRecord(baseState, result, [], 'pressure-test', 'Test Heizung');
assert.equal(record.result.systemVolume, 16000, 'saved pressure record must preserve the litre value used by the calculation');
assert.ok(record.rows.some(row => row[0] === 'Anlagenvolumen' && row[1] === '16.000' && row[2] === 'l'));
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
const savedSection = sections.find(section => section.isLineSection && section.title === 'Anlage');
assert.ok(savedSection, 'saved pressure records must be exported as line-section style report blocks');
const rows = savedSection.rows;
assert.ok(rows.some(row => row[0] === 'Anlagenvolumen' && row[1] === '16.000' && row[2] === 'l'));
assert.ok(rows.some(row => row[0] === 'Ausdehnungskoeffizient'));
assert.ok(rows.some(row => row[0] === 'Verdampfungsdruck'));
assert.ok(rows.some(row => row[0] === 'Verwendeter statischer Druck'));

console.log('pressure-holding saved-record PDF values and intermediate results ok');
