import assert from 'node:assert/strict';

import { calculate, deriveAccessCategory, validateAssessmentInput, ACCESS_CATEGORY_BY_ACCESS_AREA } from '../modules/en-378-safety-check/logic.js';
import schema from '../modules/en-378-safety-check/schema.js';
import { assessChargeLimit, calculateC21Trigger } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { buildEN378SafetyCheckReportDto } from '../modules/en-378-safety-check/reportAdapter.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';

const derivedAccessState = {
  refrigerantId: 'R-513A',
  chargeKg: '24.4',
  roomVolumeM3: '6000',
  installationLocation: 'technical-room',
  installationClass: 'I',
  accessArea: 'authorized-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'no',
  technicalRoomSeparatedFromOccupiedSpaces: 'yes',
  technicalRoomContainsCompressorOrPressureVessel: 'no',
  technicalRoomComponentsHaveDetachableJoints: 'no'
};

assert.equal(deriveAccessCategory(derivedAccessState), 'c');
const validation = validateAssessmentInput(derivedAccessState);
assert.equal(validation.isValid, true);
assert.equal(validation.effectiveState.accessCategory, 'c');

const calculation = calculate(derivedAccessState);
assert.equal(calculation.effectiveState.accessCategory, 'c');
assert.equal(calculation.inputComplete, true);
assert.equal(calculation.status, 'acceptable');

const resultModel = buildEN378SafetyCheckResultModel(derivedAccessState, calculation);
assert.ok(JSON.stringify(resultModel).includes('Kategorie c – Zugang nur für befugte Personen'));

const report = buildEN378SafetyCheckReportDto({ state: derivedAccessState, calculation, generatedAt: '2026-09-01T00:00:00.000Z' });
assert.equal(report.input.accessCategory, 'c');

const incompleteComfortValidation = validateAssessmentInput({
  refrigerantId: 'R-32',
  chargeKg: '0.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical'
});
assert.equal(incompleteComfortValidation.isValid, false);
assert.ok(incompleteComfortValidation.issues.includes('floorAreaM2:required'));
assert.ok(incompleteComfortValidation.issues.includes('isFactorySealed:required'));

const wallMountedComfortValidation = validateAssessmentInput({
  refrigerantId: 'R-32',
  chargeKg: '0.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  floorAreaM2: '18',
  isFactorySealed: 'no'
});
assert.equal(wallMountedComfortValidation.isValid, false);
assert.ok(wallMountedComfortValidation.issues.includes('mountingType:required'));

const completeComfortValidation = validateAssessmentInput({
  refrigerantId: 'R-32',
  chargeKg: '0.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  floorAreaM2: '18',
  isFactorySealed: 'no',
  mountingType: 'wall'
});
assert.equal(completeComfortValidation.isValid, true);

// Aufstellort "belüftetes Gehäuse" (Klasse IV) ist auswählbar; die Zugangskategorie-Tabelle ist zentral in logic.js definiert
const locationField = schema.fields.find(field => field.key === 'installationLocation');
assert.ok(locationField.options.some(option => option.value === 'ventilated-enclosure'), 'Aufstellort belüftetes Gehäuse muss als Option existieren');
assert.deepEqual(ACCESS_CATEGORY_BY_ACCESS_AREA, { 'general-access': 'a', 'supervised-access': 'b', 'authorized-access': 'c' });

// C.2.1-Auslöseschwelle im Komfortpfad: 1,5 × m1 bei Klasse 2L (R-32: m1 = 1,228 kg, Schwelle 1,842 kg)
assert.equal(calculateC21Trigger({ flammabilityClass: '2L', lflKgM3: 0.307, chargeKg: '1' }).exceeded, false);
assert.equal(calculateC21Trigger({ flammabilityClass: '2L', lflKgM3: 0.307, chargeKg: '2.5' }).exceeded, true);
const comfortState = {
  refrigerantId: 'R-32',
  chargeKg: '1',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  floorAreaM2: '18',
  isFactorySealed: 'no',
  mountingType: 'wall'
};
const comfortBelow = assessChargeLimit(comfortState).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(comfortBelow.rule, 'c2-1-trigger-not-exceeded');
assert.equal(comfortBelow.status, 'passed');
const comfortAbove = assessChargeLimit({ ...comfortState, chargeKg: '2.5' }).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(comfortAbove.rule, 'comfort-application-c2-or-c3');
assert.equal(comfortAbove.details.exceeded, true);
assert.equal(comfortAbove.details.equationApplies, true, 'R-32: M = 52 g/mol > 42 g/mol');

// EN 378-3 Abschnitte 8 und 9: hasAlarm/hasIndependentAlarmPower sind nur schaltbar, wenn
// eine Auslösehardware (Gaswarnsystem oder Detektor) vorhanden ist; sonst deaktiviert.
const hasAlarmField = schema.fields.find(field => field.key === 'hasAlarm');
const hasAlarmPowerField = schema.fields.find(field => field.key === 'hasIndependentAlarmPower');
assert.equal(typeof hasAlarmField.disabled, 'function');
assert.equal(typeof hasAlarmPowerField.disabled, 'function');
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: 'no', hasDetector: 'no' }), true, 'ohne Auslösehardware deaktiviert');
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: 'yes', hasDetector: 'no' }), false);
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: 'no', hasDetector: 'yes' }), false);
assert.equal(hasAlarmField.disabled({ hasGasWarningSystem: '', hasDetector: '' }), true, 'unbeantwortet gilt als keine Auslösehardware');
assert.equal(hasAlarmPowerField.disabled({ hasGasWarningSystem: 'no', hasDetector: 'no' }), true);
assert.equal(hasAlarmPowerField.disabled({ hasGasWarningSystem: 'yes' }), false);
assert.equal(hasAlarmPowerField.disabled({ hasDetector: 'yes' }), false);

// EN 378-3 4.4 i. V. m. EN 378-1 Anhang C / 9.1: Der Eintrag zu Detektion/Alarmierung
// (occupied-space.sections-8-9) darf nur mit Status required erscheinen, wenn ein normativer
// Auslöser vorliegt (Konzentration über praktischem Grenzwert oder Gaswarnanlage). Ohne Auslöser
// muss er informativ (not-applicable) sein und der Wortlaut "erforderlich" darf nicht erscheinen.
const occupiedNoTrigger = {
  refrigerantId: 'R-32',
  chargeKg: '5',
  roomVolumeM3: '100',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasGasWarningSystem: 'no',
  hasDetector: 'no',
  hasAlarm: 'no',
  hasIndependentAlarmPower: 'no'
};
// R-32: 5 kg / 100 m³ = 0,05 kg/m³ < praktischer Grenzwert 0,061 kg/m³ -> kein Auslöser
const noTriggerAssessment = assessInstallationSafetyRequirements(occupiedNoTrigger, assessChargeLimit(occupiedNoTrigger));
const sections89Info = noTriggerAssessment.requirements.find(item => item.id === 'occupied-space.sections-8-9');
assert.ok(sections89Info, 'Eintrag zu Abschnitten 8/9 muss vorhanden sein');
assert.equal(sections89Info.status, 'not-applicable', 'ohne Auslöser darf der Eintrag nicht required sein');
assert.ok(!/erforderlich/i.test(`${sections89Info.title} ${sections89Info.requirement} ${sections89Info.measure}`), 'Wortlaut "erforderlich" darf ohne Auslöser nicht erscheinen');
assert.equal(sections89Info.source.sourceSection, '4.4 i. V. m. EN 378-1 Anhang C');
assert.equal(noTriggerAssessment.status, 'passed', 'gemeldeter Fall (R-32, 5 kg, 100 m³, alle Nein): PASSED ohne "erforderlich: Detektion und Alarmierung"');

// Gegenprobe: Konzentration über praktischem Grenzwert -> Auslöser -> required; die "Nein"-Angaben
// müssen im selben Lauf zu FAILED führen (nicht PASSED).
const occupiedTrigger = { ...occupiedNoTrigger, chargeKg: '8' }; // 8 kg / 100 m³ = 0,08 kg/m³ > 0,061 kg/m³
const triggerAssessment = assessInstallationSafetyRequirements(occupiedTrigger, assessChargeLimit(occupiedTrigger));
const sections89Req = triggerAssessment.requirements.find(item => item.id === 'occupied-space.sections-8-9');
assert.equal(sections89Req.status, 'required', 'mit Auslöser (Konzentration > praktischer Grenzwert) muss der Eintrag required sein');
assert.ok(triggerAssessment.requirements.some(item => item.id === 'hasDetector' && item.status === 'failed'), "'Nein' beim Detektor muss im selben Lauf FAILED ergeben");
assert.ok(triggerAssessment.requirements.some(item => item.id === 'hasAlarm' && item.status === 'failed'), "'Nein' bei der Alarmierung muss im selben Lauf FAILED ergeben");
assert.ok(triggerAssessment.requirements.some(item => item.id === 'hasIndependentAlarmPower' && item.status === 'failed'), "'Nein' bei der Alarmstromversorgung muss im selben Lauf FAILED ergeben");
assert.equal(triggerAssessment.status, 'failed', "'Nein'-Angaben bei Auslöser dürfen nicht PASSED ergeben");

// EN 378-3, 4.5: neue technical-room-Felder nur bei Aufstellort "Technischer Raum" sichtbar;
// Abzugshauben-Details nur bei abgeschlossen + kein Verdichter/Druckbehälter + lösbare Verbindungen.
const fieldByKey = key => schema.fields.find(field => field.key === key);
const trSeparated = fieldByKey('technicalRoomSeparatedFromOccupiedSpaces');
const trCompressor = fieldByKey('technicalRoomContainsCompressorOrPressureVessel');
const trDetachable = fieldByKey('technicalRoomComponentsHaveDetachableJoints');
const trFlow = fieldByKey('technicalRoomExhaustHoodFlowRateM3s');
const trAdverse = fieldByKey('technicalRoomAdverseConditions');
const trDetector = fieldByKey('technicalRoomVentilationActivatesDetector');
assert.equal(trSeparated.visibleWhen({ installationLocation: 'technical-room' }), true);
assert.equal(trSeparated.visibleWhen({ installationLocation: 'occupied-space' }), false, '4.5-Feld nur im technischen Raum sichtbar');
assert.equal(trSeparated.visibleWhen({ installationLocation: 'machinery-room' }), false);
assert.equal(trCompressor.visibleWhen({ installationLocation: 'technical-room', technicalRoomSeparatedFromOccupiedSpaces: 'yes' }), true);
assert.equal(trCompressor.visibleWhen({ installationLocation: 'technical-room', technicalRoomSeparatedFromOccupiedSpaces: 'no' }), false, 'bei Umleitung 4.4 keine 4.5-Details');
const hoodVisible = { installationLocation: 'technical-room', technicalRoomSeparatedFromOccupiedSpaces: 'yes', technicalRoomContainsCompressorOrPressureVessel: 'no', technicalRoomComponentsHaveDetachableJoints: 'yes' };
assert.equal(trFlow.visibleWhen(hoodVisible), true);
assert.equal(trAdverse.visibleWhen(hoodVisible), true);
assert.equal(trDetector.visibleWhen(hoodVisible), true);
assert.equal(trFlow.visibleWhen({ ...hoodVisible, technicalRoomComponentsHaveDetachableJoints: 'no' }), false, 'ohne lösbare Verbindungen keine Abzugshauben-Details');
assert.equal(trFlow.visibleWhen({ ...hoodVisible, technicalRoomContainsCompressorOrPressureVessel: 'yes' }), false, 'M2-Fall: keine Abzugshauben-Details');
// M2-Fall: Abschnitt-5-Felder auch im technischen Raum sichtbar (ohne Änderung der 4.3-Ketten)
const m2SchemaState = { installationLocation: 'technical-room', technicalRoomSeparatedFromOccupiedSpaces: 'yes', technicalRoomContainsCompressorOrPressureVessel: 'yes' };
assert.equal(fieldByKey('machineryRoomOccupied').visibleWhen(m2SchemaState), true, 'M2: Abschnitt-5-Felder im technischen Raum sichtbar');
assert.equal(fieldByKey('machineryRoomOccupied').visibleWhen({ installationLocation: 'machinery-room', machineryRoomRiskAnalysisResult: 'yes' }), true, '4.3 bleibt unverändert');
assert.equal(fieldByKey('machineryRoomOccupied').visibleWhen({ installationLocation: 'occupied-space' }), false, '4.4 bleibt unverändert');
assert.equal(fieldByKey('machineryRoomRiskAnalysisStatus').visibleWhen(m2SchemaState), false, 'Risikoanalyse-Gate bleibt 4.3 vorbehalten');

console.log('EN 378 contextual input tests passed.');
