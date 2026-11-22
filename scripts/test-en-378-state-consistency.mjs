import assert from 'node:assert/strict';

import { calculate, normalizeEN378AssessmentState } from '../modules/en-378-safety-check/logic.js';
import { assessStateConsistency } from '../modules/en-378-safety-check/stateConsistency.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';

const baseState = {
  refrigerantId: 'R-513A',
  chargeKg: '24.4',
  roomVolumeM3: '6000',
  installationLocation: 'occupied-space',
  installationClass: 'II',
  classIiCompressorsOutsideOrMachineryRoom: 'no',
  accessArea: 'general-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'no'
};

const inconsistent = calculate(baseState);
assert.equal(inconsistent.stateConsistencyAssessment.status, 'failed');
assert.equal(inconsistent.status, 'measures-required');
assert.ok(inconsistent.requiredMeasures.some(measure => measure.includes('Aufstellort auf Maschinenraum oder Außenaufstellung')));

const resultModel = buildEN378SafetyCheckResultModel(baseState, inconsistent);
const consistencyGroup = resultModel.groups.find(group => group.title === 'Plausibilitätsprüfung der Eingaben');
assert.ok(consistencyGroup);
assert.equal(JSON.stringify(consistencyGroup).includes('state-consistency'), false);
assert.ok(JSON.stringify(consistencyGroup).includes('Klasse II mit Aufstellort abgleichen'));

const machineryRoomState = normalizeEN378AssessmentState({
  ...baseState,
  installationLocation: 'machinery-room',
  installationClass: 'II',
  accessArea: 'authorized-access'
});
const machineryRoomConsistency = assessStateConsistency(machineryRoomState);
assert.equal(machineryRoomConsistency.status, 'passed');

const machineryRoomPublicAccess = calculate({
  ...baseState,
  installationLocation: 'machinery-room',
  installationClass: 'II',
  accessArea: 'general-access'
});
assert.equal(machineryRoomPublicAccess.stateConsistencyAssessment.status, 'failed');
assert.ok(machineryRoomPublicAccess.requiredMeasures.some(measure => measure.includes('Zugangsbereich auf Zugang nur für unterwiesene oder befugte Personen')));

const ventilationContradiction = calculate({
  ...baseState,
  installationLocation: 'machinery-room',
  installationClass: 'II',
  accessArea: 'authorized-access',
  ventilationType: 'none',
  hasMechanicalVentilation: 'yes'
});
assert.equal(ventilationContradiction.stateConsistencyAssessment.status, 'failed');
assert.ok(ventilationContradiction.requiredMeasures.some(measure => measure.includes('Lüftungsart und Angabe zur mechanischen Lüftung')));

// Klasse IV (belüftetes Gehäuse) ist nur im Personen-Aufenthaltsbereich bzw. als Aufstellort "belüftetes Gehäuse" zulässig
const classIvEnclosure = assessStateConsistency({ ...baseState, installationLocation: 'ventilated-enclosure', installationClass: 'IV' });
assert.equal(classIvEnclosure.status, 'passed', 'Klasse IV mit Aufstellort belüftetes Gehäuse ist konsistent');
const classIvOutdoor = assessStateConsistency({ ...baseState, installationLocation: 'outdoor', installationClass: 'IV' });
assert.equal(classIvOutdoor.status, 'failed');
assert.ok(classIvOutdoor.requirements.some(item => item.id === 'state-consistency.class-iv-location'));
const classIvOccupied = assessStateConsistency({ ...baseState, installationLocation: 'occupied-space', installationClass: 'IV' });
assert.equal(classIvOccupied.status, 'passed', 'Klasse IV im Personen-Aufenthaltsbereich bleibt zulässig');

// EN 378-3 Abschnitte 8 und 9: Alarmierung ohne Gaswarnanlage und ohne Detektor ist ein
// Konflikt (keine Auslösehardware vorhanden) und darf nicht zur Gesamtbewertung "acceptable" führen.
const alarmNoHardwareState = {
  ...baseState,
  installationLocation: 'occupied-space',
  installationClass: 'I',
  hasGasWarningSystem: 'no',
  hasDetector: 'no',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes'
};
const alarmNoHardware = assessStateConsistency(alarmNoHardwareState);
assert.equal(alarmNoHardware.status, 'failed');
assert.ok(alarmNoHardware.requirements.some(item => item.id === 'state-consistency.alarm-without-trigger-hardware'));

const alarmNoHardwareCalc = calculate(alarmNoHardwareState);
assert.equal(alarmNoHardwareCalc.stateConsistencyAssessment.status, 'failed');
assert.notEqual(alarmNoHardwareCalc.status, 'acceptable', 'Gesamtbewertung darf bei Alarm ohne Auslösehardware nicht "acceptable" sein');
const triggerHardware = alarmNoHardwareCalc.installationSafetyAssessment.requirements.find(item => item.id === 'alarm.trigger-hardware');
assert.ok(triggerHardware, 'Alarmblock muss Auslösehardware-Prüfung enthalten');
assert.equal(triggerHardware.status, 'failed');
assert.equal(triggerHardware.source.sourcePart, 'EN 378-3');
assert.equal(triggerHardware.source.sourceSection, '8 und 9');
assert.deepEqual([...triggerHardware.missingInputs].sort(), ['hasDetector', 'hasGasWarningSystem']);

// Positivfall: Detektor als Auslösehardware -> konsistent, kein Konflikt
const alarmWithDetector = assessStateConsistency({ ...alarmNoHardwareState, hasDetector: 'yes' });
assert.equal(alarmWithDetector.status, 'passed');
const alarmWithGasWarning = assessStateConsistency({ ...alarmNoHardwareState, hasGasWarningSystem: 'yes' });
assert.equal(alarmWithGasWarning.status, 'passed');
// Nur unabhängige Alarmstromversorgung ohne Auslösehardware -> ebenfalls Konflikt
const powerOnly = assessStateConsistency({ ...alarmNoHardwareState, hasAlarm: 'no', hasIndependentAlarmPower: 'yes' });
assert.equal(powerOnly.status, 'failed');
assert.ok(powerOnly.requirements.some(item => item.id === 'state-consistency.alarm-without-trigger-hardware'));

// EN 378-3, 4.5 (M1): nicht abgeschlossener technischer Raum + ausgefüllte 4.5-Detailfelder -> Konflikt
const redirectConflict = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'I',
  technicalRoomSeparatedFromOccupiedSpaces: 'no',
  technicalRoomContainsCompressorOrPressureVessel: 'yes',
  technicalRoomExhaustHoodFlowRateM3s: '0.2'
});
assert.equal(redirectConflict.status, 'failed');
assert.ok(redirectConflict.requirements.some(item => item.id === 'state-consistency.technical-room-details-in-redirect'));
const redirectClean = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'I',
  technicalRoomSeparatedFromOccupiedSpaces: 'no'
});
assert.equal(redirectClean.status, 'passed', 'Umleitungsfall 4.4 ohne Detailfelder ist konsistent');
const separatedOk = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'I',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'no',
  technicalRoomComponentsHaveDetachableJoints: 'yes',
  technicalRoomExhaustHoodFlowRateM3s: '0.2'
});
assert.equal(separatedOk.status, 'passed', 'abgeschlossener Raum mit 4.5-Details ist konsistent');

// Klasse II ist auch für den Aufstellort "Technischer Raum" zulässig (EN 378-1, 5.3 c;
// EN 378-3, 4.5): z. B. Split-Anlage mit Verdichter/Außengerät im Freien und Innengerät
// in einem Raum ohne Personenaufenthalt.
const classIITechnicalRoom = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'II',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'no'
});
assert.equal(classIITechnicalRoom.status, 'passed', 'Klasse II + Technischer Raum ist konsistent');
assert.ok(!classIITechnicalRoom.requirements.some(item => item.id === 'state-consistency.class-ii-location'));
// Gegenprobe: Klasse II im Personen-Aufenthaltsbereich bleibt ein Konflikt (mit Verweis auf 4.5 / 5.3 c)
const classIIOccupied = assessStateConsistency({ ...baseState, installationLocation: 'occupied-space', installationClass: 'II' });
assert.equal(classIIOccupied.status, 'failed');
const classIIConflict = classIIOccupied.requirements.find(item => item.id === 'state-consistency.class-ii-location');
assert.ok(classIIConflict);
assert.match(classIIConflict.requirement, /5\.3 c und 5\.3 d/);
assert.match(classIIConflict.measure, /EN 378-1, 5\.3 c und 5\.3 d/);
// Maschinenraum/Außen bleiben unverändert zulässig für Klasse II
assert.equal(assessStateConsistency({ ...baseState, installationLocation: 'machinery-room', installationClass: 'II', accessArea: 'authorized-access' }).status, 'passed');
assert.equal(assessStateConsistency({ ...baseState, installationLocation: 'outdoor', installationClass: 'II' }).status, 'passed');

// EN 378-1, 5.3 c und 5.3 d: Klasse II im Personen-Aufenthaltsbereich ist zulässig, wenn alle
// Verdichter und Druckbehälter im Maschinenraum oder im Freien stehen (bestätigt über
// classIiCompressorsOutsideOrMachineryRoom).
// Fall A: Voraussetzung bestätigt ('yes') -> kein class-ii-location-Konflikt
const classIIOccupiedConfirmed = assessStateConsistency({
  ...baseState,
  installationLocation: 'occupied-space',
  installationClass: 'II',
  classIiCompressorsOutsideOrMachineryRoom: 'yes'
});
assert.equal(classIIOccupiedConfirmed.status, 'passed', 'Fall A: Klasse II + Aufenthaltsbereich mit bestätigter Voraussetzung ist konsistent');
assert.ok(!classIIOccupiedConfirmed.requirements.some(item => item.id === 'state-consistency.class-ii-location'));
const classIIOccupiedConfirmedCalc = calculate({
  ...baseState,
  installationLocation: 'occupied-space',
  installationClass: 'II',
  classIiCompressorsOutsideOrMachineryRoom: 'yes'
});
assert.ok(!classIIOccupiedConfirmedCalc.stateConsistencyAssessment.requirements.some(item => item.id === 'state-consistency.class-ii-location'), 'Fall A: kein class-ii-location im Gesamtergebnis');
assert.ok(!classIIOccupiedConfirmedCalc.requiredMeasures.some(measure => measure.includes('Klasse II')), 'Fall A: Gesamtbewertung ohne Klasse-II-Konflikt');
// Fall B: 'no' -> FAILED mit neuem Meldungstext (EN 378-1, 5.3 c und 5.3 d)
const classIIOccupiedDenied = assessStateConsistency({
  ...baseState,
  installationLocation: 'occupied-space',
  installationClass: 'II',
  classIiCompressorsOutsideOrMachineryRoom: 'no'
});
assert.equal(classIIOccupiedDenied.status, 'failed');
const denied = classIIOccupiedDenied.requirements.find(item => item.id === 'state-consistency.class-ii-location');
assert.ok(denied);
assert.match(denied.requirement, /Klasse II setzt voraus, dass sich alle Verdichter und Druckbehälter im Maschinenraum oder im Freien befinden/);
assert.match(denied.requirement, /in der Regel Klasse I/);
assert.equal(denied.source.sourcePart, 'EN 378-1');
assert.equal(denied.source.sourceSection, '5.3 c und 5.3 d');
// Fall C: keine Angabe -> NOT_ASSESSED mit missingInputs; Gesamtbewertung nicht PASSED/acceptable
const classIIOccupiedOpen = assessStateConsistency({
  ...baseState,
  installationLocation: 'occupied-space',
  installationClass: 'II',
  classIiCompressorsOutsideOrMachineryRoom: ''
});
assert.equal(classIIOccupiedOpen.status, 'not-assessed', 'Fall C: unbeantwortete Voraussetzung -> not-assessed');
const openItem = classIIOccupiedOpen.requirements.find(item => item.id === 'state-consistency.class-ii-location');
assert.ok(openItem);
assert.equal(openItem.status, 'not-assessed');
assert.deepEqual(openItem.missingInputs, ['classIiCompressorsOutsideOrMachineryRoom']);
const classIIOccupiedOpenCalc = calculate({
  ...baseState,
  installationLocation: 'occupied-space',
  installationClass: 'II',
  classIiCompressorsOutsideOrMachineryRoom: ''
});
assert.notEqual(classIIOccupiedOpenCalc.status, 'acceptable', 'Fall C: Gesamtbewertung darf nicht PASSED/acceptable lauten');
assert.notEqual(classIIOccupiedOpenCalc.stateConsistencyAssessment.status, 'passed');
// Fall D: andere Aufstellorte ohne Voraussetzung bleiben unverändert (pauschaler Konflikt)
const classIIEnclosure = assessStateConsistency({ ...baseState, installationLocation: 'ventilated-enclosure', installationClass: 'II', classIiCompressorsOutsideOrMachineryRoom: '' });
assert.equal(classIIEnclosure.status, 'failed', 'Fall D: belüftetes Gehäuse + Klasse II bleibt Konflikt');
assert.ok(classIIEnclosure.requirements.some(item => item.id === 'state-consistency.class-ii-location'));

// EN 378-1, 5.3 a: Aufstellort "belüftetes Gehäuse" erfordert Klasse IV; andere Klasse -> Konflikt
const classIvRequired = assessStateConsistency({ ...baseState, installationLocation: 'ventilated-enclosure', installationClass: 'I' });
assert.equal(classIvRequired.status, 'failed');
const ivConflict = classIvRequired.requirements.find(item => item.id === 'state-consistency.class-iv-required');
assert.ok(ivConflict, 'class-iv-required muss erscheinen');
assert.match(ivConflict.requirement, /5\.3 a/);
const classIvEnclosureOk = assessStateConsistency({ ...baseState, installationLocation: 'ventilated-enclosure', installationClass: 'IV' });
assert.equal(classIvEnclosureOk.status, 'passed', 'belüftetes Gehäuse + Klasse IV bleibt konsistent');

// EN 378-3, 4.5 (Abs. 2, M2) i. V. m. EN 378-1, 5.3 b: Ein abgeschlossener Raum ohne
// Personenaufenthalt mit Verdichter oder Druckbehälter wird wie ein Maschinenraum behandelt;
// Klasse III (vollständige Aufstellung in Maschinenraum oder im Freien) ist dann zulässig
// (analog zur Klasse-II-Korrektur, Commit 6454c3f).
const classIIITechnicalRoomM2 = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'III',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'yes'
});
assert.equal(classIIITechnicalRoomM2.status, 'passed', 'Klasse III + abgeschlossener technischer Raum mit Verdichter/Druckbehälter: konsistent (EN 378-3, 4.5; EN 378-1, 5.3 b)');
assert.ok(!classIIITechnicalRoomM2.requirements.some(item => item.id === 'state-consistency.class-iii-location'), 'kein class-iii-location-Konflikt im M2-Fall');
// technischer Raum ohne Maschinenraum-Behandlung (kein Verdichter/Druckbehälter) -> weiterhin Konflikt
const classIIITechnicalRoomNoCompressor = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'III',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'no'
});
assert.equal(classIIITechnicalRoomNoCompressor.status, 'failed', 'technischer Raum ohne Verdichter/Druckbehälter: Klasse III bleibt Konflikt');
const classIIIConflict = classIIITechnicalRoomNoCompressor.requirements.find(item => item.id === 'state-consistency.class-iii-location');
assert.ok(classIIIConflict);
assert.equal(classIIIConflict.source.sourcePart, 'EN 378-1 / EN 378-3');
assert.equal(classIIIConflict.source.sourceSection, '5.3 b / 4.5');
// Gegenprobe: Personen-Aufenthaltsbereich mit Klasse III bleibt Konflikt
const classIIIOccupied = assessStateConsistency({ ...baseState, installationLocation: 'occupied-space', installationClass: 'III' });
assert.equal(classIIIOccupied.status, 'failed');
assert.ok(classIIIOccupied.requirements.some(item => item.id === 'state-consistency.class-iii-location'), 'Gegenprobe: occupied-space + Klasse III weiterhin Konflikt');
// Maschinenraum und Außenaufstellung mit Klasse III bleiben unverändert zulässig
assert.equal(assessStateConsistency({ ...baseState, installationLocation: 'machinery-room', installationClass: 'III', accessArea: 'authorized-access' }).status, 'passed');
assert.equal(assessStateConsistency({ ...baseState, installationLocation: 'outdoor', installationClass: 'III' }).status, 'passed');
// machinery-room-access kollidiert nicht mit technical-room (greift nur beim Aufstellort Maschinenraum)
const trAccess = assessStateConsistency({
  ...baseState,
  installationLocation: 'technical-room',
  installationClass: 'III',
  accessArea: 'general-access',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'yes'
});
assert.ok(!trAccess.requirements.some(item => item.id === 'state-consistency.machinery-room-access'), 'machinery-room-access legt den technischen Raum nicht auf authorized-access fest');
assert.equal(trAccess.status, 'passed');

console.log('EN 378 state consistency tests passed.');
