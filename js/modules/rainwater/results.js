import { fmt } from '../../utils/calculations.js';

const modeLabel = value => ({ roof:'Dachfläche', property:'Grundstücksfläche' }[value] || value);
const drainLabel = mode => mode === 'property' ? 'Hoftöpfe' : 'Dacheinläufe';

function resultRowsForRainwater(s, r) {
  const mode = r.selectedSurface?.surfaceMode || r.mode || s.surfaceMode || 'roof';
  const isRoof = mode === 'roof';
  const selectedLabel = r.selectedSurface && !r.selectedSurface.transient ? r.selectedSurface.name : 'Aktuelle Eingabe';
  const rows = [
    { label:'Entwässerungsmenge', value:fmt(r.qr,2), unit:'l/s' },
    { label:'Ablaufdimension', value:r.drainSize || '—' },
    { label:'Abläufe', value:r.requiredDrains, unit:'Stk.' },
    { label:'Quelle', value:selectedLabel || 'Aktuelle Eingabe' }
  ];
  if (isRoof) rows.splice(1, 0, { label:'DN Fallleitung', value:r.stackSelection?.dn || '—' }, { label:'Notabfluss Qnot', value:fmt(r.qNot || 0,2), unit:'l/s' });
  rows.unshift({ label:'Bereich', value:modeLabel(mode) });
  return rows;
}

export function buildRainwaterResultModel(s, r) {
  const mode = r.selectedSurface?.surfaceMode || r.mode || s.surfaceMode || 'roof';
  const isRoof = mode === 'roof';
  return {
    primary: {
      title: 'Ergebnis Regenwasser',
      primary: {
        label: isRoof ? 'DN Fallleitung' : drainLabel(mode),
        value: isRoof ? (r.stackSelection?.dn || '—') : r.requiredDrains,
        unit: isRoof ? '' : 'Stk.'
      },
      rows: resultRowsForRainwater(s, r),
      accent: 'green'
    },
    notices: [{
      title: 'Normhinweise / Plausibilität',
      messages: [
        'Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.',
        ...(r.warnings || [])
      ],
      prefix: 'Hinweis',
      accent: 'green'
    }]
  };
}
