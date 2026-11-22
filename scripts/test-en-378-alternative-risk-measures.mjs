import assert from 'node:assert/strict';

import {
  assessAlternativeRiskMeasures,
  calculateDilutionOpeningArea,
  calculateSimplifiedMechanicalVentilationFlow
} from '../modules/en-378-safety-check/alternativeRiskMeasures.js';
import { assessChargeLimit, assessC3Applicability } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';
import schema from '../modules/en-378-safety-check/schema.js';
import { renderSchemaForm } from '../core/ui/schemaRenderer.js';

const baseState = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'yes',
  hasGasWarningSystem: 'yes',
  hasMachineryRoom: 'no',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  hasMechanicalVentilation: 'yes',
  hasVentilationOpenings: 'no',
  hasSafetyShutoffValves: 'no'
};

assert.equal(calculateDilutionOpeningArea({ chargeKg: 8, roomVolumeM3: 80, qlmvKgM3: 0.063 }), 0.00508);
assert.equal(calculateSimplifiedMechanicalVentilationFlow({ rclKgM3: 0.061 }), 163.9);

const rawChargeLimit = assessChargeLimit(baseState);
const alternativeAssessment = assessAlternativeRiskMeasures(baseState, rawChargeLimit);
assert.equal(alternativeAssessment.requiredMeasureCount, 1);
assert.equal(alternativeAssessment.selectedMeasureCount, 2);
assert.equal(alternativeAssessment.status, 'passed');
assert.ok(alternativeAssessment.requirements.some(item => item.title === 'Mechanische Lüftung als alternative Vorkehrung'));

const calculation = calculate(baseState);
assert.equal(calculation.alternativeRiskMeasuresAssessment.status, 'passed');
assert.equal(calculation.chargeLimitAssessment.status, 'passed');
assert.equal(calculation.status, 'acceptable');
assert.ok(calculation.plannerGuidance.confirmedItems.some(item => item.title.includes('alternative')));

const resultModel = buildEN378SafetyCheckResultModel(baseState, calculation);
const c3ResultGroup = resultModel.groups.find(group => group.title === 'Alternative Vorkehrungen nach EN 378-1 C.3');
assert.ok(c3ResultGroup);
assert.ok(c3ResultGroup.rows.some(row => row.label === 'Erforderliche Mindestanzahl' && row.value === '1'));
assert.ok(c3ResultGroup.rows.some(row => row.label === 'Vereinfachter mechanischer Luftstrom' && row.value === '163,9'));
assert.equal(JSON.stringify(c3ResultGroup).includes('hasMechanicalVentilation'), false);

const deepestUndergroundState = {
  ...baseState,
  locationLevel: 'deepest-underground',
  hasMechanicalVentilation: 'yes',
  hasVentilationOpenings: 'no',
  hasSafetyShutoffValves: 'no',
  hasAlarm: 'no'
};
const deepestCalculation = calculate(deepestUndergroundState);
assert.equal(deepestCalculation.alternativeRiskMeasuresAssessment.requiredMeasureCount, 2);
assert.equal(deepestCalculation.alternativeRiskMeasuresAssessment.status, 'failed');
assert.equal(deepestCalculation.status, 'measures-required');
assert.ok(deepestCalculation.requiredMeasures.some(measure => measure.includes('weitere alternative Vorkehrung')));

const deepestResolved = calculate({
  ...deepestUndergroundState,
  hasVentilationOpenings: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes'
});
assert.equal(deepestResolved.alternativeRiskMeasuresAssessment.requiredMeasureCount, 2);
assert.equal(deepestResolved.alternativeRiskMeasuresAssessment.status, 'passed');
assert.equal(deepestResolved.chargeLimitAssessment.status, 'passed');

// C.3.1-Vorprüfungen als eigene Punkte mit Quellenangabe EN 378-1 C.3.1 (nicht stillschweigend)
const c31Requirements = calculation.installationSafetyAssessment.requirements.filter(item => item.id.startsWith('alternative-precautions.c3-1'));
assert.ok(c31Requirements.length >= 7, 'C.3.1-Vorprüfungen müssen als eigene Punkte ausgewiesen sein');
assert.ok(c31Requirements.every(item => item.source?.sourcePart === 'EN 378-1' && item.source?.sourceSection === 'C.3.1'));
const c31Class = c31Requirements.find(item => item.id === 'alternative-precautions.c3-1-refrigerant-class');
assert.equal(c31Class.status, 'passed', 'R-32 ist A2L -> C.3.1-Kältemittelbedingung erfüllt');
const c31Cap = c31Requirements.find(item => item.id === 'alternative-precautions.c3-1-charge-cap');
assert.equal(c31Cap.status, 'passed', '8 kg ≤ 1,5 × m3 (A2L)');
assert.equal(c31Cap.details.maximumChargeKg, 59.86, '1,5 × m3 = 1,5 × 130 × 0,307 = 59,865 kg (gerundet 59,86)');
const c31Location = c31Requirements.find(item => item.id === 'alternative-precautions.c3-1-installation-class');
assert.equal(c31Location.status, 'passed', 'Klasse I im Personen-Aufenthaltsbereich ist für C.3 zulässig');
for (const field of ['c3FactoryBuiltConnections', 'c3NoValvesOrConsumerConnections', 'c3PipingProtected', 'c3DoorsNotTightClosing']) {
  const item = c31Requirements.find(entry => entry.missingInputs.includes(field));
  assert.ok(item, `C.3.1-Feld ${field} muss als eigener Punkt mit missingInputs ausgewiesen sein`);
  assert.equal(item.status, 'required');
}
// EN 378-1, C.3.1 i. V. m. EN 378-3, 6.1: R-290 (A3) -> C.3 normativ nicht vorgesehen. Die
// gespeicherte Auswahl "Ja" wird ignoriert: keine C.3.1-FAILED-Prüfpunkte mehr, sondern C.3
// als nicht anwendbar ausgewiesen; die C.1/C.2-Bewertung bleibt maßgeblich.
const c31Violation = calculate({ ...baseState, refrigerantId: 'R-290' });
const c31Failed = c31Violation.installationSafetyAssessment.requirements.find(item => item.id === 'alternative-precautions.c3-1-refrigerant-class');
assert.equal(c31Failed, undefined, 'R-290 (A3): keine C.3.1-Vorprüfungen, da C.3 nicht anwendbar (EN 378-1, C.3.1; EN 378-3, 6.1)');
const c3NotApplicable = c31Violation.chargeLimitAssessment.checks.find(check => check.id === 'charge-limit.alternative-risk-management');
assert.ok(c3NotApplicable, 'C.3-Check muss als nicht anwendbar ausgewiesen sein');
assert.equal(c3NotApplicable.status, 'not-applicable', 'R-290 mit gespeichertem "Ja": C.3-Check not-applicable');
assert.equal(c3NotApplicable.source.sourcePart, 'EN 378-1 / EN 378-3');
assert.equal(c3NotApplicable.source.sourceSection, 'C.3.1 / 6.1');
assert.ok(c3NotApplicable.reason.includes('A3'), 'Begründung nennt die Sicherheitsklasse A3 als Ursache');
assert.equal(c31Violation.alternativeRiskMeasuresAssessment.status, 'not-applicable', 'keine C.3-Bewertung/Maßnahmen mehr gefordert');
assert.ok(!c31Violation.requiredMeasures.some(measure => measure.includes('alternative Vorkehrungen nach')), 'C.1/C.2-Bewertung bleibt maßgeblich, keine C.3-Maßnahme in den erforderlichen Maßnahmen');
assert.equal(c31Violation.chargeLimitAssessment.status, 'failed', 'C.2-Bewertung (R-290, 8 kg / 80 m³) bleibt maßgeblich und schlägt fehl');
assert.ok(Math.abs(c31Violation.chargeLimitAssessment.maximumAllowedChargeKg - 0.608) < 1e-9, 'Grenze aus C.2 (0,2 × LFL × V = 0,608 kg), nicht aus C.3');

// EN 378-3 Abschnitte 8 und 9: Maßnahme "Alarmierung" nur PASSED, wenn Auslösehardware
// (Gaswarnsystem oder Detektor) UND unabhängige Stromversorgung vorhanden sind.
const alarmPassed = alternativeAssessment.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.ok(alarmPassed, 'Alarmierungs-Maßnahme muss bewertet werden');
assert.equal(alarmPassed.status, 'passed', 'Gaswarnsystem + Detektor + unabhängige Stromversorgung -> PASSED');
assert.deepEqual(alarmPassed.missingInputs, []);

const alarmNoTriggerState = { ...baseState, hasGasWarningSystem: 'no', hasDetector: 'no', hasAlarm: 'yes', hasIndependentAlarmPower: 'yes' };
const alarmNoTrigger = assessAlternativeRiskMeasures(alarmNoTriggerState, assessChargeLimit(alarmNoTriggerState));
const alarmFailed = alarmNoTrigger.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.ok(alarmFailed);
assert.equal(alarmFailed.status, 'failed', 'Alarm ohne Gaswarnanlage und ohne Detektor darf nicht PASSED sein');
assert.deepEqual([...alarmFailed.missingInputs].sort(), ['hasDetector', 'hasGasWarningSystem']);

const alarmNoTriggerNoPowerState = { ...alarmNoTriggerState, hasIndependentAlarmPower: 'no' };
const alarmNoTriggerNoPower = assessAlternativeRiskMeasures(alarmNoTriggerNoPowerState, assessChargeLimit(alarmNoTriggerNoPowerState));
const alarmFailed2 = alarmNoTriggerNoPower.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.equal(alarmFailed2.status, 'failed');
assert.deepEqual([...alarmFailed2.missingInputs].sort(), ['hasDetector', 'hasGasWarningSystem', 'hasIndependentAlarmPower']);

const alarmDetectorOnlyState = { ...baseState, hasGasWarningSystem: 'no', hasDetector: 'yes', hasAlarm: 'yes', hasIndependentAlarmPower: 'yes' };
const alarmDetectorOnly = assessAlternativeRiskMeasures(alarmDetectorOnlyState, assessChargeLimit(alarmDetectorOnlyState));
const alarmPassed2 = alarmDetectorOnly.requirements.find(item => item.id === 'alternative-precautions.alarm');
assert.equal(alarmPassed2.status, 'passed', 'Detektor allein genügt als Auslösehardware');
assert.deepEqual(alarmPassed2.missingInputs, []);

// --- C.3-Freigabe normativ gebunden (EN 378-1, C.3.1; EN 378-3, 6.1) ---
// Eine Quelle der Wahrheit: assessC3Applicability speist Schema und C.3.1-Vorprüfungen.
const c3Field = schema.fields.find(field => field.key === 'usesAlternativeRiskManagement');
const c3Info = schema.fields.find(field => field.key === 'alternativeRiskManagementInfo');
assert.equal(typeof c3Field.visibleWhen, 'function', 'Feld hat Sichtbarkeitsbedingung');
assert.equal(typeof c3Field.disabled, 'function', 'Feld hat Freigabebedingung (disabled)');
// Sichtbar nur an Personen-Aufenthaltsbereichen (C.3 richtet sich an diese, EN 378-3, 6.1)
for (const location of ['machinery-room', 'outdoor', 'technical-room']) {
  assert.equal(c3Field.visibleWhen({ installationLocation: location, refrigerantId: 'R-32', chargeKg: '8' }), false, `${location}: Feld unsichtbar (Gegenprobe)`);
}
assert.equal(c3Field.visibleWhen({ installationLocation: 'occupied-space', refrigerantId: 'R-32', chargeKg: '8' }), true, 'occupied-space: sichtbar');
assert.equal(c3Field.visibleWhen({ installationLocation: 'ventilated-enclosure', refrigerantId: 'R-32', chargeKg: '8' }), true, 'ventilated-enclosure: sichtbar');
// Deaktiviert, wenn C.3.1 nicht erfuellt: A3-Kältemittel, A1 über 150 kg, A2L über 1,5 × m3
assert.equal(c3Field.disabled({ installationLocation: 'occupied-space', refrigerantId: 'R-290', chargeKg: '5' }), true, 'R-290 (A3): deaktiviert');
assert.equal(c3Field.disabled({ installationLocation: 'occupied-space', refrigerantId: 'R-134a', chargeKg: '200' }), true, 'A1 über 150 kg: deaktiviert');
assert.equal(c3Field.disabled({ installationLocation: 'occupied-space', refrigerantId: 'R-32', chargeKg: '60' }), true, 'A2L über 1,5 × m3 = 59,865 kg: deaktiviert');
assert.equal(c3Field.disabled({ installationLocation: 'occupied-space', refrigerantId: 'R-32', chargeKg: '8' }), false, 'A2L innerhalb der Grenzen: aktiv');
assert.equal(c3Field.disabled({ installationLocation: 'occupied-space', refrigerantId: 'R-134a', chargeKg: '100' }), false, 'A1 bis 150 kg: aktiv');
// Hinweis nennt die Ursache (deaktiviert) bzw. die C.3.1-Bedingung (aktiv); die unzutreffende
// Wendung "Grenzwertüberschreitung erfordert C.3" ist entfernt.
const disabledInfo = c3Info.text({ installationLocation: 'occupied-space', refrigerantId: 'R-290', chargeKg: '5' });
assert.ok(disabledInfo.includes('C.3.1') && disabledInfo.includes('nicht vorgesehen'), 'deaktivierter Hinweis nennt die Ursache (EN 378-1, C.3.1)');
const enabledInfo = c3Info.text({ installationLocation: 'occupied-space', refrigerantId: 'R-32', chargeKg: '8' });
assert.ok(!enabledInfo.includes('Grenzwertüberschreitung'), 'Wendung "...oder eine Grenzwertüberschreitung dies erfordert" entfernt (begründet C.3 allein nicht)');
assert.ok(enabledInfo.includes('C.3.1'), 'aktivierter Hinweis nennt EN 378-1, C.3.1');
// Render: deaktiviertes select + ursächlicher Hinweis im Markup; Gegenprobe andere Aufstellorte
const renderedDisabled = renderSchemaForm(schema, { ...baseState, refrigerantId: 'R-290' }, { result: {} });
assert.ok(/<select id="usesAlternativeRiskManagement"[^>]*disabled/.test(renderedDisabled), 'R-290: select ist deaktiviert gerendert');
assert.ok(renderedDisabled.includes('data-schema-notice="alternativeRiskManagementInfo"'), 'Hinweis wird angezeigt');
assert.ok(renderedDisabled.includes('normativ nicht vorgesehen'), 'Hinweis nennt die Ursache im Markup');
const renderedMachinery = renderSchemaForm(schema, { ...baseState, installationLocation: 'machinery-room', machineryRoomRiskAnalysisStatus: 'present', machineryRoomRiskAnalysisResult: 'yes' }, { result: {} });
assert.ok(!renderedMachinery.includes('data-schema-field="usesAlternativeRiskManagement"'), 'Maschinenraum: Feld wird nicht gerendert');
// Bewertung ignoriert gespeicherte Auswahl bei deaktiviertem Feld (A2L über Deckel bzw. A1 über 150 kg)
const overCapA2L = calculate({ ...baseState, chargeKg: '60' }); // R-32: 60 > 1,5 × m3 = 59,865
const overCapC3 = overCapA2L.chargeLimitAssessment.checks.find(check => check.id === 'charge-limit.alternative-risk-management');
assert.equal(overCapC3.status, 'not-applicable', 'A2L über 1,5 × m3 mit gespeichertem "Ja": C.3 nicht anwendbar');
assert.ok(overCapC3.reason.includes('59.86'), 'Begründung nennt die C.3.1-Obergrenze 59,86 kg');
assert.equal(overCapA2L.alternativeRiskMeasuresAssessment.status, 'not-applicable');
const overCapA1 = calculate({ ...baseState, refrigerantId: 'R-134a', chargeKg: '200' });
const overCapA1C3 = overCapA1.chargeLimitAssessment.checks.find(check => check.id === 'charge-limit.alternative-risk-management');
assert.equal(overCapA1C3.status, 'not-applicable', 'A1 über 150 kg mit gespeichertem "Ja": C.3 nicht anwendbar');
assert.ok(overCapA1C3.reason.includes('150'), 'Begründung nennt die C.3.1-Obergrenze 150 kg');
// Gemeinsame Funktion: assessC3Applicability liefert die Werte für Schema und Vorprüfungen
assert.equal(assessC3Applicability({ installationLocation: 'occupied-space', refrigerantId: 'R-290', chargeKg: '5' }).usable, false);
assert.equal(assessC3Applicability({ installationLocation: 'machinery-room', refrigerantId: 'R-32', chargeKg: '8' }).usable, false, 'C.3 am Maschinenraum-Ort nicht anwendbar');
assert.equal(assessC3Applicability({ installationLocation: 'occupied-space', refrigerantId: 'R-32', chargeKg: '8' }).usable, true);
console.log('✓ Test: C.3-Feld normativ gebunden (EN 378-1, C.3.1; EN 378-3, 6.1) - Sichtbarkeit, Deaktivierung, Hinweis, ignorierte gespeicherte Auswahl');

console.log('EN 378 alternative risk measure tests passed.');
