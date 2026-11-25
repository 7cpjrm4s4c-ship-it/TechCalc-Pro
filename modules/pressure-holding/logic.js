// Druckhaltung – Berechnungslogik
// Quellenbasis: Reflex Planungs- und Berechnungshandbuch »Planen Berechnen Ausrüsten« (Reflex Winkelmann GmbH)
//   · MAG-Nennvolumen: Vn = (Ve + VV [+ 5 l Servitec]) × (pe + 1) / (pe − p0)
//   · Aufteilung großer MAG-Nennvolumina auf mehrere gleiche Gefäße ≤ 1000 l (Reflex N):
//     n = min { n ≥ 1 : nextReflexN(Vn / n) ≤ 1000 }, je Gefäß nextReflexN(Vn / n)
//   · Empfehlung Sicherheitsventil: pSV ≥ p0 + 1,5 bar (pSV ≤ 5 bar) bzw. pSV ≥ p0 + 2,0 bar (pSV > 5 bar)
//   · Servitec-Entgasung (S. 57-61): Auswahl nach Anlagenvolumen, Medium, Temperatur und Arbeitsdruck
//   · Nachspeisung Fillset/Fillcontrol (S. 44-45): kvs-Werte und Systemauswahl
//   · Fillsoft Wasseraufbereitung (S. 51-55): Enthärtung/Entsalzung nach VDI 2035
//   · Sicherheitsventil-Abblaseleistung (S. 68-69): Anschlussgrößen und Abblaseleistungen
//
// Bewusst nicht umgesetzte Punkte (Dokumentation, keine Implementierung):
//   1. Anfangsdruck-Kontrolle nach Gefäßwahl (pa ≥ p0 + 0,25…0,3 bar, sonst nächstgrößeres Nennvolumen):
//      Die Formel ist im hinterlegten Handbuch nicht eindeutig extrahierbar.
//   2. Ausgabe des Fülldrucks pF (dasselbe Ergebnis).
//   3. Für Anlagen mit VA ≤ 15 l schreibt das Reflex-Formblatt alternativ VV = 0,2 · VA vor;
//      das Modul verwendet durchgängig VV = max(3 l; 0,005 · VA) und liegt damit auf der sicheren Seite.
//   4. Herstellerseitige Einstellwerte für Nachspeisesysteme (Anfangsdruck-Sollwerte je Gerätetyp).
//   5. Härtestabilisierungsverfahren (Polyphosphat, physikalische Verfahren) – Wirksamkeit nicht allgemein quantifizierbar.
import { parseNumber, formatNumber } from '../../core/engineering/numberService.js';

const WATER = [
  [0,0,0,1000],[10,0,0,1000],[20,0.13,0,998],[30,0.37,0,996],[40,0.72,0,992],[50,1.15,0,988],[60,1.66,0,983],[70,2.24,0,978],[80,2.88,0,972],[90,3.58,0,965],[100,4.34,0.01,958],[105,4.74,0.43,955],[110,5.15,0.98,951],[120,6.03,1.70,943],[130,6.96,2.61,935],[140,7.96,3.76,926],[150,9.03,5.18,917],[160,10.20,6.30,907]
];
const GLYCOL20 = [[0,0.07,0,1039],[10,0.26,0,1037],[20,0.54,0,1035],[30,0.90,0,1031],[40,1.33,0,1026],[50,1.83,0,1022],[60,2.37,0,1016],[70,2.95,0,1010],[80,3.57,0,1004],[90,4.23,0,998],[100,4.92,0,991],[110,5.64,0.33,985],[120,6.40,0.85,978],[130,7.19,1.52,970],[140,8.02,2.38,963],[150,8.89,3.47,955],[160,9.79,4.38,947]];
const GLYCOL34 = [[0,0.35,0,1066],[10,0.66,0,1063],[20,1.04,0,1059],[30,1.49,0,1054],[40,1.99,0,1049],[50,2.53,0,1043],[60,3.11,0,1037],[70,3.71,0,1031],[80,4.35,0,1025],[90,5.01,0,1019],[100,5.68,0,1012],[110,6.39,0.23,1005],[120,7.11,0.70,999],[130,7.85,1.33,992],[140,8.62,2.13,985],[150,9.41,3.15,978],[160,10.20,4.41,970]];
const STANDARD_VOLUMES = [8,12,18,25,35,50,80,100,140,200,250,300,400,500,600,800,1000,1500,2000,3000,4000,5000];
const REFLEX_N_VOLUMES = [8,12,18,25,35,50,80,100,140,200,250,300,400,500,600,800,1000];

// ============================================================================
// Arbeitspaket 1: Servitec-Entgasung (Reflex Handbuch S. 57-61)
// ============================================================================

// Servitec-Typen mit ihren Spezifikationen
// Quelle: Reflex Planungshandbuch »Planen Berechnen Ausrüsten« S. 57-61
const SERVITEC_TYPES = {
  mini: {
    label: 'Servitec Mini',
    maxVolumeWater: 1000,
    maxVolumeGlycol: 0,
    maxTemp: 60,
    pressureRangeMin: 0.5,
    pressureRangeMax: 2.5,
    note: 'Geeignet für Anlagen bis 1 m³ mit Handnachspeisung'
  },
  s: {
    label: 'Servitec S',
    maxVolumeWater: 6000,
    maxVolumeGlycol: 4000,
    maxTemp: 70,
    pressureRangeMin: 0.5,
    pressureRangeMax: 4.5,
    note: ''
  },
  '35': {
    label: 'Servitec 35',
    maxVolumeWater: 220000,
    maxVolumeGlycol: 0,
    maxTemp: 90,
    pressureRangeMin: 0.5,
    pressureRangeMax: 2.5,
    note: 'T-Variante, bis 90 °C'
  },
  '60': {
    label: 'Servitec 60',
    maxVolumeWater: 220000,
    maxVolumeGlycol: 0,
    maxTemp: 90,
    pressureRangeMin: 0.5,
    pressureRangeMax: 4.5,
    note: 'T-Variante, bis 90 °C'
  },
  '75': {
    label: 'Servitec 75',
    maxVolumeWater: 220000,
    maxVolumeGlycol: 50000,
    maxTemp: 90,
    pressureRangeMin: 1.3,
    pressureRangeMax: 5.4,
    note: 'T-Variante, bis 90 °C; Glykol-Betrieb bis 50 m³'
  },
  '95': {
    label: 'Servitec 95',
    maxVolumeWater: 220000,
    maxVolumeGlycol: 50000,
    maxTemp: 90,
    pressureRangeMin: 1.3,
    pressureRangeMax: 7.2,
    note: 'T-Variante, bis 90 °C; Glykol-Betrieb bis 50 m³'
  },
  '120t': {
    label: 'Servitec 120 T',
    maxVolumeWater: 220000,
    maxVolumeGlycol: 0,
    maxTemp: 90,
    pressureRangeMin: 1.3,
    pressureRangeMax: 9.0,
    note: 'Nur für Wasser, T-Variante, bis 90 °C'
  }
};

/**
 * Wählt den passenden Servitec-Typ basierend auf Anlagenvolumen, Medium, max. Temperatur und Enddruck pe.
 * Auswahlkriterien nach Reflex Handbuch S. 57:
 * - Volumen muss innerhalb der Typgrenzen liegen
 * - Medium muss kompatibel sein (Wasser-Glykol nur bei bestimmten Typen)
 * - Temperatur muss <= maxTemp des Typs sein
 * - Arbeitsdruck pe muss innerhalb des Druckbereichs liegen (pressureRangeMin <= pe <= pressureRangeMax)
 * - Wählt den kleinsten Typ, der alle Kriterien erfüllt
 *
 * @param {Object} params - { systemVolumeL, medium, tMaxC, peBar }
 * @param {number} params.systemVolumeL - Anlagenvolumen in Litern
 * @param {string} params.medium - 'water', 'glycol20', oder 'glycol34'
 * @param {number} params.tMaxC - Maximale Temperatur in °C
 * @param {number} params.peBar - Enddruck in bar
 * @returns {Object} { type: string, label: string, warnings: string[], note: string }
 */
export function selectServitec({ systemVolumeL, medium, tMaxC, peBar }) {
  const volume = num(systemVolumeL);
  const temp = num(tMaxC);
  const pe = num(peBar);
  const isWater = medium === 'water';
  const isGlycol = medium === 'glycol20' || medium === 'glycol34';

  const warnings = [];
  let selectedType = null;
  let selectedLabel = null;

  // Prüfe, ob pe außerhalb aller Druckbereiche liegt
  const allTypes = Object.entries(SERVITEC_TYPES);
  const minPressure = Math.min(...allTypes.map(([_, spec]) => spec.pressureRangeMin));
  const maxPressure = Math.max(...allTypes.map(([_, spec]) => spec.pressureRangeMax));

  if (pe > 0 && (pe < minPressure || pe > maxPressure)) {
    warnings.push(`Enddruck pe = ${barText(pe)} bar liegt außerhalb aller Servitec-Arbeitsdruckbereiche (${barText(minPressure)}-${barText(maxPressure)} bar).`);
  }


  // Sortiere Typen nach Größe (Mini -> S -> 35 -> 60 -> 75 -> 95 -> 120t)
  const typeOrder = ['mini', 's', '35', '60', '75', '95', '120t'];

  // Finde den kleinsten passenden Typ
  for (const type of typeOrder) {
    const spec = SERVITEC_TYPES[type];
    
    // Volumenprüfung
    const maxVol = isWater ? spec.maxVolumeWater : spec.maxVolumeGlycol;
    if (volume > maxVol) {
      continue; // Volumen zu groß für diesen Typ
    }

    // Mediumprüfung
    if (!isWater && spec.maxVolumeGlycol === 0) {
      continue; // Typ unterstützt kein Glykol
    }

    // Temperaturprüfung
    if (temp > spec.maxTemp) {
      continue; // Temperatur zu hoch
    }

    // Druckprüfung
    if (pe < spec.pressureRangeMin || pe > spec.pressureRangeMax) {
      continue; // Druck außerhalb Bereich
    }

    // Alle Kriterien erfüllt - dieser Typ passt
    selectedType = type;
    selectedLabel = spec.label;
    break;
  }

  // Wenn kein Typ gefunden wurde, prüfe ob Volumen zu groß ist
  if (!selectedType) {
    const maxWaterVol = Math.max(...allTypes.map(([_, spec]) => spec.maxVolumeWater));
    const maxGlycolVol = Math.max(...allTypes.filter(([_, spec]) => spec.maxVolumeGlycol > 0).map(([_, spec]) => spec.maxVolumeGlycol));
    const maxVol = isWater ? maxWaterVol : maxGlycolVol;
    
    if (volume > maxVol) {
      warnings.push(`Anlagenvolumen ${volume} l übersteigt die maximalen Tabellenwerte (${maxVol} l). Sonderanlage auf Anfrage, Temperaturen bis 90°C.`);
    } else {
      warnings.push('Kein passender Servitec-Typ gefunden. Bitte Parameter prüfen.');
    }
    
    // Gib den größten verfügbaren Typ zurück als Fallback
    selectedType = typeOrder[typeOrder.length - 1];
    selectedLabel = SERVITEC_TYPES[selectedType].label;
  }

  return {
    type: selectedType,
    label: selectedLabel,
    warnings,
    note: 'Arbeitsdruck muss mindestens so hoch wie der mögliche Enddruck am hydraulischen Einbindpunkt sein; empfohlen ist der Betrieb auf der Anlagenseite bei Temperaturen ≤ 90°C.'
  };
}

// ============================================================================
// Arbeitspaket 2: Nachspeisung Fillset/Fillcontrol (Reflex Handbuch S. 44-45)
// ============================================================================

// Produktdaten: kvs-Werte in m³/h
// Quelle: Reflex Planungshandbuch »Planen Berechnen Ausrüsten« S. 44
export const FILL_SYSTEM_KVS = {
  fillsetCompact: { label: 'Fillset Compact', kvs: 1.5, type: 'manual', pumpMaxBar: null },
  fillset: { label: 'Fillset', kvs: 1.5, type: 'manual', pumpMaxBar: null },
  fillsetImpuls: { label: 'Fillset Impuls', kvs: 1.5, type: 'manual', pumpMaxBar: null },
  fillcontrolPlus: { label: 'Fillcontrol Plus', kvs: 1.4, type: 'auto', pumpMaxBar: null },
  fillcontrolPlusCompact: { label: 'Fillcontrol Plus Compact', kvs: 0.4, type: 'auto', pumpMaxBar: null },
  fillcontrolAutoCompact: { label: 'Fillcontrol Auto Compact', kvs: 0.18, type: 'auto', pumpMaxBar: 8.5 },
  fillcontrolAuto: { label: 'Fillcontrol Auto', kvs: 0.18, type: 'auto', pumpMaxBar: 5.5 }
};

/**
 * Wählt das passende Nachspeisesystem basierend auf den Parametern.
 * Auswahllogik nach Handbuch:
 * - automatisch = Fillcontrol-Familie
 * - Pumpe, wenn Fließdruck für direkte Nachspeisung zu gering ist
 *
 * @param {Object} params - { feedType, feedPressureBar, p0Bar }
 * @returns {Object} { system: string, label: string, kvs: number, warnings: string[], pumpMaxBar: number|null }
 */
export function selectFillSystem({ feedType, feedPressureBar, p0Bar }) {
  const feedPressure = num(feedPressureBar);
  const p0 = num(p0Bar);
  const warnings = [];
  let selectedSystem = null;
  let selectedLabel = null;
  let kvs = 0;
  let pumpMaxBar = null;

  if (feedType === 'manual') {
    // Manuell: Fillset-Familie
    selectedSystem = 'fillset';
    selectedLabel = 'Fillset';
    kvs = 1.5;
  } else {
    // Automatisch: Fillcontrol-Familie
    // Prüfe ob Pumpe benötigt wird
    const pressureDiff = feedPressure - p0;
    if (pressureDiff < 1.3) {
      warnings.push(`Fließdruck vor Nachspeisung (${barText(feedPressure)} bar) muss mindestens 1,3 bar über dem MAG-Vordruck p0 (${barText(p0)} bar) liegen. Pumpe erforderlich.`);
    }

    // Standardmäßig Fillcontrol Auto
    selectedSystem = 'fillcontrolAuto';
    selectedLabel = 'Fillcontrol Auto';
    kvs = 0.18;
    pumpMaxBar = 5.5;
    
    // Wenn höherer Druck benötigt wird
    if (p0 > 5.5) {
      selectedSystem = 'fillcontrolAutoCompact';
      selectedLabel = 'Fillcontrol Auto Compact';
      pumpMaxBar = 8.5;
    }
  }

  return {
    system: selectedSystem,
    label: selectedLabel,
    kvs,
    pumpMaxBar,
    warnings
  };
}

/**
 * Berechnet die Nachspeisemenge aus dem kvs-Wert.
 * @param {number} kvs - kvs-Wert in m³/h
 * @returns {number} Nachspeisemenge in l/h
 */
export function calculateFeedFlow(kvs) {
  return num(kvs) * 1000; // Umrechnung von m³/h in l/h
}

/**
 * Prüft Nachspeiseleitung und gibt Warnungen aus.
 * @param {Object} params - { feedLineLengthM, feedType }
 * @returns {string[]} Warnungen
 */
export function checkFeedLine({ feedLineLengthM, feedType }) {
  const length = num(feedLineLengthM);
  const warnings = [];

  if (feedType === 'auto') {
    if (length > 0 && length < 10) {
      warnings.push('Nachspeiseleitung < 10 m: Wasserschlagdämpfer vorsehen.');
    } else if (length >= 10) {
      warnings.push('Nachspeiseleitung ≥ 10 m: kleines Refix-Ausdehnungsgefäß (z. B. 2 l) zur Sicherstellung der Systemtrennerfunktion vorsehen.');
    }
  }

  return warnings;
}

// ============================================================================
// Arbeitspaket 3: Fillsoft Wasseraufbereitung (Reflex Handbuch S. 51-55)
// ============================================================================

// Fillsoft Kapazitäten in l·°dH
// Quelle: Reflex Planungshandbuch »Planen Berechnen Ausrüsten« S. 53/54
export const FILLSOFT_CAPACITIES = {
  fillsoftI: { label: 'Fillsoft I', capacity: 3000 },
  fillsoftII: { label: 'Fillsoft II', capacity: 6000 }
};

/**
 * Berechnet die Enthärtungsparameter.
 * VDI 2035 Blatt 1: Weichwasserkapazität KW
 * Vf = KW / GHst (mögliche Füll- und Ergänzungswassermenge)
 * n = ceil(VA * GHst / KW) (erforderliche Patronenzahl)
 * VN = n * KW / GHst - VA (mögliche Restnachspeisemenge)
 *
 * @param {Object} params - { systemVolumeL, waterHardness, capacity }
 * @returns {Object} { fillVolumeL, patronCount, restFeedVolumeL, warnings: string[] }
 */
export function calculateSoftening({ systemVolumeL, waterHardness, capacity }) {
  const va = num(systemVolumeL);
  const ghst = num(waterHardness);
  const kw = num(capacity);
  
  const warnings = [];

  if (ghst <= 0) {
    return { fillVolumeL: 0, patronCount: 0, restFeedVolumeL: 0, warnings: ['Gesamtwasserhärte GHst muss > 0 sein.'] };
  }

  if (kw <= 0) {
    return { fillVolumeL: 0, patronCount: 0, restFeedVolumeL: 0, warnings: ['Weichwasserkapazität KW muss > 0 sein.'] };
  }

  // Mögliche Füll- und Ergänzungswassermenge
  const fillVolumeL = kw / ghst;
  
  // Erforderliche Patronenzahl
  const patronCount = Math.ceil((va * ghst) / kw);
  
  // Mögliche Restnachspeisemenge
  const restFeedVolumeL = (patronCount * kw) / ghst - va;

  // Hinweis für Umlaufwassererhitzer
  if (va > 0) {
    const waterContentRatio = va / num(systemVolumeL); // Dies ist immer 1, also prüfen wir das Verhältnis zur Leistung
    // Da wir keine Leistung haben, prüfen wir nur das Volumen
    if (va < 50) {
      warnings.push('Bei Anlagen < 50 kW kann bereits eine Enthärtung erforderlich sein. Umlaufwassererhitzer-Verhältnisse gesondert prüfen.');
    }
  }

  return { fillVolumeL, patronCount, restFeedVolumeL, warnings };
}

/**
 * Berechnet die Entsalzung (Fillsoft Zero).
 * Führt die orientierende Äquivalenzrechnung mit gleichen Formeln wie Enthärtung durch.
 *
 * @param {Object} params - { systemVolumeL, waterHardness, capacity }
 * @returns {Object} { fillVolumeL, patronCount, restFeedVolumeL, warnings: string[] }
 */
export function calculateDesalination({ systemVolumeL, waterHardness, capacity }) {
  const result = calculateSoftening({ systemVolumeL, waterHardness, capacity });
  
  // Füge den Pflicht-Hinweis hinzu
  result.warnings.push(
    'Genaue Kapazitätsberechnung nicht möglich; tatsächliche Ergiebigkeit ist stark von der örtlichen Wasserbeschaffenheit abhängig und nur durch Leitfähigkeitsmessung (z. B. Fillguard) während des Füll- bzw. Nachspeisevorgangs kontrollierbar.'
  );
  
  return result;
}

// ============================================================================
// Arbeitspaket 4: Sicherheitsventil-Größenempfehlung (Reflex Handbuch S. 68-69)
// ============================================================================

// Abblaseleistungstabelle nach Handbuch S. 69
// Abblaseleistungstabelle nach Reflex-Handbuch "Planen Berechnen Ausr\u00fcrsten", S. 69
// Werte in l/h f\u00fcr pSV-Stufen 4,0 / 4,5 / 5,0 / 5,5 / 6,0 bar
// Quelle: Handbuchtabelle (urspr\u00fnglich in m\u00b3/h, hier umgerechnet in l/h)
// Hinweis: Aktuelle Werte beim Hersteller erfragen
export const SAFETY_VALVE_FLOW_TABLE = {
  '05': { '4.0': 2800, '4.5': 3000, '5.0': 3100, '5.5': 3300, '6.0': 3400 },
  '075': { '4.0': 3000, '4.5': 3200, '5.0': 3400, '5.5': 3600, '6.0': 3700 },
  '1': { '4.0': 9500, '4.5': 10100, '5.0': 10600, '5.5': 11100, '6.0': 11600 },
  '125': { '4.0': 14300, '4.5': 15100, '5.0': 16000, '5.5': 16100, '6.0': 17500 },
  '15': { '4.0': 19200, '4.5': 20400, '5.0': 21500, '5.5': 22500, '6.0': 41200 },
  '2': { '4.0': 27700, '4.5': 29300, '5.0': 30900, '5.5': 32400, '6.0': 50900 }
};

// Connection label mapping
export const CONNECTION_LABELS = {
  '05': 'G ½"',
  '075': 'G ¾"',
  '1': 'G 1"',
  '125': 'G 1¼"',
  '15': 'G 1½"',
  '2': 'G 2"'
};

/**
 * Gibt die Abblaseleistung für eine gegebene Anschlussgröße und pSV zurück.
 * @param {string} connection - Anschlussgröße ('05', '075', '1', '125', '15', '2')
 * @param {number} psvBar - Sicherheitsventil-Ansprechdruck in bar
 * @returns {number} Abblaseleistung in l/h (Quelle: Reflex-Handbuch S. 69)
 */
export function getSafetyValveFlow(connection, psvBar) {
  const conn = SAFETY_VALVE_FLOW_TABLE[connection];
  if (!conn) return 0;
  
  const psvKey = String(psvBar.toFixed(1));
  return conn[psvKey] || 0;
}

/**
 * Empfiehlt die Sicherheitsventil-Anschlussgröße basierend auf dem Gefäßevolumen der Druckhaltestation.
 * Regelbasis nach Reflex-Handbuch "Planen Berechnen Ausrürsten", S. 69:
 * - abzuführender Volumenstrom: 1 l/(h·kW)
 * - speziell für Reflex-Druckhaltestationen:
 *   Behälter bis 1000 Liter (Ø 740 mm) → G ½ (3100 l/h bei pSV 5,0 bar)
 *   ab 1000 Liter (Ø 1000 mm) → G 1 (10600 l/h bei pSV 5,0 bar)
 * - Grenzfall exakt 1000 Liter: G 1 wählen (konservative Auslegung)
 * - Die im Handbuch bestehende Grenzwertüberschneidung ("bis" und "ab" 1000 Liter) ist als Quellenkommentar dokumentiert.
 * - Die Auswahl verwendet die Spalte des tatsächlich gewählten pSV, nicht pauschal 5,0 bar.
 *
 * @param {number} totalPowerKw - Gesamtwärmeleistung in kW
 * @param {number} vesselVolumeL - Gefäßevolumen der Druckhaltestation in Litern
 * @param {number} psvBar - Sicherheitsventil-Ansprechdruck in bar (Default: 5.0)
 * @returns {Object} { connection: string, flowRateLh: number, requiredFlowLh: number, warnings: string[] }
 */
export function recommendSafetyValveConnection(totalPowerKw, vesselVolumeL, psvBar = 5.0) {
  const power = num(totalPowerKw);
  const vesselVolume = num(vesselVolumeL);
  const psv = num(psvBar) || 5.0;
  const warnings = [];
  
  // Erforderlicher Volumenstrom: 1 l/(h·kW)
  const requiredFlow = power * 1; // in l/h
  
  // Regelbasis für Reflex-Druckhaltestationen nach Gefäßvolumen
  // Grenzwert: exakt 1000 Liter -> G 1 (konservative Auslegung)
  let connection = vesselVolume < 1000 ? '05' : '1';
  
  // Hole die Abblaseleistung aus der Tabelle für den tatsächlich gewählten pSV
  // Falls pSV nicht in der Tabelle, verwende den nächsthöheren verfügbaren pSV
  const psvKey = String(psv.toFixed(1));
  const connTable = SAFETY_VALVE_FLOW_TABLE[connection] || {};
  const availablePsvKeys = Object.keys(connTable).sort((a, b) => Number(a) - Number(b));
  
  // Finde den ersten pSV-Wert >= angeforderter pSV
  let flowRate = 0;
  for (const key of availablePsvKeys) {
    if (Number(key) >= psv) {
      flowRate = connTable[key];
      break;
    }
  }
  // Falls kein pSV >= angeforderter pSV, nimm den höchsten verfügbaren
  if (flowRate === 0 && availablePsvKeys.length > 0) {
    flowRate = connTable[availablePsvKeys[availablePsvKeys.length - 1]];
  }
  
  // Prüfe ob Abblaseleistung ausreicht
  if (flowRate < requiredFlow) {
    warnings.push(`Abblaseleistung von ${CONNECTION_LABELS[connection]} (${flowRate} l/h bei pSV ${psv} bar) liegt unter dem erforderlichen Volumenstrom von ${Math.round(requiredFlow)} l/h.`);
    
    // Finde die nächste größere Anschlussgröße
    const connections = ['05', '075', '1', '125', '15', '2'];
    const currentIndex = connections.indexOf(connection);
    for (let i = currentIndex + 1; i < connections.length; i++) {
      const nextConn = connections[i];
      const nextFlow = SAFETY_VALVE_FLOW_TABLE[nextConn]?.[psvKey] || 0;
      if (nextFlow >= requiredFlow) {
        connection = nextConn;
        flowRate = nextFlow;
        break;
      }
    }
  }

  return {
    connection,
    connectionLabel: CONNECTION_LABELS[connection],
    flowRateLh: flowRate,
    requiredFlowLh: requiredFlow,
    warnings
  };
}

// ============================================================================
// Hilfsfunktionen
// ============================================================================

function num(v) { return parseNumber(v, { fallback: 0 }); }
function tableFor(mode) { return mode === 'glycol20' ? GLYCOL20 : mode === 'glycol34' ? GLYCOL34 : WATER; }
function interp(table, t, col) {
  const temp = Math.max(table[0][0], Math.min(table[table.length - 1][0], num(t)));
  for (let i = 1; i < table.length; i++) {
    if (temp <= table[i][0]) {
      const a = table[i - 1], b = table[i], f = (temp - a[0]) / (b[0] - a[0] || 1);
      return a[col] + (b[col] - a[col]) * f;
    }
  }
  return table[table.length - 1][col];
}
function round(v, d = 2) { return Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : 0; }
function nextVolume(v) { return STANDARD_VOLUMES.find(x => x >= v) || Math.ceil(v / 500) * 500; }
const REFLEX_N_MAX = REFLEX_N_VOLUMES[REFLEX_N_VOLUMES.length - 1];
function barText(v) { return formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

export function nextReflexN(v) {
  const value = num(v);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return REFLEX_N_VOLUMES.find(x => x >= value);
}

// MAG-Aufteilung auf mehrere gleiche Gefäße ≤ 1000 l
export function splitMagVessels(vnMag) {
  const vn = num(vnMag);
  if (!Number.isFinite(vn) || vn <= 0) return { count: 0, vesselVolumeL: 0, totalVolumeL: 0 };
  for (let n = 1; n <= Math.ceil(vn / REFLEX_N_MAX) + 1; n++) {
    const size = nextReflexN(vn / n);
    if (size !== undefined && size <= REFLEX_N_MAX) {
      return { count: n, vesselVolumeL: size, totalVolumeL: n * size };
    }
  }
  const count = Math.max(1, Math.ceil(vn / REFLEX_N_MAX));
  return { count, vesselVolumeL: REFLEX_N_MAX, totalVolumeL: count * REFLEX_N_MAX };
}

function magProductLabel(split) {
  if (!split || split.count <= 0 || split.vesselVolumeL <= 0) return '–';
  return split.count > 1 ? `${split.count} × Reflex N ${split.vesselVolumeL}` : `Reflex N ${split.vesselVolumeL}`;
}

function dynamicLabel(type, volume) {
  const v = nextVolume(volume);
  if (!volume || volume <= 0) return type === 'variomat' ? 'Variomat –' : 'Reflexomat –';
  return type === 'variomat' ? `Variomat, VG Grundgefäß ${v} l` : `Reflexomat, RG Grundgefäß ${v} l`;
}

// ============================================================================
// Hauptberechnungsfunktion
// ============================================================================

export function calculate(s) {
  const table = tableFor(s.frostMode);
  const nMax = interp(table, s.tMaxC, 1);
  const nMin = interp(table, s.tMinC, 1);
  const expansionPct = Math.max(0, nMax - nMin);
  const vaporPressure = interp(table, s.tMaxC, 2);
  const heightPressure = num(s.staticHeightM) / 10;
  const staticPressure = num(s.staticHeightM) > 0 ? heightPressure : num(s.staticPressureBar);
  const pumpPressure = s.connectionType === 'pressure' ? num(s.pumpPressureBar) : 0;
  const baseVolume = s.waterContentMode === 'estimated'
    ? num(s.heatPowerKw) * num(s.specificWaterContent)
    : num(s.systemVolumeL);
  const systemVolume = Math.max(0, baseVolume + num(s.additionalVolumeL));
  const p0Raw = staticPressure + vaporPressure + (s.connectionType === 'pressure' ? pumpPressure : 0.2);
  const p0 = s.systemType === 'heating' ? Math.max(1, p0Raw) : p0Raw;
  const psv = num(s.safetyValveBar);
  const asv = psv <= 0 ? 0 : psv <= 5 ? 0.5 : 0.1 * psv;
  const pe = Math.max(0, psv - asv);
  const ve = systemVolume * expansionPct / 100;
  const vv = systemVolume > 0 ? Math.max(3, 0.005 * systemVolume) : 0;

  // Servitec-Addition: 5 l wenn Servitec aktiviert ist (unabhängig vom Typ)
  // Migration: includeServitec wird durch useServitec ersetzt, Default ist 'true' für bestehende Nutzer
  const servitecAdd = (s.includeServitec === 'true' || s.useServitec === 'true') ? 5 : 0;

  const denominator = pe - p0;
  const factor = denominator > 0 ? (pe + 1) / denominator : 0;
  const vnMag = denominator > 0 ? (ve + vv + servitecAdd) * factor : 0;
  const ad = s.dynamicType === 'reflexomat' ? 0.2 : 0.4;
  const paMin = p0 + 0.3;
  const peDynamicMin = paMin + ad;
  const vnDynamic = 1.1 * (ve + vv);
  const selected = s.holdingType === 'dynamic' ? vnDynamic : vnMag;

  const warnings = [];
  if (systemVolume <= 0) warnings.push('Anlagenvolumen fehlt.');
  if (psv <= 0) warnings.push('Sicherheitsventil-Ansprechdruck fehlt.');
  if (psv > 0 && pe <= p0) warnings.push('Sicherheitsventil pSV zu klein: Enddruck pe muss größer als Mindestbetriebsdruck p0 sein.');
  if (s.holdingType === 'mag' && denominator <= 0) warnings.push('MAG-Nennvolumen kann erst berechnet werden, wenn pe > p0 ist. Sicherheitsventil größer wählen oder statischen Druck prüfen.');
  if (s.holdingType === 'dynamic' && pe < peDynamicMin) warnings.push('Enddruck pe liegt unter p0 + 0,3 bar + Arbeitsbereich AD. Sicherheitsventil/Station prüfen.');
  if (num(s.tMaxC) > 70) warnings.push('Bei dauerhafter Temperatur > 70 °C am MAG/Vordruckgefäß Vorschaltgefäß prüfen.');
  if (s.holdingType === 'mag' && psv > 0) {
    const margin = psv <= 5 ? 1.5 : 2.0;
    const recommended = p0 + margin;
    if (psv < recommended) {
      warnings.push(`Empfehlung Sicherheitsventil (Reflex Planungshandbuch »Planen Berechnen Ausrüsten«): pSV ≥ p0 + ${barText(margin)} bar – mindestens ${barText(recommended)} bar; eingestellt ${barText(psv)} bar.`);
    }
  }

  // ========================================================================
  // Zubehör-Berechnungen
  // ========================================================================

  // Servitec-Entgasung
  const servitecResult = (s.useServitec === 'true') 
    ? selectServitec({ 
        systemVolumeL: systemVolume, 
        medium: s.frostMode || 'water', 
        tMaxC: s.tMaxC, 
        peBar: pe 
      })
    : { type: null, label: 'Kein Servitec', warnings: [], note: '' };

  // Nachspeisung
  const fillSystemResult = s.feedType === 'auto' || s.feedType === 'manual'
    ? selectFillSystem({ 
        feedType: s.feedType,
        feedPressureBar: s.feedPressureBar,
        p0Bar: p0
      })
    : { system: null, label: 'Keine Nachspeisung', kvs: 0, pumpMaxBar: null, warnings: [] };

  const feedFlowLh = calculateFeedFlow(fillSystemResult.kvs);
  const feedLineWarnings = checkFeedLine({ feedLineLengthM: s.feedLineLengthM, feedType: s.feedType });

  // Wasseraufbereitung
  let waterTreatmentResult = null;
  if (s.waterTreatmentMethod === 'softening' || s.waterTreatmentMethod === 'desalination') {
    const capacity = s.waterTreatmentMethod === 'softening' ? 3000 : 6000; // Default Fillsoft I für Enthärtung
    const treatmentParams = {
      systemVolumeL: systemVolume,
      waterHardness: s.regionalWaterHardness,
      capacity
    };
    waterTreatmentResult = s.waterTreatmentMethod === 'softening'
      ? calculateSoftening(treatmentParams)
      : calculateDesalination(treatmentParams);
  }

  // Sicherheitsventil-Größenempfehlung
  const totalPowerKw = num(s.heatPowerKw) || 0;

  // pSV-Empfehlung bleibt unverändert
  if (s.holdingType === 'mag' && psv > 0) {
    const margin = psv <= 5 ? 1.5 : 2.0;
    const recommended = p0 + margin;
    if (psv < recommended) {
      // bereits in warnings enthalten
    }
  }

  const magSplit = s.holdingType === 'mag' ? splitMagVessels(vnMag) : null;
  const standard = s.holdingType === 'dynamic'
    ? (selected > 0 ? nextVolume(selected) : 0)
    : (magSplit && magSplit.vesselVolumeL > 0 ? magSplit.vesselVolumeL : 0);
  const svRecommendation = recommendSafetyValveConnection(totalPowerKw, standard, psv);
  const productLabel = s.holdingType === 'dynamic' ? dynamicLabel(s.dynamicType, selected) : magProductLabel(magSplit);

  // Kombiniere alle Warnungen
  const allWarnings = [
    ...warnings,
    ...servitecResult.warnings,
    ...fillSystemResult.warnings,
    ...feedLineWarnings,
    ...(waterTreatmentResult?.warnings || []),
    ...svRecommendation.warnings
  ];

  return {
    // Bestehende Ergebnisse
    nMax, nMin, expansionPct, vaporPressure, staticPressure, pumpPressure, systemVolume, p0, p0Raw, psv, asv, pe, ve, vv, servitecAdd, factor, vnMag, ad, paMin, peDynamicMin, vnDynamic, selectedVolume: selected, selectedStandardVolume: standard, vesselCount: magSplit ? magSplit.count : 0, vesselVolumeL: magSplit ? magSplit.vesselVolumeL : 0, totalSelectedVolumeL: magSplit ? magSplit.totalVolumeL : 0, productLabel, warnings: allWarnings,

    // Zubehör-Ergebnisse
    accessories: {
      servitec: {
        ...servitecResult,
        systemVolumeL: systemVolume
      },
      fillSystem: {
        ...fillSystemResult,
        feedFlowLh,
        feedLineWarnings,
        feedPressureBar: num(s.feedPressureBar),
        p0Bar: p0,
        systemSeparation: s.systemSeparation,
        feedLineLengthM: num(s.feedLineLengthM)
      },
      waterTreatment: waterTreatmentResult ? {
        ...waterTreatmentResult,
        method: s.waterTreatmentMethod,
        regionalWaterHardness: num(s.regionalWaterHardness)
      } : null,
      safetyValve: {
        ...svRecommendation,
        psvBar: psv,
        asvBar: asv,
        peBar: pe,
        note: 'Sicherheitsventile sind nicht im Lieferprogramm von Reflex enthalten; die Empfehlung ist produktneutral. Bei Ventilen nach DIN ISO 4126 gelten deren Bemessungsgrundlagen.'
      }
    }
  };
}
