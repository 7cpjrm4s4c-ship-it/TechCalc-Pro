import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { MEDIA, fmt } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { card, field, selectField, segmented, resultRows, renderModuleShell, bindCommonInputs, stack, grid } from '../../core/renderer.js';

function inputFields(s) {
  if (s.calcTarget === 'power') {
    return [
      field({ id: 'massFlowKgh', label: 'Massenstrom ṁ', unit: 'kg/h', value: s.massFlowKgh }),
      field({ id: 'deltaT', label: 'ΔT Temperatur', unit: 'K', value: s.deltaT })
    ];
  }
  if (s.calcTarget === 'massFlow') {
    return [
      field({ id: 'powerW', label: 'Leistung Q', unit: 'W', value: s.powerW }),
      field({ id: 'deltaT', label: 'ΔT Temperatur', unit: 'K', value: s.deltaT })
    ];
  }
  return [
    field({ id: 'powerW', label: 'Leistung Q', unit: 'W', value: s.powerW }),
    field({ id: 'massFlowKgh', label: 'Massenstrom ṁ', unit: 'kg/h', value: s.massFlowKgh })
  ];
}

function targetLabel(target) {
  return target === 'power' ? 'Leistung' : target === 'massFlow' ? 'Massenstrom' : 'Temperaturspreizung';
}

function view(s) {
  const r = calculate(s);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

  const mediumCard = card('Medium', grid([
    selectField({ id: 'mediumId', label: 'Wärmeträger', value: s.mediumId, options: MEDIA.map(m => ({ value: m.id, label: m.label })) }),
    resultRows([
      { label: 'Dichte ρ', value: fmt(r.medium.density, 0), unit: 'kg/m³' },
      { label: 'Wärmekapazität cₚ', value: fmt(r.medium.cpWhKgK, 3), unit: 'Wh/(kg·K)' }
    ])
  ].join(''), 2), 'blue');

  const inputColumn = stack([
    mediumCard,
    card('Betriebsart', segmented('mode', [
      { value: 'heating', label: '● Heizung' },
      { value: 'cooling', label: '● Kälte' }
    ], s.mode, { accent }), accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      segmented('calcTarget', [
        { value: 'power', label: 'Q Leistung' },
        { value: 'massFlow', label: 'ṁ Massenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], s.calcTarget, { accent }),
      grid(inputFields(s).join(''), 2)
    ].join('')), accent),
    card(`Ergebnis — ${targetLabel(s.calcTarget)}`, resultRows([
      { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
      { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' },
      { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h, 3), unit: 'm³/h' },
      { label: 'Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' },
      { label: 'Medium', value: r.medium.label }
    ]), accent),
    `<div class="formula">Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)</div>`
  ].join(''));

  const recommendation = stack([
    selectField({ id: 'pipeSystemId', label: 'Rohrmaterial', value: s.pipeSystemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    r.pipe
      ? resultRows([
          { label: 'Empfohlene Dimension', value: 'DN ' + r.pipe.dn },
          { label: 'Rohrmaterial', value: r.pipe.system.label },
          { label: 'Geschwindigkeit', value: fmt(r.pipe.velocity), unit: 'm/s' },
          { label: 'Druckverlust', value: fmt(r.pipe.pressureLoss), unit: 'Pa/m' },
          { label: 'Norm', value: r.pipe.norm }
        ])
      : '<div class="empty-state">Massenstrom berechnen oder eingeben →<br>Rohrdimensionierung</div>'
  ].join(''));

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
