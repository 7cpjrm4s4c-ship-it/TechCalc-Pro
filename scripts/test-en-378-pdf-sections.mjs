import assert from 'node:assert/strict';

import { buildEN378ReportSections } from '../core/pdf/en378ReportSections.js';
import { reportSections } from '../core/pdf/pdfDataMapping.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckReportDto } from '../modules/en-378-safety-check/reportAdapter.js';

const array = value => Array.isArray(value) ? value : [];

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
const safetySection = sections.find(section => section.title === '7. Sicherheitsbewertung und Lüftungsauslegung Maschinenraum');
assert.ok(safetySection, 'Abschnitt 7 existiert mit neuem Titel');
assert.ok(safetySection.rows.some(row => row[0] === 'Bewertung'), 'Abschnitt 7 enthält die Gesamtbewertung.');
assert.ok(
  safetySection.rows.every(row => !['Offen', 'Nicht erfüllt', 'Erforderliche Maßnahmen', 'Erfüllt'].includes(row[0])),
  'Abschnitt 7 listet keine Anforderungspunkte mehr (keine Status-Kopfzeilen Offen/Nicht erfüllt/Erforderliche Maßnahmen/Erfüllt).'
);
const inputSection = mappedSections.find(section => section.title === '2. Importierter Anlagenstand und Eingaben');
const inputRowValue = label => {
  const found = inputSection.rows.find(row => row[0] === label);
  return found ? String(found[1]) : '';
};
assert.equal(inputRowValue('Kältemittel'), 'R32', 'Kältemittelzeile lautet R32 (Alias R-32), nicht die rohe ID');
assert.equal(sections[0].title, '1. Berichtszusammenfassung');
assert.ok(mappedSections.some(section => section.title === '6. Plausibilitätsprüfung der Eingaben'));
assert.ok(mappedSections.some(section => section.title === '8. Planer-Leitfaden'));
assert.ok(mappedSections.some(section => section.title === '7. Sicherheitsbewertung und Lüftungsauslegung Maschinenraum'));
assert.equal(mappedSections.some(section => section.title === '9. Bestätigte Prüfpunkte'), false, 'Bestätigte Prüfpunkte werden bereits unter Punkt 8 vollständig ausgegeben und dürfen nicht erneut erscheinen.');
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
  classIiCompressorsOutsideOrMachineryRoom: 'no',
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

// Vollständiger Maschinenraum-Beispielsatz über den echten Adapter (buildEN378SafetyCheckReportDto):
// Übergabefelder (Kellergeschoss, Risikoanalyse, Personenaufenthalt), Kältemittel-Kurzform
// und Deduplizierung der Abschnitte 7/8 wird an der echten Übergabekette geprüft.
const machineryRoomState = {
  importedSystemName: 'Kälteanlage Halle 1',
  refrigerantId: 'HFKW-32',
  chargeKg: '5',
  roomVolumeM3: '79',
  installationLocation: 'machinery-room',
  installationClass: 'III',
  accessArea: 'authorized-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'underground',
  isBasementLocation: 'yes',
  ventilationType: 'mechanical',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomRiskAnalysisNotes: 'Risikoanalyse vom 18.11.2026 liegt vor.',
  machineryRoomOccupied: 'yes',
  machineryRoomRequiredAirChangeAchievable: 'yes',
  machineryRoomLargestSystemChargeKg: '5',
  machineryRoomEmergencyFanSuitable: 'yes',
  hasEmergencyVentilation: 'yes',
  hasEmergencyVentilationControlOutside: 'yes',
  hasEmergencyVentilationControlInside: 'yes',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  hasExplosionProtectedElectricalEquipment: 'yes',
  hasSafetyShutoffValves: 'yes',
  hasVentilationOpenings: 'yes'
};
const machineryRoomCalculation = calculate(machineryRoomState);
const machineryRoomDto = buildEN378SafetyCheckReportDto({ state: machineryRoomState, calculation: machineryRoomCalculation, generatedAt: '2026-11-19T00:00:00.000Z' });
const machineryRoomSections = reportSections({ reportSource: 'typed-dto', reportDto: machineryRoomDto });
const machineryRoomSerialized = JSON.stringify(machineryRoomSections);
const machineryInputSection = machineryRoomSections.find(section => section.title === '2. Importierter Anlagenstand und Eingaben');
const machineryInputRow = label => {
  const found = machineryInputSection.rows.find(row => row[0] === label);
  return found ? String(found[1]) : '';
};
assert.equal(machineryInputRow('Kellergeschoss'), 'ja', 'Kellergeschoss-Bestätigung muss übergeben werden');
assert.equal(machineryInputRow('Risikoanalyse Maschinenraum'), 'Risikoanalyse liegt vor', 'Risikoanalyse-Status muss übergeben werden');
assert.equal(machineryInputRow('Ergebnis der Risikoanalyse'), 'ja', 'Risikoanalyse-Ergebnis muss übergeben werden');
assert.ok(machineryInputRow('Bemerkungen zur Risikoanalyse').includes('Risikoanalyse vom 18.11.2026'), 'Bemerkungen zur Risikoanalyse müssen übergeben werden');
assert.equal(machineryInputRow('Kältemittel'), 'R32', 'Kältemittel-Kurzform R32 statt roher ID HFKW-32');
assert.ok(!machineryRoomSerialized.includes('HFKW-32'), 'Rohe Kältemittel-ID darf nirgends im PDF erscheinen');

const machinerySafetySection = machineryRoomSections.find(section => section.title === '7. Sicherheitsbewertung und Lüftungsauslegung Maschinenraum');
const machineryGuidanceSection = machineryRoomSections.find(section => section.title === '8. Planer-Leitfaden');
assert.ok(
  machinerySafetySection.rows.some(row => row[0] === 'Luftvolumenstrom mechanische Lüftung (4-facher Luftwechsel)' && String(row[1]).includes('m³/h')),
  'Abschnitt 7 enthält den 4-fachen Luftwechsel (besetzter Maschinenraum, machineryRoomOccupied übergeben).'
);
const section7Labels = new Set(machinerySafetySection.rows.map(row => String(row[0])));
const section8Labels = new Set(machineryGuidanceSection.rows.map(row => String(row[0])));
const duplicatedLabels = [...section7Labels].filter(label => label !== 'Bewertung' && section8Labels.has(label));
assert.deepEqual(duplicatedLabels, [], 'Kein Punkt-Titel darf sowohl in Abschnitt 7 als auch Abschnitt 8 erscheinen');
const requirementTitles = [
  ...array(machineryRoomCalculation.installationSafetyAssessment.requirements || []).map(item => item.title),
  ...array(machineryRoomCalculation.plannerGuidance.groups || []).flatMap(group => group.items || []).map(item => item.title)
];
const leakedIntoSection7 = requirementTitles.filter(title => section7Labels.has(title));
assert.deepEqual(leakedIntoSection7, [], 'Anforderungspunkte (passed/required/failed/not-assessed) dürfen nicht in Abschnitt 7 erscheinen');
const ventilationLabels = [
  'Luftvolumenstrom Notlüftung nach Gleichung (1)',
  'Luftvolumenstrom Notlüftung nach 15 Luftwechseln/h',
  'Maßgeblicher Wert',
  'Luftvolumenstrom mechanische Lüftung (4-facher Luftwechsel)'
];
for (const label of ventilationLabels) {
  assert.ok(section7Labels.has(label), `Lüftungsauslegung "${label}" steht in Abschnitt 7`);
  assert.ok(!section8Labels.has(label), `Lüftungsauslegung "${label}" steht nur in Abschnitt 7, nicht in Abschnitt 8`);
}

// --- Abschnitt 1: genau die fünf Kernzeilen; Leitfaden/Zusammenfassung nur in Abschnitt 8 ---
// Prüfregel: Jede Aussage darf im Bericht genau einmal in vollem Umfang erscheinen.
const summarySection = sections[0];
assert.equal(summarySection.title, '1. Berichtszusammenfassung');
assert.deepEqual(
  summarySection.rows.map(row => row[0]),
  ['Bewertung', 'Eingaben vollständig', 'Maßnahmen oder Planungspunkte', 'Nicht erfüllte Punkte', 'Offene Prüfpunkte'],
  'Abschnitt 1 enthält genau die fünf Kernzeilen (keine Dopplung von Leitfaden/Zusammenfassung)'
);
const guidanceDto = dto.plannerGuidance || dto.assessment?.plannerGuidance || {};
const summarySectionJson = JSON.stringify(summarySection);
if (guidanceDto.headline) assert.ok(!summarySectionJson.includes(guidanceDto.headline), 'guidance.headline erscheint nicht mehr in Abschnitt 1');
if (guidanceDto.summary) assert.ok(!summarySectionJson.includes(guidanceDto.summary), 'guidance.summary erscheint nicht mehr in Abschnitt 1');
const guidanceSectionRaw = sections.find(section => section.title === '8. Planer-Leitfaden');
assert.ok(guidanceSectionRaw && guidanceSectionRaw.rows.length > 0, 'Abschnitt 8 (Planer-Leitfaden) bleibt vollständig erhalten');
assert.ok(!summarySectionJson.includes('Leitfaden:') && !summarySection.rows.some(row => row[0] === 'Leitfaden' || row[0] === 'Zusammenfassung'), 'Zeilen "Leitfaden" und "Zusammenfassung" entfernt');
console.log('✓ Test: Abschnitt 1 gekürzt auf genau fünf Zeilen; headline/summary nur in Abschnitt 8');

// --- Abschnitt 2: Zeile "Ort des belüfteten Gehäuses" mit ausgeschriebenem Klartext (EN 378-1, 5.3 / Tab. C.1, Spalte IV) ---
const veState = {
  refrigerantId: 'HFKW-32',
  chargeKg: '5',
  roomVolumeM3: '85',
  installationLocation: 'ventilated-enclosure',
  installationClass: 'IV',
  accessArea: 'authorized-access',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'deepest-underground',
  occupantDensityBelowOnePer10m2: 'yes',
  hasEmergencyExits: 'yes',
  ventilationType: 'mechanical',
  enclosureVolumeM3: '8',
  ventilatedEnclosureDuctPerManufacturerInstructions: 'yes',
  ventilatedEnclosureFreshAirSufficient: 'yes',
  ventilatedEnclosureDuctToOutdoor: 'yes',
  ventilatedEnclosureToxicityLocationClass: 'III'
};
const veCalculation = calculate(veState);
const veDto = buildEN378SafetyCheckReportDto({ state: veState, calculation: veCalculation, generatedAt: '2026-11-21T00:00:00.000Z' });
assert.equal(veDto.input.ventilatedEnclosureToxicityLocationClass, 'III', 'Feld wird in das Report-DTO übernommen');
const veSectionsRaw = buildEN378ReportSections(veDto);
const veInputSectionRaw = veSectionsRaw.find(section => section.title === '2. Importierter Anlagenstand und Eingaben');
const veRow = veInputSectionRaw.rows.find(row => row[0] === 'Ort des belüfteten Gehäuses');
assert.ok(veRow, 'Abschnitt 2 enthält die Zeile "Ort des belüfteten Gehäuses"');
assert.ok(String(veRow[1]).includes('Aufstellungsort III – Maschinenraum oder im Freien'), 'ausgeschriebener Klartext statt nur "III"');
assert.ok(!String(veRow[1]).includes('Klasse III'), 'kein Kollisionstext der Aufstellungsort-Klassifikation in der Zeile');
const veMapped = reportSections({ reportSource: 'typed-dto', reportDto: veDto });
const veMappedInput = veMapped.find(section => section.title === '2. Importierter Anlagenstand und Eingaben');
assert.ok(veMappedInput.rows.some(row => row[0] === 'Ort des belüfteten Gehäuses' && String(row[1]).includes('Aufstellungsort III')), 'auch nach PDF-Normalisierung vorhanden');
// Gegenprobe: ohne belüftetes Gehäuse keine solche Zeile
const occInputSection = sections.find(section => section.title === '2. Importierter Anlagenstand und Eingaben');
assert.ok(!occInputSection.rows.some(row => row[0] === 'Ort des belüfteten Gehäuses'), 'Aufstellort Personen-Aufenthaltsbereich: keine Zeile "Ort des belüfteten Gehäuses"');
console.log('✓ Test: PDF-Abschnitt 2 mit Zeile "Ort des belüfteten Gehäuses" im Klartext (EN 378-1, 5.3), ohne Kollision mit Klassenbezeichnungen');

console.log('EN 378 PDF section tests passed.');
