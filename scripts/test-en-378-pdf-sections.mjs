import assert from 'node:assert/strict';

import { buildEN378ReportSections } from '../js/core/pdf/en378ReportSections.js';
import { reportSections } from '../js/core/pdf/pdfDataMapping.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../js/modules/en-378-safety-check/reportAdapter.js';

const state = {
  importedSystemName: 'Wärmepumpe Dachzentrale',
  refrigerantId: 'R-32',
  chargeKg: '2.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasGasWarningSystem: 'yes',
  hasMachineryRoom: 'no',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes'
};

const calculation = calculate(state);
const dto = buildEN378SafetyCheckReportDto({ state, calculation, generatedAt: '2026-09-01T00:00:00.000Z' });
const sections = buildEN378ReportSections(dto);
const mappedSections = reportSections({ reportSource: 'typed-dto', reportDto: dto });
const serialized = JSON.stringify(mappedSections);

assert.ok(sections.length >= 8);
assert.equal(sections[0].title, '1. Berichtszusammenfassung');
assert.ok(mappedSections.some(section => section.title === '6. Planer-Leitfaden'));
assert.equal(serialized.includes('not-assessed'), false);
assert.equal(serialized.includes('refrigerantId'), false);
assert.equal(serialized.includes('chargeKg'), false);
assert.equal(serialized.includes('roomVolumeM3'), false);
assert.equal(serialized.includes('qlmvKgM3'), false);
assert.ok(serialized.includes('Anforderungen nach aktuellem Prüfstand erfüllt'));
assert.ok(serialized.includes('Kältemittel'));

console.log('EN 378 PDF section tests passed.');
