import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, resultRows, renderModuleShell, bindCommonInputs, stack, grid } from '../../core/renderer.js';
import { fmt } from '../../utils/calculations.js';

function view(s) {
  const r = calculate(s);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

  const inputColumn = stack([
    card('Betriebsart', segmented('mode', [
      { value: 'heating', label: '● Heizung' },
      { value: 'cooling', label: '● Kälte' }
    ], s.mode), accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, grid([
      field({ id: 'powerW', label: 'Leistung Q', unit: 'W', value: s.powerW }),
      field({ id: 'massFlowKgh', label: 'Massenstrom ṁ', unit: 'kg/h', value: s.massFlowKgh }),
      field({ id: 'deltaT', label: 'ΔT Temperatur', unit: 'K', value: s.deltaT })
    ].join(''), 2), accent),
    card('Ergebnis', resultRows([
      { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
      { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' },
      { label: 'Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' }
    ]), accent),
    `<div class="formula">Q = ṁ × cₚ × ΔT · cₚ Wasser = 1,163 Wh/(kg·K)</div>`
  ].join(''));

  const recommendation = r.pipe
    ? resultRows([
        { label: 'Empfohlene Dimension', value: 'DN ' + r.pipe.dn },
        { label: 'Geschwindigkeit', value: fmt(r.pipe.velocity), unit: 'm/s' },
        { label: 'Druckverlust', value: fmt(r.pipe.pressureLoss), unit: 'Pa/m' },
        { label: 'Norm', value: r.pipe.norm }
      ])
    : '<div class="empty-state">Massenstrom eingeben →<br>Rohrdimensionierung</div>';

  return renderModuleShell(config, `
    <div class="span-8">${inputColumn}</div>
    <div class="span-4">${card('Rohrdimensionsempfehlung', recommendation, 'blue')}</div>
  `);
}

export default {
  config,
  state,
  mount(root) {
    const render = () => {
      root.innerHTML = view(state.get());
      bindCommonInputs(root, state, render);
    };
    render();
  }
};
