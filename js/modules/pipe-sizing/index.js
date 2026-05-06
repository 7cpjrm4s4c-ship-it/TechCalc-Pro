import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, resultRows, renderModuleShell, bindCommonInputs, stack, grid, inlineStats } from '../../core/renderer.js';
import { fmt } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';

function pressureBadge(r) {
  if (!r?.rating) return '';
  return `<span class="traffic traffic--${r.rating.key}">${r.rating.label}</span>`;
}

function adjacentStats(r) {
  return inlineStats([
    { label: 'Eine DN kleiner', value: r.smaller ? `DN ${r.smaller.dn}` : '—', unit: r.smaller ? `${fmt(r.smaller.pressureLoss)} Pa/m` : '' },
    { label: 'Empfohlen', value: `DN ${r.dn}`, unit: `${fmt(r.pressureLoss)} Pa/m` },
    { label: 'Eine DN größer', value: r.larger ? `DN ${r.larger.dn}` : '—', unit: r.larger ? `${fmt(r.larger.pressureLoss)} Pa/m` : '' }
  ]);
}


function pipeDimensionCards(r) {
  if (!r) return '';
  const list = [r.smaller, r, r.larger].filter(Boolean);
  const max = Number(r.maxPressurePam || 100);
  return `<div class="pipe-dimension-list">${list.map(item => {
    const ratio = max ? item.pressureLoss / max : 0;
    const percent = Math.max(0, Math.min(ratio * 100, 100));
    const key = item.rating?.key || (ratio < .75 ? 'green' : ratio <= 1 ? 'yellow' : 'red');
    const isRecommended = item.dn === r.dn;
    const label = isRecommended ? 'Empfohlen' : (item.dn < r.dn ? 'Eine DN kleiner' : 'Eine DN größer');
    return `<div class="pipe-dimension-card pipe-dimension-card--${key}${isRecommended ? ' is-recommended' : ''}">
      <div class="pipe-dimension-card__head"><span>${label}</span>${isRecommended ? '<small>★</small>' : ''}</div>
      <strong>DN ${item.dn}</strong>
      <div class="pipe-dimension-card__meta"><span>di ${fmt(item.di, 1)} mm</span><span>${fmt(item.velocity)} m/s</span><span>${fmt(item.pressureLoss)} Pa/m</span></div>
      <div class="pipe-bar"><span style="width:${percent}%"></span></div>
    </div>`;
  }).join('')}</div>`;
}

function view(s) {
  const r = calculate(s);
  const inputCard = card('Basisdaten', stack([
    selectField({ id: 'systemId', label: 'Rohrsystem', value: s.systemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    field({ id: 'maxPressurePam', label: 'Max. Druckverlust', unit: 'Pa/m', value: s.maxPressurePam }),
    field({
      id: 'flowValue',
      label: 'Massenstrom / Volumenstrom',
      unit: s.flowUnit || 'kg/h',
      unitField: 'flowUnit',
      unitOptions: [
        { value: 'kg/h', label: 'kg/h' },
        { value: 'm³/h', label: 'm³/h' }
      ],
      value: s.flowValue || s.massFlowKgh || s.volumeFlowM3h || ''
    })
  ].join('')), 'blue');

  const outputCard = card(`Ergebnis — ${r?.system?.label ?? 'Rohrsystem'}`, r ? stack([
    `<div class="pipe-result-head"><span>Empfohlene DN</span><strong>DN ${r.dn}</strong>${pressureBadge(r)}</div>`,
    resultRows([
      { label: 'Geschwindigkeit', value: fmt(r.velocity), unit: 'm/s' },
      { label: 'Druckverlust', value: fmt(r.pressureLoss), unit: 'Pa/m' },
      { label: 'Norm', value: r.norm }
    ]),
    pipeDimensionCards(r)
  ].join('')) : '<div class="empty-state">Volumenstrom oder Massenstrom eingeben →</div>', 'blue');

  return renderModuleShell(config, `
    <div class="span-6">${inputCard}<div class="formula">≤ DN50: DIN EN 10255 · ≥ DN65: DIN EN 10220</div></div>
    <div class="span-6">${outputCard}<div class="formula">Auslegung nach Druckverlustgrenze</div></div>
  `);
}
export default {
  config,
  state,
  mount(root) {
    const render = () => {
      root.innerHTML = view(state.get());
      bindCommonInputs(root, state);
    };
    state.subscribe(render);
    render();
  }
};
