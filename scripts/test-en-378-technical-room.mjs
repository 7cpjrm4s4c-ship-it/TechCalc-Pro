import assert from 'node:assert/strict';

import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { assessStateConsistency } from '../modules/en-378-safety-check/stateConsistency.js';

// EN 378-3:2020-12, Abschnitt 4.5: Raum ohne Personenaufenthalt, der nicht als Maschinenraum
// ausgewiesen ist (installationLocation 'technical-room'). Anforderungsmatrix M1 bis M7.

const baseState = {
  refrigerantId: 'R-32',
  chargeKg: '5',
  roomVolumeM3: '100',
  installationLocation: 'technical-room',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'no'
};

const assess = state => assessInstallationSafetyRequirements(state, assessChargeLimit(state));
const findReq = (assessment, id) => assessment.requirements.find(item => item.id === id);

// --- Grundfeld unbeantwortet: NOT_ASSESSED ---
const unanswered = assess(baseState);
assert.equal(findReq(unanswered, 'technical-room.separated-from-occupied-spaces').status, 'not-assessed');
assert.deepEqual(findReq(unanswered, 'technical-room.separated-from-occupied-spaces').missingInputs, ['technicalRoomSeparatedFromOccupiedSpaces']);
console.log('✓ Test: unbeantworteter Raumabschluss -> NOT_ASSESSED mit missingInputs');

// --- M1 (4.5 Abs. 1): nicht abgeschlossen -> Umleitung auf 4.4 ---
const m1State = { ...baseState, technicalRoomSeparatedFromOccupiedSpaces: 'no' };
const m1 = assess(m1State);
const m1Entry = findReq(m1, 'technical-room.treated-as-occupied-space');
assert.ok(m1Entry, 'M1: Umleitungseintrag muss erscheinen');
assert.equal(m1Entry.status, 'required');
assert.equal(m1Entry.source.sourcePart, 'EN 378-3');
assert.equal(m1Entry.source.sourceSection, '4.5');
assert.match(m1Entry.requirement, /Abschnitt 4\.4/);
assert.ok(!findReq(m1, 'technical-room.exhaust-hood-flow-rate'), 'M1: keine 4.5-Detailprüfungen');
assert.ok(!findReq(m1, 'technical-room.machinery-room-treatment'), 'M1: keine M2-Prüfung');
const m1Calc = calculate(m1State);
assert.ok(m1Calc.notices.some(n => n.includes('Abschnitt 4.4')), 'M1: Hinweis auf Bewertung nach 4.4 in den Notices');
console.log('✓ Test: M1 Umleitung auf 4.4 bei nicht abgeschlossenem Raum');

// M1 + ausgefüllte 4.5-Detailfelder -> Konsistenzkonflikt
const m1Conflict = assessStateConsistency({ ...m1State, technicalRoomExhaustHoodFlowRateM3s: '0.1' });
assert.equal(m1Conflict.status, 'failed');
assert.ok(m1Conflict.requirements.some(item => item.id === 'state-consistency.technical-room-details-in-redirect'));
const m1Clean = assessStateConsistency(m1State);
assert.equal(m1Clean.status, 'passed', 'M1 ohne Detailfelder ist konsistent');
console.log('✓ Test: 4.5-Detailfelder im Umleitungsfall 4.4 sind ein Konsistenzkonflikt');

// --- M2 (4.5 Abs. 2): abgeschlossen + Verdichter/Druckbehälter -> Maschinenraum-Behandlung ---
const m2State = {
  ...baseState,
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'yes',
  machineryRoomOccupied: 'no',
  machineryRoomLargestSystemChargeKg: '5',
  hasEmergencyVentilation: 'yes',
  hasEmergencyVentilationControlOutside: 'yes',
  hasEmergencyVentilationControlInside: 'yes',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  hasExplosionProtectedElectricalEquipment: 'yes',
  machineryRoomEmergencyFanSuitable: 'yes'
  // machineryRoomRiskAnalysisResult bleibt '' -> Gate des Pfads 4.3 darf für M2 NICHT greifen
};
const m2 = assess(m2State);
const m2Marker = findReq(m2, 'technical-room.machinery-room-treatment');
assert.ok(m2Marker, 'M2: Kennzeichnung Maschinenraum-Behandlung muss erscheinen');
assert.equal(m2Marker.source.sourceSection, '4.5 i. V. m. Abschnitt 5');
const m2Access = findReq(m2, 'machinery-room.access-restricted');
assert.ok(m2Access, 'M2: Abschnitt-5-Prüfungen müssen ohne Risikoanalyse-Gate laufen');
assert.ok(String(m2Access.source.sourceSection).startsWith('4.5 i. V. m. 5'), 'M2: Abschnitt-5-Quellen werden als 4.5 i. V. m. 5.x geführt');
assert.equal(m2.requirements.some(item => String(item.source?.sourceSection || '').startsWith('4.5 i. V. m. 5')), true);
assert.ok(!findReq(m2, 'technical-room.exhaust-hood-flow-rate'), 'M2: keine M3/M4-Prüfungen');
console.log('✓ Test: M2 Maschinenraum-Behandlung (4.5 i. V. m. Abschnitt 5) ohne Risikoanalyse-Gate');

// --- M3 (4.5 Abs. 3 i. V. m. 5.13): Abzugshaube, normale Bedingungen, Schwelle 0,05 m³/s ---
const hoodBase = {
  ...baseState,
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'no',
  technicalRoomComponentsHaveDetachableJoints: 'yes',
  technicalRoomAdverseConditions: 'none',
  technicalRoomVentilationActivatesDetector: 'yes'
};
const m3pass = findReq(assess({ ...hoodBase, technicalRoomExhaustHoodFlowRateM3s: '0.06' }), 'technical-room.exhaust-hood-flow-rate');
assert.equal(m3pass.status, 'passed');
assert.equal(m3pass.details.thresholdM3s, 0.05);
assert.equal(m3pass.source.sourceSection, '4.5');
const m3boundary = findReq(assess({ ...hoodBase, technicalRoomExhaustHoodFlowRateM3s: '0.05' }), 'technical-room.exhaust-hood-flow-rate');
assert.equal(m3boundary.status, 'failed', 'M3: exakt 0,05 m³/s ist FAILED (strikte Ungleichung "mehr als")');
const m3missing = findReq(assess({ ...hoodBase, technicalRoomExhaustHoodFlowRateM3s: '' }), 'technical-room.exhaust-hood-flow-rate');
assert.equal(m3missing.status, 'not-assessed');
assert.deepEqual(m3missing.missingInputs, ['technicalRoomExhaustHoodFlowRateM3s']);
console.log('✓ Test: M3 Abzugshaube normal - > 0,05 m³/s PASSED, = 0,05 FAILED, fehlt NOT_ASSESSED');

// --- M4 (4.5 Abs. 3 mit Anmerkung 1): ungünstige Bedingungen, Schwelle 0,5 m³/s ---
for (const adverse of ['vibrations', 'corrosive-atmosphere', 'vibrations-and-corrosive']) {
  const m4boundary = findReq(assess({ ...hoodBase, technicalRoomAdverseConditions: adverse, technicalRoomExhaustHoodFlowRateM3s: '0.5' }), 'technical-room.exhaust-hood-flow-rate');
  assert.equal(m4boundary.status, 'failed', `M4 (${adverse}): exakt 0,5 m³/s ist FAILED`);
  assert.equal(m4boundary.details.thresholdM3s, 0.5);
  const m4pass = findReq(assess({ ...hoodBase, technicalRoomAdverseConditions: adverse, technicalRoomExhaustHoodFlowRateM3s: '0.51' }), 'technical-room.exhaust-hood-flow-rate');
  assert.equal(m4pass.status, 'passed', `M4 (${adverse}): 0,51 m³/s ist PASSED`);
  assert.match(m4pass.requirement, /Anmerkung 1/);
}
console.log('✓ Test: M4 ungünstige Bedingungen - Schwelle 0,5 m³/s, exakt 0,5 FAILED, 0,51 PASSED');

// --- M5 (4.5 Abs. 4 i. V. m. Abschnitt 9): detektorbetätigte Lüftung ---
// R-32: ATEL/ODL 0,30 -> 50 % = 0,15; LFL 0,307 -> 25 % = 0,07675; Minimum = 0,07675
const m5 = findReq(assess(hoodBase), 'technical-room.detector-activated-ventilation');
assert.equal(m5.status, 'passed', 'M5: Aktivierung "Ja" -> PASSED');
assert.equal(m5.details.activationThresholdKgM3, 0.07675, 'M5: min(50 % ATEL/ODL, 25 % LFL) = 0,07675 kg/m³');
assert.equal(m5.source.sourceSection, '4.5 i. V. m. Abschnitt 9');
const m5no = findReq(assess({ ...hoodBase, technicalRoomVentilationActivatesDetector: 'no' }), 'technical-room.detector-activated-ventilation');
assert.equal(m5no.status, 'failed', 'M5: Aktivierung "Nein" -> FAILED');
const m5open = findReq(assess({ ...hoodBase, technicalRoomVentilationActivatesDetector: '' }), 'technical-room.detector-activated-ventilation');
assert.equal(m5open.status, 'not-assessed');
assert.deepEqual(m5open.missingInputs, ['technicalRoomVentilationActivatesDetector']);
// R-717: charakteristischer Geruch unterhalb ATEL/ODL -> nur 25 % LFL = 0,25 * 0,116 = 0,029
const m5r717 = findReq(assess({ ...hoodBase, refrigerantId: 'R-717' }), 'technical-room.detector-activated-ventilation');
assert.equal(m5r717.details.activationThresholdKgM3, 0.029, 'M5 R-717: nur 25 % LFL = 0,029 kg/m³');
assert.equal(m5r717.details.odorCharacteristicRefrigerant, true);
console.log('✓ Test: M5 Detektoraktivierung - min(50 % ATEL, 25 % LFL); R-717 nur 25 % LFL (0,029)');

// --- M6: Detektor-/Alarm-Ketten (Abschnitte 9 bzw. 8) laufen im 4.5-Pfad mit ---
const m6State = { ...hoodBase, chargeKg: '8' }; // 0,08 kg/m³ > 0,061 -> Konzentration über praktischem Grenzwert
const m6 = assess(m6State);
assert.ok(findReq(m6, 'detector.preset'), 'M6: Detektorprüfungen nach Abschnitt 9 laufen mit');
assert.equal(findReq(m6, 'detector.preset').source.sourceSection, '9');
assert.ok(findReq(m6, 'hasDetector'), 'M6: Detektor-Feld wird geprüft');
console.log('✓ Test: M6 Wiederverwendung der Detektor-/Alarmprüfungen (Abschnitt 9/8)');

// --- M7: Konzentration vs. praktischer Grenzwert (EN 378-1 Anhang C) ---
const m7below = findReq(assess(hoodBase), 'technical-room.concentration-limit'); // 5/100 = 0,05 < 0,061
assert.equal(m7below.status, 'passed');
assert.equal(m7below.details.concentrationKgM3, 0.05);
assert.equal(m7below.details.practicalLimitKgM3, 0.061);
assert.equal(m7below.source.sourcePart, 'EN 378-1');
const m7above = findReq(m6, 'technical-room.concentration-limit'); // 8/100 = 0,08 > 0,061
assert.equal(m7above.status, 'required', 'M7: Konzentration über praktischem Grenzwert -> Lüftung/Gasnachweis nach 5.13');
assert.match(m7above.measure, /5\.13/);
// fehlende Kältemitteldaten -> NOT_ASSESSED mit missingInputs
const m7noData = assessInstallationSafetyRequirements({ ...hoodBase, refrigerantId: 'R-999' }, assessChargeLimit({ ...hoodBase, refrigerantId: 'R-999' }));
assert.equal(m7noData.status, 'not-assessed');
assert.ok(m7noData.missingInputs.includes('refrigerantId'));
// Kältemittel ohne LFL-Daten (R-134a, A1): M5-Schwelle nicht bestimmbar -> NOT_ASSESSED mit missingInputs
const m5noLfl = findReq(assess({ ...hoodBase, refrigerantId: 'R-134a' }), 'technical-room.detector-activated-ventilation');
assert.equal(m5noLfl.status, 'not-assessed');
assert.ok(m5noLfl.missingInputs.includes('lflKgM3'), 'M7/M5: fehlende LFL-Daten als missingInputs');
console.log('✓ Test: M7 Konzentration vs. praktischer Grenzwert; fehlende Kältemitteldaten -> NOT_ASSESSED');

// --- Gemeldeter Fall (Klasse-II-Plausibilität): Split-Anlage mit Innengerät im Raum ohne
// Personenaufenthalt und Verdichter (Außengerät) im Freien -> Klasse II ist zulässig
// (EN 378-1, 5.3 c; EN 378-3, 4.5), kein Konflikt 'state-consistency.class-ii-location'.
const splitSystemState = {
  ...baseState,
  installationClass: 'II',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'no', // Verdichter befindet sich im Außengerät (im Freien)
  technicalRoomComponentsHaveDetachableJoints: 'no'
};
const splitConsistency = assessStateConsistency(splitSystemState);
assert.equal(splitConsistency.status, 'passed', 'Klasse II + Technischer Raum darf kein Konflikt sein');
assert.ok(!splitConsistency.requirements.some(item => item.id === 'state-consistency.class-ii-location'));
const splitCalc = calculate(splitSystemState);
assert.ok(!splitCalc.stateConsistencyAssessment.requirements.some(item => item.id === 'state-consistency.class-ii-location'), 'kein class-ii-location im Gesamtergebnis');
assert.ok(!splitCalc.requiredMeasures.some(measure => measure.includes('Klasse II')), 'Gesamtbewertung enthält keinen Klasse-II-Konflikt');
// Gegenprobe: Klasse II im Personen-Aufenthaltsbereich bleibt ein Konflikt
const occupiedClass2 = assessStateConsistency({ ...baseState, installationLocation: 'occupied-space', installationClass: 'II' });
assert.equal(occupiedClass2.status, 'failed');
assert.ok(occupiedClass2.requirements.some(item => item.id === 'state-consistency.class-ii-location'));
assert.match(occupiedClass2.requirements.find(item => item.id === 'state-consistency.class-ii-location').measure, /4\.5/);
assert.match(occupiedClass2.requirements.find(item => item.id === 'state-consistency.class-ii-location').measure, /5\.3 c/);
console.log('✓ Test: Split-Anlage (Klasse II, Verdichter außen, Innengerät im technischen Raum) ohne class-ii-location-Konflikt');

console.log('EN 378 technical room (EN 378-3, 4.5) tests passed.');
