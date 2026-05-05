import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, resultRows, renderModuleShell, bindCommonInputs, stack, grid } from '../../core/renderer.js';
import { fmt } from '../../utils/calculations.js';

function view(s) {
  const r = calculate(s);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';

  const inputs = stack([
    card('Temperaturen', grid([
      field({ id: 'supplyTemp', label: 'Zuluft Tzl', unit: '°C', value: s.supplyTemp }),
      field({ id: 'roomTemp', label: 'Raum Tr', unit: '°C', value: s.roomTemp })
    ].join(''), 2), accent),
    card('Betriebsart', segmented('mode', [
      { value: 'heating', label: '● Heizleistung' },
      { value: 'cooling', label: '● Kühlleistung' }
    ], s.mode), accent, { compact: true }),
    card('Eingaben', grid([
      field({ id: 'powerW', label: 'Leistung Q', unit: 'W', value: s.powerW }),
      field({ id: 'volumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: s.volumeFlowM3h }),
      field({ id: 'deltaT', label: 'ΔT optional', unit: 'K', value: s.deltaT })
    ].join(''), 2), accent)
  ].join(''));

  const outputs = stack([
    card('Ergebnis Luft', resultRows([
      { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
      { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' },
      { label: 'ΔT', value: fmt(r.deltaT), unit: 'K' },
      { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
    ]), 'cyan'),
    card('Luftkennwerte aktuell', resultRows([
      { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
      { label: 'cp,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
      { label: 'ρ × cp / 3600', value: fmt(r.factor, 4), unit: 'Wh/(m³·K)' }
    ]), 'green'),
    `<div class="formula">Q = V̇ × ρL(t) × cₚ,L × ΔT</div>`
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputs}</div>
    <div class="span-6">${outputs}</div>
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
