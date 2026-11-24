import assert from 'node:assert/strict';

import { 
  calculate,
  selectServitec,
  selectFillSystem,
  calculateFeedFlow,
  checkFeedLine,
  calculateSoftening,
  calculateDesalination,
  recommendSafetyValveConnection,
  getSafetyValveFlow,
  splitMagVessels,
  nextReflexN
} from '../modules/pressure-holding/logic.js';
import { buildPressureHoldingResultModel } from '../modules/pressure-holding/results.js';
import { buildPressureRecord, hydratePressureRecord } from '../modules/pressure-holding/controller.js';

const deInt = value => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value);

// ============================================================================
// Arbeitspaket 1: Servitec-Entgasung
// ============================================================================

// selectServitec - Auswahlkriterien nach Handbuch S. 57
assert.equal(selectServitec({ systemVolumeL: 500, medium: 'water', tMaxC: 50, peBar: 1.5 }).type, 'mini', 'Servitec Mini für 500 l Wasser bei 1,5 bar');
assert.equal(selectServitec({ systemVolumeL: 3000, medium: 'water', tMaxC: 60, peBar: 2.0 }).type, 's', 'Servitec S für 3000 l Wasser bei 2,0 bar');
assert.equal(selectServitec({ systemVolumeL: 2000, medium: 'glycol20', tMaxC: 60, peBar: 2.0 }).type, 's', 'Servitec S für 2000 l Glykol20');
assert.equal(selectServitec({ systemVolumeL: 50000, medium: 'water', tMaxC: 60, peBar: 2.0 }).type, '35', 'Servitec 35 für 50000 l Wasser bei 2,0 bar (Druckbereich 0,5-2,5 bar)');
assert.equal(selectServitec({ systemVolumeL: 30000, medium: 'glycol20', tMaxC: 60, peBar: 2.0 }).type, '75', 'Servitec 75 für 30000 l Glykol20 bei 2,0 bar (Druckbereich 1,3-5,4 bar, Glykol bis 50000 l)');

// Warnungen
const peWarn = selectServitec({ systemVolumeL: 500, medium: 'water', tMaxC: 50, peBar: 0.1 });
assert.ok(peWarn.warnings.some(w => w.includes('außerhalb aller Servitec-Arbeitsdruckbereiche')), 'Warnung bei pe außerhalb Druckbereich');

const tempWarn = selectServitec({ systemVolumeL: 500, medium: 'water', tMaxC: 80, peBar: 1.5 });
assert.ok(tempWarn.warnings.some(w => w.includes('übersteigt die Servitec-Typgrenzte von 70°C')), 'Warnung bei Temperatur > 70°C');

const volWarn = selectServitec({ systemVolumeL: 300000, medium: 'water', tMaxC: 60, peBar: 2.0 });
assert.ok(volWarn.warnings.some(w => w.includes('übersteigt die maximalen Tabellenwerte')), 'Warnung bei Volumen über Tabellenwert');

// Hinweistext
const result1 = selectServitec({ systemVolumeL: 500, medium: 'water', tMaxC: 50, peBar: 1.5 });
assert.ok(result1.note.includes('Arbeitsdruck muss mindestens so hoch wie der mögliche Enddruck'), 'Hinweistext vorhanden');

// Servitec integration in calculate
const stateWithServitec = {
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'true',
  includeServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '1000',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '80',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat'
};
const calcWithServitec = calculate(stateWithServitec);
assert.equal(calcWithServitec.servitecAdd, 5, 'Servitec-Zuschlag von 5 l aktiv');
assert.ok(calcWithServitec.accessories, 'Accessories Objekt vorhanden');
assert.ok(calcWithServitec.accessories.servitec, 'Servitec in Accessories');
assert.ok(calcWithServitec.accessories.servitec.type, 'Servitec Typ ausgewählt');

const stateWithoutServitec = { ...stateWithServitec, useServitec: 'false', includeServitec: 'false' };
const calcWithoutServitec = calculate(stateWithoutServitec);
assert.equal(calcWithoutServitec.servitecAdd, 0, 'Kein Servitec-Zuschlag');

// ============================================================================
// Arbeitspaket 2: Nachspeisung Fillset/Fillcontrol
// ============================================================================

// selectFillSystem
assert.equal(selectFillSystem({ feedType: 'manual', feedPressureBar: '2.0', p0Bar: 1.0 }).system, 'fillset', 'Fillset für manuelle Nachspeisung');
assert.equal(selectFillSystem({ feedType: 'manual', feedPressureBar: '2.0', p0Bar: 1.0 }).kvs, 1.5);

assert.equal(selectFillSystem({ feedType: 'auto', feedPressureBar: '3.0', p0Bar: 1.5 }).system, 'fillcontrolAuto', 'Fillcontrol Auto für automatische Nachspeisung');
assert.equal(selectFillSystem({ feedType: 'auto', feedPressureBar: '3.0', p0Bar: 1.5 }).kvs, 0.18);
assert.equal(selectFillSystem({ feedType: 'auto', feedPressureBar: '3.0', p0Bar: 1.5 }).pumpMaxBar, 5.5);

assert.equal(selectFillSystem({ feedType: 'auto', feedPressureBar: '2.0', p0Bar: 6.0 }).system, 'fillcontrolAutoCompact', 'Fillcontrol Auto Compact für hohen Vordruck');
assert.equal(selectFillSystem({ feedType: 'auto', feedPressureBar: '2.0', p0Bar: 6.0 }).pumpMaxBar, 8.5);

const feedWarn = selectFillSystem({ feedType: 'auto', feedPressureBar: '2.0', p0Bar: 1.5 });
assert.ok(feedWarn.warnings.some(w => w.includes('mindestens 1,3 bar über')), 'Warnung bei zu geringem Fließdruck');

// calculateFeedFlow
assert.equal(calculateFeedFlow(1.5), 1500, '1,5 m³/h = 1500 l/h');
assert.equal(calculateFeedFlow(0.18), 180, '0,18 m³/h = 180 l/h');
assert.equal(calculateFeedFlow(0), 0, '0 m³/h = 0 l/h');

// checkFeedLine
const shortLineWarn = checkFeedLine({ feedLineLengthM: '5', feedType: 'auto' });
assert.ok(shortLineWarn.some(w => w.includes('Wasserschlagdämpfer')), 'Warnung für kurze Leitungen');

const longLineWarn = checkFeedLine({ feedLineLengthM: '15', feedType: 'auto' });
assert.ok(longLineWarn.some(w => w.includes('kleines Refix-Ausdehnungsgefäß')), 'Warnung für lange Leitungen');

assert.deepEqual(checkFeedLine({ feedLineLengthM: '15', feedType: 'manual' }), [], 'Keine Warnungen für manuelle Nachspeisung');

// Fill system integration in calculate
const stateWithFill = {
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '1000',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '80',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat',
  feedType: 'auto',
  feedPressureBar: '3.0',
  systemSeparation: 'systemSeparator',
  feedLineLengthM: '5'
};
const calcWithFill = calculate(stateWithFill);
assert.ok(calcWithFill.accessories.fillSystem, 'Fill System in Accessories');
assert.ok(calcWithFill.accessories.fillSystem.system, 'Fill System Typ ausgewählt');
assert.ok(calcWithFill.accessories.fillSystem.feedFlowLh > 0, 'Nachspeisemenge berechnet');

// ============================================================================
// Arbeitspaket 3: Fillsoft Wasseraufbereitung
// ============================================================================

// calculateSoftening
const soft1 = calculateSoftening({ systemVolumeL: 1000, waterHardness: 10, capacity: 3000 });
assert.equal(soft1.fillVolumeL, 300, 'Vf = 3000 / 10 = 300 l');
assert.equal(soft1.patronCount, 4, 'n = ceil(1000 * 10 / 3000) = 4');
assert.equal(soft1.restFeedVolumeL, 200, 'VN = 4 * 3000 / 10 - 1000 = 200 l');

const soft2 = calculateSoftening({ systemVolumeL: 1000, waterHardness: 0, capacity: 3000 });
assert.ok(soft2.warnings.some(w => w.includes('Gesamtwasserhärte GHst muss > 0')), 'Warnung bei GHst <= 0');

const soft3 = calculateSoftening({ systemVolumeL: 40, waterHardness: 10, capacity: 3000 });
assert.ok(soft3.warnings.some(w => w.includes('Anlagen < 50 kW')), 'Warnung für kleine Anlagen');

// calculateDesalination
const desal1 = calculateDesalination({ systemVolumeL: 1000, waterHardness: 10, capacity: 3000 });
assert.ok(desal1.warnings.some(w => w.includes('Genaue Kapazitätsberechnung nicht möglich')), 'Pflicht-Hinweis für Entsalzung');

const soft4 = calculateSoftening({ systemVolumeL: 1000, waterHardness: 10, capacity: 3000 });
const desal2 = calculateDesalination({ systemVolumeL: 1000, waterHardness: 10, capacity: 3000 });
assert.equal(desal2.fillVolumeL, soft4.fillVolumeL);
assert.equal(desal2.patronCount, soft4.patronCount);
assert.equal(desal2.restFeedVolumeL, soft4.restFeedVolumeL);

// Water treatment integration in calculate
const stateWithWater = {
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '1000',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '80',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat',
  waterTreatmentMethod: 'softening',
  regionalWaterHardness: '15'
};
const calcWithWater = calculate(stateWithWater);
assert.ok(calcWithWater.accessories.waterTreatment, 'Wasseraufbereitung in Accessories');
assert.equal(calcWithWater.accessories.waterTreatment.method, 'softening');
assert.ok(calcWithWater.accessories.waterTreatment.patronCount > 0, 'Patronenzahl berechnet');

const stateWithDesal = { ...stateWithWater, waterTreatmentMethod: 'desalination' };
const calcWithDesal = calculate(stateWithDesal);
assert.ok(calcWithDesal.accessories.waterTreatment, 'Wasseraufbereitung in Accessories');
assert.equal(calcWithDesal.accessories.waterTreatment.method, 'desalination');

// ============================================================================
// Arbeitspaket 4: Sicherheitsventil-Größenempfehlung
// ============================================================================

// getSafetyValveFlow
assert.equal(getSafetyValveFlow('05', 5.0), 2200, 'G ½" bei 5 bar = 2200 m³/h');
assert.equal(getSafetyValveFlow('1', 5.0), 5500, 'G 1" bei 5 bar = 5500 m³/h');
assert.equal(getSafetyValveFlow('unknown', 5.0), 0, 'Unbekannte Anschlussgröße = 0');

// recommendSafetyValveConnection
const sv1 = recommendSafetyValveConnection(3000, 800);
assert.equal(sv1.connection, '05', 'G ½" für 800 l');
assert.equal(sv1.flowRateLh, 3100, '3100 l/h für G ½"');

const sv2 = recommendSafetyValveConnection(5000, 1500);
assert.equal(sv2.connection, '1', 'G 1" für 1500 l');
assert.equal(sv2.flowRateLh, 10600, '10600 l/h für G 1"');

const sv3 = recommendSafetyValveConnection(4000, 800);
assert.ok(sv3.warnings.some(w => w.includes('Abblaseleistung') && w.includes('unter dem erforderlichen')), 'Warnung bei unzureichender Abblaseleistung');

// Safety valve integration in calculate
const stateWithSV = {
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '1000',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '80',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat',
  heatPowerKw: '3000'
};
const calcWithSV = calculate(stateWithSV);
assert.ok(calcWithSV.accessories.safetyValve, 'Sicherheitsventil in Accessories');
assert.ok(calcWithSV.accessories.safetyValve.connection, 'Anschlussgröße empfohlen');
assert.ok(calcWithSV.accessories.safetyValve.flowRateLh > 0, 'Abblaseleistung berechnet');
assert.ok(calcWithSV.accessories.safetyValve.note.includes('Sicherheitsventile sind nicht im Lieferprogramm'), 'Pflicht-Hinweis für Sicherheitsventil');

// ============================================================================
// Ergebnis-Modell mit Zubehör-Abschnitt
// ============================================================================

const fullState = {
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'true',
  servitecType: 'auto',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '500',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '50',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat',
  feedType: 'auto',
  feedPressureBar: '3.0',
  systemSeparation: 'systemSeparator',
  feedLineLengthM: '5',
  waterTreatmentMethod: 'softening',
  regionalWaterHardness: '15',
  heatPowerKw: '3000'
};
const fullResult = calculate(fullState);
const model = buildPressureHoldingResultModel(fullState, fullResult, 'purple');

// Prüfe dass Zubehör-Abschnitt vorhanden ist
assert.ok(model.groups.some(g => g.title === 'Zubehör'), 'Zubehör-Abschnitt im Ergebnis-Modell');

// Prüfe dass Untergruppen vorhanden sind
const zubehorGroup = model.groups.find(g => g.title === 'Zubehör');
assert.ok(zubehorGroup, 'Zubehör-Gruppe gefunden');
assert.ok(zubehorGroup.groups, 'Untergruppen vorhanden');
assert.ok(zubehorGroup.groups.length > 0, 'Mindestens eine Zubehör-Untergruppe');

// ============================================================================
// Migration und Regression
// ============================================================================

// Migration includeServitec -> useServitec
const oldState = { includeServitec: 'true' };
const migratedState = { ...oldState };
if (migratedState.useServitec === undefined && migratedState.includeServitec !== undefined) {
  migratedState.useServitec = migratedState.includeServitec;
}
if (migratedState.useServitec === undefined) {
  migratedState.useServitec = 'true';
}
assert.equal(migratedState.useServitec, 'true', 'Migration von includeServitec zu useServitec');

// Regression: bestehende MAG-Berechnung
const magState = {
  systemType: 'heating',
  holdingType: 'mag',
  includeServitec: 'false',
  useServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '1000',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '80',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  dynamicType: 'reflexomat'
};
const magResult = calculate(magState);
assert.ok(magResult.vnMag > 0, 'MAG-Nennvolumen berechnet');
assert.ok(magResult.p0 > 0, 'Mindestbetriebsdruck berechnet');
assert.ok(magResult.pe > 0, 'Enddruck berechnet');
assert.equal(magResult.servitecAdd, 0, 'Kein Servitec-Zuschlag bei deaktiviertem Servitec');

// pSV-Empfehlung unverändert
const psvState = {
  systemType: 'heating',
  holdingType: 'mag',
  useServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '1000',
  additionalVolumeL: '',
  frostMode: 'water',
  tMaxC: '80',
  tMinC: '10',
  staticHeightM: '10',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '2.5',
  dynamicType: 'reflexomat'
};
const psvResult = calculate(psvState);
assert.ok(psvResult.warnings.some(w => w.includes('pSV ≥ p0 + 1,5 bar')), 'pSV-Empfehlung unverändert');

// hydratePressureRecord Migration
const item = { state: { includeServitec: 'true' } };
const current = {};
const hydrated = hydratePressureRecord(item, current);
assert.equal(hydrated.useServitec, 'true', 'Migration in hydratePressureRecord');
assert.equal(hydrated.servitecType, 'auto', 'Default servitecType');
assert.equal(hydrated.feedType, 'manual', 'Default feedType');
assert.equal(hydrated.waterTreatmentMethod, 'softening', 'Default waterTreatmentMethod');

// buildPressureRecord mit Zubehör
const record = buildPressureRecord(fullState, fullResult, [], 'test-1', 'Testanlage');
assert.ok(record.result.accessories, 'Accessories im Record');
assert.ok(record.result.accessories.servitec, 'Servitec im Record');
assert.ok(record.result.accessories.fillSystem, 'FillSystem im Record');
assert.ok(record.result.accessories.waterTreatment, 'WaterTreatment im Record');
assert.ok(record.result.accessories.safetyValve, 'SafetyValve im Record');

console.log('pressure-holding Reflex Zubehör (alle Arbeitspakete 1-4) ok');

// Prüfung des Patronen-Hinweistexts im Ergebnis-Modell
const waterTreatmentGroup = model.groups
  .find(g => g.title === 'Zubehör')?.groups
  .find(g => g.title.includes('Wasseraufbereitung'));
if (waterTreatmentGroup) {
  const patronNote = waterTreatmentGroup.rows.find(row => row.label === 'Hinweis' && row.isNote);
  assert.ok(patronNote, 'Patronen-Hinweistext vorhanden');
  assert.ok(patronNote.value.includes('Erstbefüllung'), 'Hinweistext enthält Erstbefüllung');
  assert.ok(patronNote.value.includes('Patronenvorrat'), 'Hinweistext enthält Patronenvorrat');
}
