import assert from 'node:assert/strict';
import fs from 'node:fs';

import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { assessStateConsistency } from '../modules/en-378-safety-check/stateConsistency.js';
import schema from '../modules/en-378-safety-check/schema.js';
import { initialState } from '../modules/en-378-safety-check/state.js';
import { buildEN378SafetyCheckResultModel } from '../modules/en-378-safety-check/results.js';
import { renderSchemaForm } from '../core/ui/schemaRenderer.js';

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

// --- Gemeldeter Fall (UI-Reproduktion): HFKW-32, belüftetes Gehäuse, Klasse IV, 85 m³ ---
// Render-Test: alle sechs Felder der Gruppe "Belüftetes Gehäuse (EN 378-3, 4.6)" müssen im
// Formular-Markup erscheinen, inkl. select für ventilatedEnclosureToxicityLocationClass.
const reportedState = {
  ...initialState,
  refrigerantId: 'HFKW-32',
  chargeKg: '5',
  roomVolumeM3: '85',
  installationLocation: 'ventilated-enclosure',
  installationClass: 'IV',
  accessArea: 'authorized-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical'
};
const renderedHtml = renderSchemaForm(schema, reportedState, { result: {} });
assert.ok(renderedHtml.includes('Belüftetes Gehäuse (EN 378-3, 4.6)'), 'Gruppenkarte muss rendern');
for (const key of ['enclosureVolumeM3', 'ventilatedEnclosureDuctPerManufacturerInstructions', 'ventilatedEnclosureFreshAirSufficient', 'ventilatedEnclosureDuctToOutdoor', 'ventilatedEnclosureToxicityClassInfo', 'ventilatedEnclosureToxicityLocationClass']) {
  assert.ok(renderedHtml.includes(`data-schema-field="${key}"`) || renderedHtml.includes(`data-schema-notice="${key}"`), `Feld ${key} muss im Markup erscheinen`);
}
assert.ok(renderedHtml.includes('data-schema-field="ventilatedEnclosureToxicityLocationClass"'), 'select für Ort des Gehäuses muss gerendert sein');
// Sichtbarkeits-Fallback: auch ohne Toxizitätsdaten bei Klasse IV sichtbar (nie unerreichbar)
const toxicityField = schema.fields.find(field => field.key === 'ventilatedEnclosureToxicityLocationClass');
assert.equal(toxicityField.visibleWhen({ ...reportedState, refrigerantId: '' }), true, 'Fallback: Klasse IV im belüfteten Gehäuse -> Feld sichtbar auch ohne Kältemitteldaten');
// Gegenprobe: andere Aufstellorte rendern die Gruppe nicht
for (const location of ['occupied-space', 'technical-room', 'machinery-room', 'outdoor']) {
  const otherHtml = renderSchemaForm(schema, { ...reportedState, installationLocation: location }, { result: {} });
  assert.ok(!otherHtml.includes('data-schema-field="ventilatedEnclosureToxicityLocationClass"'), `Gegenprobe ${location}: Feld darf nicht erscheinen`);
}
// Service Worker: Modul-Code ist version-kritisch (netzwerk-first), damit die App den PR-Stand ausliefert
const serviceWorkerSource = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
assert.ok(/requestUrl\.pathname\.includes\('\/modules\/'\)/.test(serviceWorkerSource), 'service-worker.js: /modules/ muss version-kritisch (netzwerk-first) sein');
console.log('✓ Test: Render-Test gemeldeter Fall (alle 6 Felder inkl. select), Gegenprobe andere Aufstellorte, SW network-first für /modules/');

// --- Guidance-Test: offener Punkt nennt das fehlende Feld namentlich ---
const openCalc = calculate(reportedState);
const toxOpenCheck = openCalc.chargeLimitAssessment.checks.find(check => check.id === 'charge-limit.toxicity');
assert.equal(toxOpenCheck.status, 'not-assessed');
assert.deepEqual(toxOpenCheck.missingInputs, ['ventilatedEnclosureToxicityLocationClass']);
const FIELD_LABEL = 'Ort des belüfteten Gehäuses (Aufstellungsort I/II/III für Tabelle C.1, Spalte IV)';
assert.ok(openCalc.plannerGuidance.missingInputs.includes(FIELD_LABEL), 'plannerGuidance.missingInputs muss das Feld namentlich (deutsch) nennen');
const openItem = openCalc.plannerGuidance.groups.flatMap(group => group.items).find(item => item.id === 'charge-limit.toxicity');
assert.ok(openItem.measure.includes(FIELD_LABEL), 'Maßnahme des offenen Punkts muss das fehlende Feld namentlich nennen');
const openResultModel = buildEN378SafetyCheckResultModel(reportedState, openCalc);
const openSerialized = JSON.stringify(openResultModel);
assert.ok(openSerialized.includes(`Fehlend: ${FIELD_LABEL}`), 'Ergebnisanzeige (Offen-Gruppe) muss "Fehlend: <Feldlabel>" ausgeben');
console.log('✓ Test: offener Punkt "toxizitätsbezogene Füllmenge" nennt "Ort des belüfteten Gehäuses (I/II/III)" als fehlende Angabe');

// --- End-to-End-Konsistenz: Feld mit "III" beantwortet -> kein NOT_ASSESSED mehr, Abschluss erfolgreich ---
const resolvedState = {
  ...reportedState,
  locationLevel: 'deepest-underground',
  occupantDensityBelowOnePer10m2: 'yes',
  hasEmergencyExits: 'yes',
  enclosureVolumeM3: '8',
  ventilatedEnclosureDuctPerManufacturerInstructions: 'yes',
  ventilatedEnclosureFreshAirSufficient: 'yes',
  ventilatedEnclosureDuctToOutdoor: 'yes',
  ventilatedEnclosureToxicityLocationClass: 'III'
};
const resolvedCalc = calculate(resolvedState);
const toxResolved = resolvedCalc.chargeLimitAssessment.checks.find(check => check.id === 'charge-limit.toxicity');
assert.notEqual(toxResolved.status, 'not-assessed', 'nach Beantwortung mit III darf die toxizitätsbezogene Prüfung nicht mehr offen sein');
assert.equal(toxResolved.noLimit, true, 'Zuordnung III (deepest underground, Kategorie c) -> Tabelle C.1: keine Begrenzung');
assert.equal(resolvedCalc.status, 'acceptable', 'Gesamtbewertung schließt nach Beantwortung erfolgreich ab');
assert.equal(JSON.stringify(buildEN378SafetyCheckResultModel(resolvedState, resolvedCalc)).includes('Fehlend:'), false, 'keine "Fehlend"-Markierung mehr im Ergebnis');
console.log('✓ Test: End-to-End-Konsistenz - nach Antwort "III" kein offener toxizitätsbezogener Punkt mehr, Gesamtbewertung acceptable');

// --- Klarstellung der Auswahl "Ort des belüfteten Gehäuses" (EN 378-1, 5.3 / Tab. C.1, Spalte IV) ---
// Optionen vollständig ausgeschrieben (5.3 d / 5.3 c / 5.3 b), konsistent mit den
// Klassifikationsbezeichnungen, aber als eigene Klartexte ohne Kollision.
const locField = schema.fields.find(field => field.key === 'ventilatedEnclosureToxicityLocationClass');
const optionByValue = value => locField.options.find(option => option.value === value);
assert.equal(optionByValue('I').label, 'Aufstellungsort I – Mechanische Geräte im Personen-Aufenthaltsbereich');
assert.equal(optionByValue('II').label, 'Aufstellungsort II – Verdichter im Maschinenraum oder im Freien');
assert.equal(optionByValue('III').label, 'Aufstellungsort III – Maschinenraum oder im Freien');
const classField = schema.fields.find(field => field.key === 'installationClass');
assert.ok(classField.options.find(option => option.value === 'I').label.startsWith('Klasse I'), 'Aufstellungsort-Klassifikation behält ihre eigenen Bezeichnungen (keine Kollision)');
const veInfoField = schema.fields.find(field => field.key === 'ventilatedEnclosureToxicityClassInfo');
assert.ok(veInfoField.text.includes('5.3 d') && veInfoField.text.includes('5.3 c') && veInfoField.text.includes('5.3 b'), 'NOTICE nennt die Klartexte der Aufstellungsorte I/II/III mit Quellen (EN 378-1, 5.3)');
assert.ok(veInfoField.text.includes('Tabelle C.1, Spalte IV'), 'NOTICE behält die Quellenangabe Tabelle C.1, Spalte IV');
const renderedOptions = renderSchemaForm(schema, reportedState, { result: {} });
for (const label of ['Aufstellungsort I – Mechanische Geräte im Personen-Aufenthaltsbereich', 'Aufstellungsort II – Verdichter im Maschinenraum oder im Freien', 'Aufstellungsort III – Maschinenraum oder im Freien']) {
  assert.ok(renderedOptions.includes(label), `Render enthält den Optionsklartext "${label}"`);
}
console.log('✓ Test: Optionen "Ort des belüfteten Gehäuses" vollständig ausgeschrieben (EN 378-1, 5.3), NOTICE mit Klartext, Render-Check');

console.log('EN 378 ventilated enclosure (EN 378-3, 4.6) tests passed.');
