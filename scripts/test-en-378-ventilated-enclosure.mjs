import assert from 'node:assert/strict';

import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { assessStateConsistency } from '../modules/en-378-safety-check/stateConsistency.js';

// EN 378-3:2020-12, Abschnitt 4.6: belüftetes Gehäuse im Personen-Aufenthaltsbereich
// (Aufstellungsort-Klasse IV nach EN 378-1, 5.3 a). Anforderungsmatrix M1 bis M7.

const baseState = {
  refrigerantId: 'R-32',
  chargeKg: '5',
  roomVolumeM3: '100',
  installationLocation: 'ventilated-enclosure',
  installationClass: 'IV',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'no',
  enclosureVolumeM3: '10',
  ventilatedEnclosureDuctPerManufacturerInstructions: 'yes',
  ventilatedEnclosureFreshAirSufficient: 'yes',
  ventilatedEnclosureDuctToOutdoor: 'yes',
  ventilatedEnclosureToxicityLocationClass: 'I'
};

const assess = state => assessInstallationSafetyRequirements(state, assessChargeLimit(state));
const findReq = (assessment, id) => assessment.requirements.find(item => item.id === id);

// --- M1 (4.6, Satz 1 i. V. m. EN 378-2, 6.2.15): Lüftungskanal nach Herstellerfestlegungen ---
const m1yes = findReq(assess(baseState), 'ventilated-enclosure.duct-per-manufacturer');
assert.equal(m1yes.status, 'passed');
assert.equal(m1yes.source.sourceSection, '4.6 i. V. m. EN 378-2, 6.2.15');
const m1no = findReq(assess({ ...baseState, ventilatedEnclosureDuctPerManufacturerInstructions: 'no' }), 'ventilated-enclosure.duct-per-manufacturer');
assert.equal(m1no.status, 'failed');
const m1open = findReq(assess({ ...baseState, ventilatedEnclosureDuctPerManufacturerInstructions: '' }), 'ventilated-enclosure.duct-per-manufacturer');
assert.equal(m1open.status, 'not-assessed');
assert.deepEqual(m1open.missingInputs, ['ventilatedEnclosureDuctPerManufacturerInstructions']);
console.log('✓ Test: M1 Lüftungskanal nach Herstellerangaben - Ja PASSED / Nein FAILED / offen NOT_ASSESSED');

// --- M2 (4.6, Satz 2): V_Raum >= 10 x V_Gehäuse, exakte Grenze 10-fach ist PASSED ---
const m2boundary = findReq(assess(baseState), 'ventilated-enclosure.room-volume-ratio'); // 100 >= 10*10
assert.equal(m2boundary.status, 'passed', 'M2: exakt das 10-Fache (100 = 10 x 10) ist PASSED');
assert.equal(m2boundary.details.factor, 10);
assert.equal(m2boundary.details.requiredRoomVolumeM3, 100);
const m2fail = findReq(assess({ ...baseState, roomVolumeM3: '99.9' }), 'ventilated-enclosure.room-volume-ratio');
assert.equal(m2fail.status, 'failed', 'M2: 99,9 m³ < 10 x 10 m³ ist FAILED');
const m2open = findReq(assess({ ...baseState, enclosureVolumeM3: '' }), 'ventilated-enclosure.room-volume-ratio');
assert.equal(m2open.status, 'not-assessed');
assert.ok(m2open.missingInputs.includes('enclosureVolumeM3'));
console.log('✓ Test: M2 Volumenverhältnis - 10-fache Grenze PASSED, darunter FAILED, fehlt NOT_ASSESSED');

// --- M3/M4 (4.6, Satz 2/3): Frischluftversorgung und Belüftung ins Freie ---
for (const [id, field] of [['ventilated-enclosure.fresh-air-sufficient', 'ventilatedEnclosureFreshAirSufficient'], ['ventilated-enclosure.duct-to-outdoor', 'ventilatedEnclosureDuctToOutdoor']]) {
  assert.equal(findReq(assess(baseState), id).status, 'passed');
  assert.equal(findReq(assess({ ...baseState, [field]: 'no' }), id).status, 'failed');
  const open = findReq(assess({ ...baseState, [field]: '' }), id);
  assert.equal(open.status, 'not-assessed');
  assert.deepEqual(open.missingInputs, [field]);
  assert.equal(open.source.sourceSection, '4.6');
}
console.log('✓ Test: M3 Frischluft / M4 Belüftung ins Freie - Ja PASSED / Nein FAILED / offen NOT_ASSESSED');

// --- EN-378-2-Hinweis: Gehäuseeigenschaften werden nicht von der App geprüft ---
const hint = findReq(assess(baseState), 'ventilated-enclosure.en378-2-hint');
assert.ok(hint, 'EN-378-2-Hinweis muss erscheinen');
assert.equal(hint.status, 'not-applicable');
assert.equal(hint.source.sourcePart, 'EN 378-2');
assert.equal(hint.source.sourceSection, '6.2.15');
console.log('✓ Test: Hinweis auf EN 378-2, 6.2.15 (Herstellerangaben) im Ergebnis');

// --- M5 (EN 378-1, 5.3 a): Klasse IV erforderlich für belüftetes Gehäuse ---
assert.equal(assessStateConsistency(baseState).status, 'passed', 'M5: ventilated-enclosure + Klasse IV ist konsistent');
const m5conflict = assessStateConsistency({ ...baseState, installationClass: 'II' });
assert.equal(m5conflict.status, 'failed');
assert.ok(m5conflict.requirements.some(item => item.id === 'state-consistency.class-iv-required'));
assert.match(m5conflict.requirements.find(item => item.id === 'state-consistency.class-iv-required').requirement, /5\.3 a/);
// occupied-space + Klasse IV bleibt zulässig (unverändert)
assert.equal(assessStateConsistency({ ...baseState, installationLocation: 'occupied-space' }).status, 'passed');
console.log('✓ Test: M5 Klasse-IV-Konsistenz - andere Klasse im belüfteten Gehäuse ist Konflikt (5.3 a)');

// --- M6 (EN 378-1, Tabelle C.2, Spalte IV): m3 = 130 m³ x LFL; 2L: m3 x 1,5; Klassen 2/3: m3 ---
// R-32 (A2L, LFL 0,307): m3 = 39,91 kg; Deckel 2L = 59,865 kg
const flamR32 = assessChargeLimit(baseState).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(flamR32.rule, 'limit-m3-times-1.5');
assert.ok(Math.abs(flamR32.maximumChargeKg - 59.865) < 1e-9, `m3 x 1,5 = 59,865 kg (ist ${flamR32.maximumChargeKg})`);
assert.ok(Math.abs(flamR32.details.m3Kg - 39.91) < 1e-9, `m3 = 130 x 0,307 = 39,91 kg (ist ${flamR32.details.m3Kg})`);
assert.equal(flamR32.details.multiplier, 1.5);
const flamAtBoundary = assessChargeLimit({ ...baseState, chargeKg: '59.865' }).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(flamAtBoundary.status, 'passed', 'M6: Füllmenge = m3 x 1,5 ist noch PASSED (Überschreitung erst ab >)');
const flamAbove = assessChargeLimit({ ...baseState, chargeKg: '60' }).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(flamAbove.status, 'failed', 'M6: Füllmenge > m3 x 1,5 ist FAILED');
// R-290 (A3, LFL 0,038): m3 = 4,94 kg; Deckel Klasse 3 = m3
const flamR290 = assessChargeLimit({ ...baseState, refrigerantId: 'R-290', chargeKg: '4' }).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(flamR290.rule, 'limit-m3-times-1');
assert.ok(Math.abs(flamR290.maximumChargeKg - 4.94) < 1e-9, `m3 = 130 x 0,038 = 4,94 kg (ist ${flamR290.maximumChargeKg})`);
const flamR290Above = assessChargeLimit({ ...baseState, refrigerantId: 'R-290', chargeKg: '5' }).checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(flamR290Above.status, 'failed', 'M6: Klasse 3 über m3 ist FAILED');
console.log('✓ Test: M6 Füllmengendeckel Spalte IV - 2L: m3 x 1,5 = 59,865 kg (R-32); Klasse 3: m3 = 4,94 kg (R-290)');

// --- M7 (EN 378-1, Tabelle C.1, Spalte IV): toxizitätsbezogene Prüfung über planerische Ortszuordnung ---
const toxOpen = assessChargeLimit({ ...baseState, ventilatedEnclosureToxicityLocationClass: '' }).checks.find(check => check.id === 'charge-limit.toxicity');
assert.equal(toxOpen.status, 'not-assessed', 'M7: ohne Zuordnung des Gehäuseorts NOT_ASSESSED');
assert.deepEqual(toxOpen.missingInputs, ['ventilatedEnclosureToxicityLocationClass']);
// mit Zuordnung Klasse I (R-32, Toxizitätsklasse A, Kategorie a): bestehende C.1-Logik -
// Konzentrationsgrenze = max(praktischer Grenzwert, ATEL/ODL) = 0,30 kg/m³ x 100 m³ = 30 kg
const toxI = assessChargeLimit(baseState).checks.find(check => check.id === 'charge-limit.toxicity');
assert.equal(toxI.status, 'passed');
assert.equal(toxI.maximumChargeKg, 30);
assert.equal(toxI.rule, 'toxicity-limit-times-room-volume-or-c3');
const toxAbove = assessChargeLimit({ ...baseState, chargeKg: '31' }).checks.find(check => check.id === 'charge-limit.toxicity');
assert.equal(toxAbove.status, 'failed', 'M7: 31 kg > 30 kg (Klasse I, Kategorie a) ist FAILED');
console.log('✓ Test: M7 toxizitätsbezogene Füllmenge - ohne Zuordnung NOT_ASSESSED, mit Klasse I: 0,30 kg/m³ x 100 m³ = 30 kg');

// --- Gesamtbewertung: vollständig beantworteter, normkonformer Fall ---
const fullCalc = calculate(baseState);
assert.equal(fullCalc.stateConsistencyAssessment.status, 'passed');
assert.equal(fullCalc.chargeLimitAssessment.status, 'passed');
assert.equal(fullCalc.installationSafetyAssessment.status, 'passed');
assert.equal(fullCalc.status, 'acceptable');
console.log('✓ Test: vollständig beantwortetes belüftetes Gehäuse -> Gesamtbewertung acceptable');

console.log('EN 378 ventilated enclosure (EN 378-3, 4.6) tests passed.');
