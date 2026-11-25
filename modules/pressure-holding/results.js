import { formatNumber } from '../../core/engineering/numberService.js';
import { CONNECTION_LABELS } from './logic.js';

const fmt = (value, digits = 2) => formatNumber(value, { maximumFractionDigits: digits });

// ============================================================================
// Bestehende Ergebnis-Funktionen (unchanged)
// ============================================================================

export function pressureHoldingPrimary(s = {}, r = {}) {
  if (s.holdingType === 'dynamic') {
    return {
      label: `Erforderliches Nennvolumen ${s.dynamicType === 'variomat' ? 'Variomat' : 'Reflexomat'}`,
      value: fmt(r.vnDynamic, 1),
      unit: 'Liter'
    };
  }
  return {
    label: 'Erforderliches MAG-Nennvolumen',
    value: r.vnMag > 0 ? fmt(r.vnMag, 1) : '–',
    unit: r.vnMag > 0 ? 'Liter' : ''
  };
}

export function pressureHoldingDetailRows(s = {}, r = {}) {
  const isMag = s.holdingType === 'mag';
  const selectionRows = isMag && r.vesselCount > 0
    ? [
        { label: 'Anzahl MAG', value: fmt(r.vesselCount, 0) },
        { label: 'Nennvolumen je Gefäß', value: fmt(r.vesselVolumeL, 0), unit: 'Liter' },
        { label: 'Gesamt-Nennvolumen der Auswahl', value: fmt(r.totalSelectedVolumeL, 0), unit: 'Liter' }
      ]
    : [{ label: 'Nächstes Normvolumen', value: r.selectedVolume > 0 ? fmt(r.selectedStandardVolume, 0) : '–', unit: 'Liter' }];
  return [
    { label: isMag ? 'Auswahl MAG' : 'Station / Gefäß', value: r.productLabel },
    ...selectionRows,
    { label: 'Mindestbetriebsdruck p₀', value: fmt(r.p0, 2), unit: 'bar' },
    { label: 'Anfangsdruck pₐ min.', value: fmt(r.paMin, 2), unit: 'bar' },
    { label: 'Enddruck p₁', value: fmt(r.pe, 2), unit: 'bar' }
  ];
}

export function pressureHoldingIntermediateRows(r = {}) {
  return [
    { label: 'Ausdehnungskoeffizient n', value: fmt(r.expansionPct, 2), unit: '%' },
    { label: 'Verdampfungsdruck pD', value: fmt(r.vaporPressure, 2), unit: 'bar' },
    { label: 'statischer Druck pₛ verwendet', value: fmt(r.staticPressure, 2), unit: 'bar' },
    { label: 'Ausdehnungsvolumen Ve', value: fmt(r.ve, 1), unit: 'Liter' },
    { label: 'Wasservorlage VV', value: fmt(r.vv, 1), unit: 'Liter' },
    { label: 'Schließdruckdifferenz ASV', value: fmt(r.asv, 2), unit: 'bar' },
    { label: 'Volumenfaktor MAG', value: fmt(r.factor, 2) }
  ];
}

export function pressureHoldingFormulaRows(s = {}) {
  return [
    { label: 'Druckniveau', value: `p₀ = pₛ + pD ${s.connectionType === 'pressure' ? '+ Δpₐ' : '+ 0,2 bar'} · pe = pSV − ASV` },
    { label: 'Volumen', value: 'Ve = VA × n / 100 · VV = max(0,5 % × VA; 3 l)' },
    s.holdingType === 'mag'
      ? { label: 'MAG-Nennvolumen', value: `Vn = (Ve + VV${(s.includeServitec === 'true' || s.useServitec === 'true') ? ' + 5 l' : ''}) × (pe + 1) / (pe − p₀)` }
      : { label: 'Dynamische Druckhaltung', value: 'Vn ≥ 1,1 × (Ve + VV) · pe ≥ p₀ + 0,3 bar + AD' },
    s.holdingType === 'mag'
      ? { label: 'MAG-Aufteilung', value: 'n = min { n ≥ 1 : nextReflexN(Vn/n) ≤ 1000 l } · je Gefäß nextReflexN(Vn/n) ≤ 1000 l (Reflex N)' }
      : null
  ].filter(Boolean);
}

// ============================================================================
// Arbeitspaket 1-4: Zubehör-Ergebnis-Funktionen
// ============================================================================

// Servitec-Entgasung Ergebnisse
export function servitecAccessoryRows(s = {}, r = {}) {
  const acc = r.accessories?.servitec || {};
  const rows = [];

  if (s.useServitec === 'true' && acc.type) {
    rows.push({ label: 'Servitec-Typ', value: acc.label || acc.type });
    rows.push({ label: 'betrachtetes Anlagenvolumen', value: fmt(acc.systemVolumeL, 0), unit: 'l' });
    
    if (acc.note) {
      rows.push({ label: 'Hinweis', value: acc.note, isNote: true });
    }
  }
  // No placeholder for inactive Servitec - remove completely as per Delta-Prompt

  return rows;
}

// Nachspeisung Ergebnisse
export function fillSystemAccessoryRows(s = {}, r = {}) {
  const acc = r.accessories?.fillSystem || {};
  const rows = [];

  if (acc.system) {
    rows.push({ label: 'Nachspeisesystem', value: acc.label });
    rows.push({ label: 'kvs-Wert', value: fmt(acc.kvs, 2), unit: 'm³/h' });
    rows.push({ label: 'Nachspeisemenge', value: fmt(acc.feedFlowLh, 0), unit: 'l/h' });
    
    if (acc.pumpMaxBar) {
      rows.push({ label: 'Pumpe max.', value: fmt(acc.pumpMaxBar, 1), unit: 'bar' });
    }
    
    if (acc.feedPressureBar > 0) {
      rows.push({ label: 'Fließdruck vor Nachspeisung', value: fmt(acc.feedPressureBar, 2), unit: 'bar' });
    }
    
    if (acc.p0Bar > 0) {
      const diff = acc.feedPressureBar - acc.p0Bar;
      rows.push({ label: 'Druckdifferenz zu p₀', value: fmt(diff, 2), unit: 'bar' });
      if (diff < 1.3) {
        rows.push({ label: 'Warnung', value: 'Fließdruck muss mindestens 1,3 bar über p₀ liegen', isWarning: true });
      }
    }
    
    if (acc.feedLineLengthM > 0) {
      rows.push({ label: 'Länge Nachspeiseleitung', value: fmt(acc.feedLineLengthM, 1), unit: 'm' });
      if (acc.feedLineWarnings && acc.feedLineWarnings.length > 0) {
        acc.feedLineWarnings.forEach(w => rows.push({ label: 'Hinweis', value: w, isNote: true }));
      }
    }
    
    if (acc.systemSeparation) {
      rows.push({ label: 'Systemtrennung', value: acc.systemSeparation === 'systemSeparator' ? 'DVGW-geprüfter Systemtrenner' : 'Netztrennbehälter' });
    }
  }
  // No placeholder for inactive fill system - remove completely as per Delta-Prompt

  return rows;
}

// Wasseraufbereitung Ergebnisse
export function waterTreatmentAccessoryRows(s = {}, r = {}) {
  const acc = r.accessories?.waterTreatment || {};
  const rows = [];

  if (acc.method) {
    rows.push({ label: 'Verfahren', value: acc.method === 'softening' ? 'Enthärtung (Kationentauscher)' : 'Entsalzung (Fillsoft Zero)' });
    
    if (acc.regionalWaterHardness > 0) {
      rows.push({ label: 'Gesamtwasserhärte GHst', value: fmt(acc.regionalWaterHardness, 1), unit: '°dH' });
    }
    
    if (acc.fillVolumeL > 0) {
      rows.push({ label: 'Füll- und Ergänzungswassermenge Vf', value: fmt(acc.fillVolumeL, 0), unit: 'l' });
    }
    
    if (acc.patronCount > 0) {
      rows.push({ label: 'erforderliche Patronenzahl n', value: fmt(acc.patronCount, 0) });
      rows.push({ label: 'Hinweis', value: 'Die berechnete Patronenzahl gilt für die vollständige Erstbefüllung der Anlage inklusive Nachspeise-Reserve (VN). Im Regelbetrieb ist nur der deutlich geringere Ergänzungswasserbedarf über die Patrone zu führen; die Anzahl bezeichnet den Patronenvorrat, nicht die gleichzeitig eingebauten Patronen.', isNote: true });
    }
    
    if (acc.restFeedVolumeL !== undefined) {
      rows.push({ label: 'Restnachspeisemenge VN', value: fmt(acc.restFeedVolumeL, 0), unit: 'l' });
    }
    
    // Pflicht-Hinweis für Entsalzung
    if (acc.method === 'desalination') {
      rows.push({ label: 'Hinweis', value: 'Genaue Kapazitätsberechnung nicht möglich; tatsächliche Ergiebigkeit ist stark von der örtlichen Wasserbeschaffenheit abhängig und nur durch Leitfähigkeitsmessung (z. B. Fillguard) kontrollierbar.', isNote: true });
    }
    
    // Warnungen
    if (acc.warnings && acc.warnings.length > 0) {
      acc.warnings.forEach(w => rows.push({ label: 'Hinweis', value: w, isNote: true }));
    }
  }
  // No placeholder for inactive water treatment - remove completely as per Delta-Prompt

  return rows;
}

// Sicherheitsventil Ergebnisse
export function safetyValveAccessoryRows(s = {}, r = {}) {
  const acc = r.accessories?.safetyValve || {};
  const rows = [];

  if (acc.connection) {
    rows.push({ label: 'empfohlene Anschlussgröße', value: acc.connectionLabel || CONNECTION_LABELS[acc.connection] || acc.connection });
    rows.push({ label: 'Abblaseleistung bei pSV', value: fmt(acc.flowRateLh, 0), unit: 'l/h' });
    
    if (acc.psvBar > 0) {
      rows.push({ label: 'Sicherheitsventil pSV', value: fmt(acc.psvBar, 2), unit: 'bar' });
      rows.push({ label: 'Enddruck pe', value: fmt(acc.peBar, 2), unit: 'bar' });
      rows.push({ label: 'Schließdruckdifferenz ASV', value: fmt(acc.asvBar, 2), unit: 'bar' });
    }
    
    if (acc.requiredFlowLh > 0 && acc.flowRateLh > 0) {
      const margin = acc.flowRateLh - acc.requiredFlowLh;
      if (margin < 0) {
        rows.push({ label: 'Warnung', value: `Abblaseleistung (${fmt(acc.flowRateLh, 0)} l/h) unter dem erforderlichen Volumenstrom (${fmt(acc.requiredFlowLh, 0)} l/h)`, isWarning: true });
      } else {
        rows.push({ label: 'Reserve', value: fmt(margin, 0), unit: 'l/h' });
      }
    }
  } else {
    // No placeholder for inactive safety valve - remove completely as per Delta-Prompt
    return rows;
  }

  // Pflichthinweis
  rows.push({ label: 'Hinweis', value: 'Sicherheitsventile sind nicht im Lieferprogramm von Reflex enthalten; die Empfehlung ist produktneutral. Bei Ventilen nach DIN ISO 4126 gelten deren Bemessungsgrundlagen.', isNote: true });

  return rows;
}

// ============================================================================
// Hauptfunktion zum Aufbau des Ergebnis-Modells
// ============================================================================

export function buildPressureHoldingResultModel(s = {}, r = {}, accent = 'blue') {
  // Bestehende Ergebnisgruppen
  const existingGroups = [
    {
      title: 'Zwischenergebnisse',
      rows: pressureHoldingIntermediateRows(r),
      accent
    },
    {
      title: 'Formeln',
      rows: pressureHoldingFormulaRows(s),
      accent
    }
  ];

  // Zubehör-Ergebnisgruppen (nur wenn Zubehör aktiviert/konfiguriert ist)
  const accessoriesGroups = [];
  
  // Servitec-Entgasung
  if (s.useServitec === 'true' || r.accessories?.servitec?.type) {
    accessoriesGroups.push({
      title: 'Entgasung (Servitec)',
      rows: servitecAccessoryRows(s, r),
      accent
    });
  }

  // Nachspeisung
  if (s.feedType === 'manual' || s.feedType === 'auto' || r.accessories?.fillSystem?.system) {
    accessoriesGroups.push({
      title: 'Nachspeisung',
      rows: fillSystemAccessoryRows(s, r),
      accent
    });
  }

  // Wasseraufbereitung
  if (s.waterTreatmentMethod === 'softening' || s.waterTreatmentMethod === 'desalination' || r.accessories?.waterTreatment) {
    accessoriesGroups.push({
      title: 'Wasseraufbereitung (Fillsoft)',
      rows: waterTreatmentAccessoryRows(s, r),
      accent
    });
  }

  // Sicherheitsventil
  if (r.accessories?.safetyValve) {
    accessoriesGroups.push({
      title: 'Sicherheitsventil-Empfehlung',
      rows: safetyValveAccessoryRows(s, r),
      accent
    });
  }

  // Kombiniere alle Gruppen
  const allGroups = [...existingGroups];
  
  // Flache Gruppen statt verschachtelter Struktur (Befund 2)
  if (accessoriesGroups.length > 0) {
    accessoriesGroups.forEach(group => {
      // Präfix "Zubehör – " zu jedem Untergruppen-Titel
      allGroups.push({
        ...group,
        title: `Zubehör – ${group.title}`
      });
    });
  }

  return {
    primary: {
      title: 'Ergebnis Druckhaltung',
      primary: pressureHoldingPrimary(s, r),
      rows: pressureHoldingDetailRows(s, r),
      accent
    },
    groups: allGroups,
    notices: [
      {
        title: 'Plausibilität',
        messages: Array.isArray(r.warnings) ? r.warnings : [],
        accent,
        emptyText: 'Keine Plausibilitätswarnungen.'
      }
    ]
  };
}

export default {
  pressureHoldingPrimary,
  pressureHoldingDetailRows,
  pressureHoldingIntermediateRows,
  pressureHoldingFormulaRows,
  servitecAccessoryRows,
  fillSystemAccessoryRows,
  waterTreatmentAccessoryRows,
  safetyValveAccessoryRows,
  buildPressureHoldingResultModel
};
