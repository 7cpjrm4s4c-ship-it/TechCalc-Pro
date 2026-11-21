import assert from 'node:assert/strict';

import { calculate } from '../modules/en-378-safety-check/logic.js';

// Statusvertrag für den EN-378-Gesamtbefund (deriveStatus in logic.js):
// - 'acceptable' ("Anforderungen nach aktuellem Prüfstand erfüllt"), sobald alle
//   wählbaren Bestätigungsfelder beantwortet sind und keine Prüfung failed/not-assessed ist.
// - Pflichtpunkte mit Status 'required' verschlechtern den Gesamtbefund NICHT; sie
//   erscheinen nur im Planer-Leitfaden (actionCount > 0 bei openPointCount === 0).
// - 'ready-for-assessment' nur bei offenen Prüfpunkten (not-assessed).
// - 'measures-required' nur bei nicht erfüllten Prüfungen (failed).

// Dokumentierter Eingabesatz (Anwendertest 18./19.11.2026): R-32, 5 kg, 79 m³,
// Maschinenraum, Klasse III, Risikoanalyse vorhanden/erforderlich, alle Ja-Eingaben.
const documentedInputSet = {
  refrigerantId: 'HFKW-32',
  chargeKg: '5',
  roomVolumeM3: '79',
  installationLocation: 'machinery-room',
  installationClass: 'III',
  accessArea: 'authorized-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomOccupied: 'yes',
  machineryRoomRequiredAirChangeAchievable: 'yes',
  machineryRoomLargestSystemChargeKg: '5',
  hasEmergencyVentilation: 'yes',
  hasEmergencyVentilationControlOutside: 'yes',
  hasEmergencyVentilationControlInside: 'yes',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  hasExplosionProtectedElectricalEquipment: 'yes',
  hasSafetyShutoffValves: 'yes',
  hasVentilationOpenings: 'yes',
  machineryRoomEmergencyFanSuitable: 'yes'
};

// a) Vollständiger dokumentierter Eingabesatz: acceptable trotz vorhandener required-Punkte.
const acceptable = calculate(documentedInputSet);
assert.equal(acceptable.status, 'acceptable', 'a) Gesamtbefund muss acceptable sein');
assert.equal(acceptable.plannerGuidance.statusLabel, 'Anforderungen nach aktuellem Prüfstand erfüllt');
assert.equal(acceptable.plannerGuidance.openPointCount, 0, 'a) keine offenen Punkte');
assert.ok(acceptable.plannerGuidance.actionCount > 0, 'a) required-Pflichtpunkte sind vorhanden');
assert.ok(
  acceptable.installationSafetyAssessment.requirements.some(item => item.status === 'required'),
  'a) required-Elemente existieren im Bewertungsmodell'
);
console.log('✓ a) vollständiger Eingabesatz -> acceptable (actionCount=' + acceptable.plannerGuidance.actionCount + ', openPointCount=0)');

// b) Genau ein Komponentfeld leer: ein offener Punkt, ready-for-assessment.
const oneOpen = calculate({ ...documentedInputSet, hasIndependentAlarmPower: '' });
assert.equal(oneOpen.status, 'ready-for-assessment', 'b) ein leeres Komponentfeld -> ready-for-assessment');
assert.equal(oneOpen.plannerGuidance.openPointCount, 1, 'b) genau ein offener Punkt');
assert.equal(oneOpen.installationSafetyAssessment.status, 'not-assessed');
console.log('✓ b) ein leeres Komponentfeld -> ready-for-assessment (openPointCount=1)');

// c) Füllmengenbewertung verletzt: measures-required.
// Klasse III (Maschinenraum) ist nach EN 378-1 Tabelle C.1/C.2 von der Füllmengenbegrenzung
// ausgenommen (noLimit), daher wird für den Verletzungsfall Klasse I mit deutlich erhöhter
// Füllmenge verwendet; alle übrigen Angaben bleiben identisch.
const violatingCharge = calculate({ ...documentedInputSet, installationClass: 'I', chargeKg: '50' });
assert.equal(violatingCharge.status, 'measures-required', 'c) verletzte Füllmengenbewertung -> measures-required');
assert.equal(violatingCharge.chargeLimitAssessment.status, 'failed');
assert.ok(
  violatingCharge.chargeLimitAssessment.checks.some(check => check.status === 'failed'),
  'c) mindestens ein Füllmengen-Check ist failed'
);
console.log('✓ c) Füllmengenverletzung -> measures-required (chargeLimitAssessment=failed)');

// d) Keine Anzahl von required-Elementen allein darf den Status verschlechtern:
// alle Komponentfelder beantwortet, alle Checks passed, aber required-Punkte vorhanden.
const requiredOnly = calculate(documentedInputSet);
const requiredCount = requiredOnly.installationSafetyAssessment.requirements
  .filter(item => item.status === 'required').length;
assert.ok(requiredCount > 0, 'd) Fallsimulation: required-Elemente vorhanden');
assert.equal(requiredOnly.chargeLimitAssessment.status, 'passed', 'd) alle Füllmengen-Checks passed');
assert.ok(
  requiredOnly.chargeLimitAssessment.checks.every(check => check.status === 'passed'),
  'd) alle checks passed'
);
assert.equal(requiredOnly.status, 'acceptable', 'd) required allein darf nicht zu einem anderen Status führen');
assert.equal(requiredOnly.plannerGuidance.failedCount, 0);
assert.equal(requiredOnly.plannerGuidance.openPointCount, 0);
console.log('✓ d) ' + requiredCount + ' required-Elemente allein -> weiterhin acceptable');

console.log('EN 378 overall status contract tests passed.');
