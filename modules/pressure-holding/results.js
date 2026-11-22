import { formatNumber } from '../../core/engineering/numberService.js';

const fmt = (value, digits = 2) => formatNumber(value, { maximumFractionDigits: digits });

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
    value: r.vnMag > 0 ? fmt(r.vnMag, 1) : '—',
    unit: r.vnMag > 0 ? 'Liter' : ''
  };
}
export function pressureHoldingDetailRows(s = {}, r = {}) {
  const isMag = s.holdingType === 'mag';
  // MAG: Aufteilung auf mehrere gleiche Gefäße ≤ 1000 l (Reflex Planungshandbuch „Planen Berechnen Ausrüsten“)
  const selectionRows = isMag && r.vesselCount > 0
    ? [
        { label: 'Anzahl MAG', value: fmt(r.vesselCount, 0) },
        { label: 'Nennvolumen je Gefäß', value: fmt(r.vesselVolumeL, 0), unit: 'Liter' },
        { label: 'Gesamt-Nennvolumen der Auswahl', value: fmt(r.totalSelectedVolumeL, 0), unit: 'Liter' }
      ]
    : [{ label: 'Nächstes Normvolumen', value: r.selectedVolume > 0 ? fmt(r.selectedStandardVolume, 0) : '—', unit: 'Liter' }];
  return [
    { label: isMag ? 'Auswahl MAG' : 'Station / Gefäß', value: r.productLabel },
    ...selectionRows,
    { label: 'Mindestbetriebsdruck p₀', value: fmt(r.p0, 2), unit: 'bar' },
    { label: 'Anfangsdruck pₐ min.', value: fmt(r.paMin, 2), unit: 'bar' },
    { label: 'Enddruck pₑ', value: fmt(r.pe, 2), unit: 'bar' }
  ];
}
export function pressureHoldingIntermediateRows(r = {}) {
  return [
    { label: 'Ausdehnungskoeffizient n', value: fmt(r.expansionPct, 2), unit: '%' },
    { label: 'Verdampfungsdruck pD', value: fmt(r.vaporPressure, 2), unit: 'bar' },
    { label: 'statischer Druck pₛₜ verwendet', value: fmt(r.staticPressure, 2), unit: 'bar' },
    { label: 'Ausdehnungsvolumen Ve', value: fmt(r.ve, 1), unit: 'Liter' },
    { label: 'Wasservorlage VV', value: fmt(r.vv, 1), unit: 'Liter' },
    { label: 'Schließdruckdifferenz ASV', value: fmt(r.asv, 2), unit: 'bar' },
    { label: 'Volumenfaktor MAG', value: fmt(r.factor, 2) }
  ];
}
export function pressureHoldingFormulaRows(s = {}) {
  return [
    { label: 'Druckniveau', value: `p₀ = pₛₜ + pD ${s.connectionType === 'pressure' ? '+ Δpₚ' : '+ 0,2 bar'} · pe = pSV − ASV` },
    { label: 'Volumen', value: 'Ve = VA × n / 100 · VV = max(0,5 % × VA; 3 l)' },
    s.holdingType === 'mag'
      ? { label: 'MAG-Nennvolumen', value: `Vn = (Ve + VV${s.includeServitec === 'true' ? ' + 5 l' : ''}) × (pe + 1) / (pe − p₀)` }
      : { label: 'Dynamische Druckhaltung', value: 'Vn ≥ 1,1 × (Ve + VV) · pe ≥ p₀ + 0,3 bar + AD' },
    s.holdingType === 'mag'
      ? { label: 'MAG-Aufteilung', value: 'n = min { n ≥ 1 : nextReflexN(Vn/n) ≤ 1000 l } · je Gefäß nextReflexN(Vn/n) ≤ 1000 l (Reflex N)' }
      : null
  ].filter(Boolean);
}
export function buildPressureHoldingResultModel(s = {}, r = {}, accent = 'blue') {
  return {
    primary: {
      title: 'Ergebnis Druckhaltung',
      primary: pressureHoldingPrimary(s, r),
      rows: pressureHoldingDetailRows(s, r),
      accent
    },
    groups: [
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
    ],
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
  buildPressureHoldingResultModel
};
