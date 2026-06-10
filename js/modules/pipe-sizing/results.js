import { fmt } from '../../utils/calculations.js';
import { esc } from '../../core/renderer.js';

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


export function pipeDimensionCardsHtml(r = {}) {
  if (!r || r.noDimension) return '';
  const list = [r.smaller, r, r.larger].filter(Boolean);
  const max = Number(r.maxPressurePam || 100);
  return `<div class="pipe-dimension-list">${list.map(item => {
    const ratio = max ? item.pressureLoss / max : 0;
    const percent = Math.max(0, Math.min(ratio * 100, 100));
    const key = item.rating?.key || (ratio < 0.75 ? 'green' : ratio <= 1 ? 'yellow' : 'red');
    const isRecommended = item.dn === r.dn;
    const label = isRecommended ? 'Empfohlen' : (item.dn < r.dn ? 'Eine DN kleiner' : 'Eine DN größer');
    const dimension = item.dimension ? `Ø ${item.dimension} mm` : `di ${fmt(item.di, 1)} mm`;
    return `<div class="pipe-dimension-card pipe-dimension-card--${esc(key)}${isRecommended ? ' is-recommended' : ''}">
      <div class="pipe-dimension-card__head"><span>${esc(label)}</span>${isRecommended ? '<small>★</small>' : ''}</div>
      <strong>DN ${esc(item.dn)}</strong>
      <div class="pipe-dimension-card__meta"><span>${esc(dimension)}</span><span>di ${esc(fmt(item.di, 1))} mm</span><span>${esc(fmt(item.velocity))} m/s</span><span>${esc(fmt(item.pressureLoss))} Pa/m</span></div>
      <div class="pipe-bar"><span style="width:${percent}%"></span></div>
    </div>`;
  }).join('')}</div>`;
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
        rows: [],
        html: pipeDimensionCardsHtml(r),
        accent
      }
    ]
  };
}

export default {
  pipeSizingPrimary,
  pipeSizingDetailRows,
  pipeDimensionRows,
  pipeDimensionCardsHtml,
  buildPipeSizingResultModel
};
