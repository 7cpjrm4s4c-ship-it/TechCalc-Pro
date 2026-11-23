import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculate, splitMagVessels, nextReflexN } from '../modules/pressure-holding/logic.js';
import { buildPressureHoldingResultModel } from '../modules/pressure-holding/results.js';
import { buildPressureRecord } from '../modules/pressure-holding/controller.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deInt = value => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value);

// ---------------------------------------------------------------------------
// A) MAG-Aufteilung: n = min { n ≥ 1 : nextReflexN(vnMag / n) ≤ 1000 }
//    (Reflex Planungshandbuch „Planen Berechnen Ausrüsten“)
// ---------------------------------------------------------------------------
assert.deepEqual(splitMagVessels(2400), { count: 3, vesselVolumeL: 800, totalVolumeL: 2400 }, '2400 l → 3 × 800 l');
assert.deepEqual(splitMagVessels(1200), { count: 2, vesselVolumeL: 600, totalVolumeL: 1200 }, '1200 l → 2 × 600 l');
assert.deepEqual(splitMagVessels(900), { count: 1, vesselVolumeL: 1000, totalVolumeL: 1000 }, '900 l → 1 × 1000 l');
assert.deepEqual(splitMagVessels(1050), { count: 2, vesselVolumeL: 600, totalVolumeL: 1200 }, '1050 l → 2 × 600 l (Gesamt 1200 l)');
assert.deepEqual(splitMagVessels(35), { count: 1, vesselVolumeL: 35, totalVolumeL: 35 }, 'kleine MAG bleiben ein Gefäß');
assert.deepEqual(splitMagVessels(1000), { count: 1, vesselVolumeL: 1000, totalVolumeL: 1000 }, 'genau 1000 l bleibt ein Gefäß');
assert.deepEqual(splitMagVessels(1001), { count: 2, vesselVolumeL: 600, totalVolumeL: 1200 }, 'ab 1001 l wird aufgeteilt');
assert.deepEqual(splitMagVessels(0), { count: 0, vesselVolumeL: 0, totalVolumeL: 0 }, 'kein Volumen → keine Aufteilung');
assert.equal(nextReflexN(800), 800);
assert.equal(nextReflexN(801), 1000);
assert.equal(nextReflexN(1001), undefined, 'über 1000 l existiert keine Reflex-N-Größe');

// Der G/SL-Fallback (1500–5000 l) für normale MAG ist vollständig entfallen.
const logicSource = fs.readFileSync(path.join(root, 'modules/pressure-holding/logic.js'), 'utf8');
assert.ok(!logicSource.includes('G/SL'), 'kein Reflex-G/SL-Fallback mehr im MAG-Pfad');

// ---------------------------------------------------------------------------
// A) calculate-End-to-End: großes MAG wird aufgeteilt, vnMag bleibt Primärergebnis
// ---------------------------------------------------------------------------
const bigMagState = {
  systemType: 'heating',
  holdingType: 'mag',
  includeServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '20000',
  additionalVolumeL: '',
  heatPowerKw: '',
  specificWaterContent: '20',
  frostMode: 'water',
  tMaxC: '100',
  tMinC: '10',
  staticHeightM: '20',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '6',
  dynamicType: 'reflexomat'
};
const big = calculate(bigMagState);
assert.ok(big.vnMag > 1000, 'Testfall muss ein MAG-Nennvolumen über 1000 l ergeben');
assert.ok(Math.abs(big.vnMag - (big.ve + big.vv + big.servitecAdd) * big.factor) < 1e-9, 'vnMag-Formel unverändert');
const bigSplit = splitMagVessels(big.vnMag);
assert.equal(big.vesselCount, bigSplit.count, 'vesselCount entspricht der Aufteilungsregel');
assert.equal(big.vesselVolumeL, bigSplit.vesselVolumeL);
assert.equal(big.totalSelectedVolumeL, bigSplit.totalVolumeL);
assert.ok(big.vesselVolumeL <= 1000, 'kein Einzelgefäß über 1000 l');
assert.ok(big.totalSelectedVolumeL >= big.vnMag, 'Gesamtvolumen der Auswahl deckt vnMag ab');
assert.equal(big.productLabel, `${bigSplit.count} × Reflex N ${bigSplit.vesselVolumeL}`, 'Produktlabel n × Reflex N <v>');
assert.equal(big.selectedVolume, big.vnMag, 'selectedVolume bleibt das erforderliche Nennvolumen vnMag');
assert.equal(big.selectedStandardVolume, bigSplit.vesselVolumeL, 'Standardvolumen = Nennvolumen je Gefäß');
assert.ok(!String(big.productLabel).includes('G/SL'));

// Gegenprobe: kleines MAG bleibt ein einzelnes Gefäß
const smallMagState = {
  ...bigMagState,
  systemType: 'cooling',
  systemVolumeL: '800',
  staticHeightM: '13',
  tMaxC: '10',
  tMinC: '0',
  safetyValveBar: '3'
};
const small = calculate(smallMagState);
assert.equal(small.vesselCount, 1, 'kleines MAG: genau ein Gefäß');
assert.ok(small.vnMag < 1000);
assert.equal(small.productLabel, `Reflex N ${small.vesselVolumeL}`, 'Produktlabel ohne Mehrfachangabe bei n = 1');
assert.equal(small.totalSelectedVolumeL, small.vesselVolumeL);

// ---------------------------------------------------------------------------
// A) Dynamische Druckhaltung bleibt von der Aufteilung unberührt
// ---------------------------------------------------------------------------
const dynState = { ...bigMagState, holdingType: 'dynamic', dynamicType: 'reflexomat', systemVolumeL: '200000' };
const dyn = calculate(dynState);
assert.ok(dyn.productLabel.startsWith('Reflexomat'), 'Dynamik-Produktlabel unverändert');
assert.ok(dyn.productLabel.includes('Grundgefäß'));
assert.equal(dyn.vesselCount, 0, 'keine Aufteilung bei dynamischer Druckhaltung');
assert.equal(dyn.vesselVolumeL, 0);
assert.equal(dyn.totalSelectedVolumeL, 0);
assert.ok(dyn.selectedStandardVolume > 1000, 'dynamisch darf das Grundgefäß weiterhin über 1000 l liegen (Größenreihe bis 5000 l + Rundung)');
assert.equal(dyn.selectedStandardVolume, 11000);

// ---------------------------------------------------------------------------
// B) pSV-Plausibilitätswarnung (nur MAG)
//    p0 = 1,5 bar, pSV = 2,5 bar → Empfehlung pSV ≥ 3,0 bar → Warnung
//    p0 = 1,5 bar, pSV = 3,0 bar → keine Warnung
// ---------------------------------------------------------------------------
const psvBase = {
  systemType: 'cooling',
  holdingType: 'mag',
  includeServitec: 'false',
  connectionType: 'suction',
  waterContentMode: 'known',
  systemVolumeL: '800',
  frostMode: 'water',
  tMaxC: '10',
  tMinC: '0',
  staticHeightM: '13',
  staticPressureBar: '',
  pumpPressureBar: '',
  dynamicType: 'variomat'
};
const psvLow = calculate({ ...psvBase, safetyValveBar: '2.5' });
assert.equal(psvLow.p0, 1.5, 'p0 = 1,5 bar im Testfall');
const psvWarning = psvLow.warnings.find(message => message.includes('pSV ≥ p0'));
assert.ok(psvWarning, 'pSV = 2,5 bar bei p0 = 1,5 bar muss die Empfehlung melden (2,5 < 3,0)');
assert.ok(psvWarning.includes('3,0 bar'), 'Warnung nennt den empfohlenen Mindestwert 3,0 bar');
assert.ok(psvWarning.includes('2,5 bar'), 'Warnung nennt den eingestellten Wert 2,5 bar');
assert.ok(psvWarning.includes('Planen Berechnen Ausrüsten'), 'Warnung nennt die Quelle');

const psvOk = calculate({ ...psvBase, safetyValveBar: '3' });
assert.ok(!psvOk.warnings.some(message => message.includes('pSV ≥ p0')), 'pSV = 3,0 bar bei p0 = 1,5 bar erfüllt die Empfehlung → keine Warnung');

const psvHigh = calculate({ ...psvBase, staticHeightM: '60', safetyValveBar: '7' });
const psvHighWarning = psvHigh.warnings.find(message => message.includes('pSV ≥ p0'));
assert.ok(psvHighWarning, 'pSV > 5 bar: pSV = 7,0 bar bei p0 = 6,2 bar unterschreitet p0 + 2,0 bar = 8,2 bar');
assert.ok(psvHighWarning.includes('p0 + 2,0 bar'), 'Warnung nennt die 2,0-bar-Spanne für pSV > 5 bar');
assert.ok(psvHighWarning.includes('8,2 bar'), 'Warnung nennt den empfohlenen Mindestwert 8,2 bar');

const dynPsv = calculate({ ...psvBase, holdingType: 'dynamic', safetyValveBar: '2.5' });
assert.ok(!dynPsv.warnings.some(message => message.includes('pSV ≥ p0')), 'bei dynamischer Druckhaltung keine pSV-Empfehlungswarnung');

// ---------------------------------------------------------------------------
// A) Ausgabezeilen: Ergebnisliste (results.js) und gespeicherte Anlage (controller.js)
// ---------------------------------------------------------------------------
const magModel = buildPressureHoldingResultModel(bigMagState, big);
assert.equal(magModel.primary.primary.label, 'Erforderliches MAG-Nennvolumen', 'Primärergebnis bleibt vnMag');
const magDetailLabels = magModel.primary.rows.map(row => row.label);
assert.ok(magDetailLabels.includes('Anzahl MAG'));
assert.ok(magDetailLabels.includes('Nennvolumen je Gefäß'));
assert.ok(magDetailLabels.includes('Gesamt-Nennvolumen der Auswahl'));
assert.ok(!magDetailLabels.includes('Nächstes Normvolumen'), 'MAG: Zeile „Nächstes Normvolumen“ ersetzt');
const magDetail = Object.fromEntries(magModel.primary.rows.map(row => [row.label, row]));
assert.equal(magDetail['Anzahl MAG'].value, deInt(big.vesselCount));
assert.equal(magDetail['Nennvolumen je Gefäß'].value, deInt(big.vesselVolumeL));
assert.equal(magDetail['Gesamt-Nennvolumen der Auswahl'].value, deInt(big.totalSelectedVolumeL));
const magFormulaLabels = magModel.groups.find(group => group.title === 'Formeln').rows.map(row => row.label);
assert.ok(magFormulaLabels.includes('MAG-Nennvolumen'));
assert.ok(magFormulaLabels.includes('MAG-Aufteilung'), 'Formelzeile zur Aufteilung vorhanden');

const dynModel = buildPressureHoldingResultModel(dynState, dyn);
assert.ok(dynModel.primary.rows.some(row => row.label === 'Nächstes Normvolumen'), 'Dynamik behält „Nächstes Normvolumen“');
assert.ok(!dynModel.primary.rows.some(row => row.label === 'Anzahl MAG'));

const magRecord = buildPressureRecord(bigMagState, big, [], 'pressure-mag-split', 'MAG groß');
assert.ok(magRecord.rows.some(row => row[0] === 'Produkt' && row[1] === big.productLabel));
assert.ok(magRecord.rows.some(row => row[0] === 'Anzahl MAG' && row[1] === String(big.vesselCount)));
assert.ok(magRecord.rows.some(row => row[0] === 'Nennvolumen je Gefäß' && row[1] === String(big.vesselVolumeL) && row[2] === 'l'));
assert.ok(magRecord.rows.some(row => row[0] === 'Gesamt-Nennvolumen der Auswahl' && row[1] === String(big.totalSelectedVolumeL) && row[2] === 'l'));
assert.ok(!magRecord.rows.some(row => row[0] === 'Standardvolumen'), 'MAG-Record: Zeile „Standardvolumen“ ersetzt');
assert.equal(magRecord.result.vesselCount, big.vesselCount);
assert.equal(magRecord.result.vesselVolumeL, big.vesselVolumeL);
assert.equal(magRecord.result.totalSelectedVolumeL, big.totalSelectedVolumeL);

const dynRecord = buildPressureRecord(dynState, dyn, [], 'pressure-dyn', 'Dynamisch');
assert.ok(dynRecord.rows.some(row => row[0] === 'Standardvolumen' && row[1] === String(Math.round(dyn.selectedStandardVolume)) && row[2] === 'l'), 'Dynamik-Record behält „Standardvolumen“');
assert.equal(dynRecord.result.vesselCount, undefined, 'Dynamik-Record ohne Aufteilungsfelder');

console.log('pressure-holding MAG split (Aufteilung ≤ 1000 l, pSV-Hinweis, Ausgabezeilen) ok');
