import { fmt } from '../../utils/calculations.js';

export function pipeSizingPrimary(r = {}) {
  if (!r) return null;
  if (r.noDimension) {
    return {
      label: 'Empfohlene DN',
      value: '—',
      unit: ''
    };
  }
  return {
    label: 'Empfohlene DN',
    value: `DN ${r.dn}`,
    unit: ''
  };
}

export function pipeSizingDetailRows(r = {}) {
  if (!r || r.noDimension) return [];
  return [
    { label: 'Rohrsystem', value: r.system?.label || '—' },
    { label: 'Geschwindigkeit', value: fmt(r.velocity), unit: 'm/s' },
    { label: 'Druckverlust', value: fmt(r.pressureLoss), unit: 'Pa/m' },
    { label: 'Norm', value: r.norm || '—' }
  ];
}

export function pipeDimensionRows(r = {}) {
  if (!r || r.noDimension) return [];
  return [r.smaller, r, r.larger].filter(Boolean).map(item => {
    const isRecommended = item.dn === r.dn;
    const label = isRecommended ? 'Empfohlen' : (item.dn < r.dn ? 'Eine DN kleiner' : 'Eine DN größer');
    const dimension = item.dimension ? `Ø ${item.dimension} mm` : `di ${fmt(item.di, 1)} mm`;
    return {
      label: `${label} · DN ${item.dn}`,
      value: `${dimension} · v ${fmt(item.velocity)} m/s · Δp ${fmt(item.pressureLoss)} Pa/m`
    };
  });
}

export function buildPipeSizingResultModel(_s = {}, r = {}, accent = 'blue') {
  if (!r) {
    return {
      groups: [
        {
          title: 'Ergebnis Rohrdimensionierung',
          rows: [{ label: 'Status', value: 'Volumenstrom oder Massenstrom eingeben →' }],
          accent
        }
      ]
    };
  }

  if (r.noDimension) {
    return {
      primary: {
        title: 'Ergebnis Rohrdimensionierung',
        primary: pipeSizingPrimary(r),
        rows: [{ label: 'Status', value: 'Keine Dimensionierung möglich' }],
        accent
      }
    };
  }

  return {
    primary: {
      title: `Ergebnis — ${r.system?.label || 'Rohrsystem'}`,
      primary: pipeSizingPrimary(r),
      rows: pipeSizingDetailRows(r),
      accent
    },
    groups: [
      {
        title: 'Dimensionsvergleich',
        rows: pipeDimensionRows(r),
        accent
      }
    ]
  };
}

export default {
  pipeSizingPrimary,
  pipeSizingDetailRows,
  pipeDimensionRows,
  buildPipeSizingResultModel
};
