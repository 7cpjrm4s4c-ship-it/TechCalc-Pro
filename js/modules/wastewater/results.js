import { fmt } from '../../utils/calculations.js';

export const lineTypeLabel = value => ({
  'single-unvented': 'Einzelanschluss unbelüftet',
  'single-vented': 'Einzelanschluss belüftet',
  'branch-unvented': 'Anschlussleitung unbelüftet',
  'branch-vented': 'Anschlussleitung belüftet',
  stack: 'Fallleitung',
  collector: 'Sammelleitung',
  'ground-inside': 'Grundleitung innen',
  'ground-outside': 'Grundleitung außen',
  'ground-full': 'Grundleitung außen',
  ventilation: 'Grundleitung außen'
}[value] || value);

const effectiveLineType = s => ['ground-full','ventilation'].includes(s.lineType) ? 'ground-outside' : s.lineType;
const fillApplies = lineType => ['collector','ground-inside','ground-outside','branch-vented'].includes(lineType);


export function results(s = {}, r = {}) {
  const lineType = effectiveLineType(s);
  return {
    primary: {
      title: 'Ergebnis / Dimensionierung Schmutzwasser',
      primary: { label:'Empfohlene Dimension', value:r.selected?.dn || '—' },
      rows: [
        { label:'Qww', value:fmt(r.qww || 0,2), unit:'l/s' },
        { label:'ΣDU', value:fmt(r.sumDu || 0,1), unit:'l/s' },
        { label:'K', value:fmt(r.k || 0,1) },
        { label:'Qtot', value:fmt(r.qtot || 0,2), unit:'l/s' }
      ]
    },
    groups: [{
      title: 'Dimensionierung und Berechnungsansatz',
      rows: [
        { label:'Leitungsart', value:lineTypeLabel(lineType) },
        { label:'Bemessungsgrundlage', value:r.dimensionBasis || '—' },
        { label:'Kapazität', value:r.selected?.capacity ? fmt(r.selected.capacity,1) : '—', unit:r.selected?.capacity ? 'l/s' : '' },
        { label:'Füllungsgrad', value:fillApplies(lineType) ? `h/di ${String(s.fillRatio || '').replace('.', ',')}` : '—' },
        { label:'angesetztes Gefälle', value:s.slopeCmM || '—', unit:s.slopeCmM ? 'cm/m' : '' },
        { label:'größter Einzel-DU', value:fmt(r.largestDu || 0,1), unit:'l/s' },
        { label:'Zusatzabflüsse', value:fmt((r.qc || 0) + (r.qp || 0) + (r.qra || 0),2), unit:'l/s' },
        { label:'Formel', value:'Qww = K × √ΣDU · Qtot = Qww + Qc + Qp + Qr,a' }
      ]
    }],
    notices: [{
      title: 'Normhinweise / Plausibilität',
      prefix: 'Hinweis',
      messages: (r.warnings || []).length ? r.warnings : ['Keine Plausibilitätswarnungen.']
    }]
  };
}
