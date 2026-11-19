import assert from 'node:assert/strict';

import { buildEN378ReportSections } from '../core/pdf/en378ReportSections.js';
import { reportSections } from '../core/pdf/pdfDataMapping.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../modules/en-378-safety-check/reportAdapter.js';

const state = {
  importedSystemName: 'Wärmepumpe Dachzentrale',
  importStatusMessage: 'Anlage wurde importiert. Die Angaben wurden als Kopie übernommen.',
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

assert.equal(sections.length, 9);
const safetySection = sections.find(section => section.title === '7. Sicherheitskomponenten nach EN 378-3');
assert.ok(safetySection, 'Abschnitt 7 existiert');
assert.ok(
  safetySection.rows.some(row => ['Offen', 'Nicht erfüllt', 'Erforderliche Maßnahmen', 'Erfüllt'].includes(row[0])),
  'Abschnitt 7 gruppiert die Prüfpunkte nach Status (Kopfzeilen Offen/Nicht erfüllt/Erforderliche Maßnahmen/Erfüllt).'
);
assert.equal(sections[0].title, '1. Berichtszusammenfassung');
assert.ok(mappedSections.some(section => section.title === '6. Plausibilitätsprüfung der Eingaben'));
assert.ok(mappedSections.some(section => section.title === '8. Planer-Leitfaden'));
assert.ok(mappedSections.some(section => section.title === '7. Sicherheitskomponenten nach EN 378-3'));
assert.equal(mappedSections.some(section => section.title === '9. Bestätigte Prüfpunkte'), false, 'Bestätigte Prüfpunkte werden bereits unter Punkt 7 vollständig ausgegeben und dürfen nicht erneut erscheinen.');
assert.equal(mappedSections.some(section => section.title === '9. Datenstand und Berichtserstellung'), true, 'Der Datenstand folgt nach Wegfall des doppelten Abschnitts mit fortlaufender Nummerierung.');
assert.equal(serialized.includes('not-assessed'), false);
assert.equal(serialized.includes('refrigerantId'), false);
assert.equal(serialized.includes('chargeKg'), false);
assert.equal(serialized.includes('roomVolumeM3'), false);
assert.equal(serialized.includes('qlmvKgM3'), false);
assert.ok(serialized.includes('Anforderungen nach aktuellem Prüfstand erfüllt'));
assert.ok(serialized.includes('Kältemittel'));
assert.ok(serialized.includes('Alternative Vorkehrungen'));

const inconsistentState = {
  ...state,
  installationLocation: 'occupied-space',
  installationClass: 'II',
  accessArea: 'general-access'
};
const inconsistentCalculation = calculate(inconsistentState);
const inconsistentDto = buildEN378SafetyCheckReportDto({ state: inconsistentState, calculation: inconsistentCalculation, generatedAt: '2026-09-01T00:00:00.000Z' });
const inconsistentSections = reportSections({ reportSource: 'typed-dto', reportDto: inconsistentDto });
const inconsistentSerialized = JSON.stringify(inconsistentSections);
assert.ok(inconsistentSerialized.includes('Klasse II mit Aufstellort abgleichen'));
assert.ok(inconsistentSerialized.includes('Aufstellort auf Maschinenraum oder Außenaufstellung ändern'));
assert.equal(inconsistentSerialized.includes('state-consistency'), false);

// Planer-Checkliste: abgehakte erforderliche Punkte erscheinen im PDF als
// Kennzeichen "berücksichtigt (Planer)" - getrennt vom normativen Status.
const acknowledgedState = {
  ...state,
  en378ChecklistAcknowledged: { 'handover.site-inspection': '2026-11-19T10:00:00.000Z' }
};
const acknowledgedCalculation = calculate(acknowledgedState);
const acknowledgedDto = buildEN378SafetyCheckReportDto({ state: acknowledgedState, calculation: acknowledgedCalculation, generatedAt: '2026-09-01T00:00:00.000Z' });
const acknowledgedSections = reportSections({ reportSource: 'typed-dto', reportDto: acknowledgedDto });
const guidanceSection = acknowledgedSections.find(section => section.title === '8. Planer-Leitfaden');
assert.ok(
  guidanceSection.rows.some(r => String(r[1]).includes('berücksichtigt (Planer)')),
  'Abgehakte Punkte müssen im PDF-Abschnitt 8 als "berücksichtigt (Planer)" gekennzeichnet sein.'
);
assert.ok(
  guidanceSection.rows.some(r => String(r[1]).includes('berücksichtigt (Planer)') && String(r[1]).includes('erforderlich:')),
  'Das Kennzeichen sitzt am erforderlichen Punkt und nicht am normativen Status "erfüllt".'
);
assert.ok(!JSON.stringify(acknowledgedSections).includes('berücksichtigt (Planer) – erfüllt'), 'Kennzeichen und normativer Status bleiben getrennt.');

console.log('EN 378 PDF section tests passed.');
