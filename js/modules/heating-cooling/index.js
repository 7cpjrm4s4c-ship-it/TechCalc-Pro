import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { MEDIA, fmt, fmtInput } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { card, field, selectField, segmented, resultRows, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';

function powerField(s) {
  return field({
    id: 'powerW',
    label: 'Leistung Q',
    unit: s.powerUnit || 'W',
    unitField: 'powerUnit',
    unitOptions: [
      { value: 'W', label: 'W' },
      { value: 'kW', label: 'kW' }
    ],
    value: fmtInput(s.powerW, 2)
  });
}

function inputFields(s) {
  if (s.calcTarget === 'power') {
    return [
      field({ id: 'massFlowKgh', label: 'Massenstrom ṁ', unit: 'kg/h', value: fmtInput(s.massFlowKgh, 2) }),
      field({ id: 'deltaT', label: 'ΔT Temperatur', unit: 'K', value: fmtInput(s.deltaT, 2) })
    ];
  }
  if (s.calcTarget === 'massFlow') {
    return [
      powerField(s),
      field({ id: 'deltaT', label: 'ΔT Temperatur', unit: 'K', value: fmtInput(s.deltaT, 2) })
    ];
  }
  return [
    powerField(s),
    field({ id: 'massFlowKgh', label: 'Massenstrom ṁ', unit: 'kg/h', value: fmtInput(s.massFlowKgh, 2) })
  ];
}

function targetLabel(target) {
  return target === 'power' ? 'Leistung' : target === 'massFlow' ? 'Massenstrom' : 'Temperaturspreizung';
}

function targetMain(target, r) {
  if (target === 'power') return { label: 'Berechnete Leistung', value: fmt(r.powerKw), unit: 'kW' };
  if (target === 'massFlow') return { label: 'Berechneter Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' };
  return { label: 'Berechnete Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' };
}

function mediumStats(medium) {
  const stats = [
    { label: 'Dichte ρ', value: fmt(medium.density, 0), unit: 'kg/m³' },
    { label: 'cₚ', value: fmt(medium.cpWhKgK, 3), unit: 'Wh/(kg·K)' }
  ];
  if (medium.frostC !== null && medium.frostC !== undefined) {
    stats.push({ label: 'Frostschutz', value: fmt(medium.frostC, 0), unit: '°C' });
  }
  return stats;
}

function view(s) {
  const r = calculate(s);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

  const mediumCard = card('Medium', stack([
    selectField({ id: 'mediumId', label: 'Wärmeträger', value: s.mediumId, options: MEDIA.map(m => ({ value: m.id, label: m.label })) }),
    inlineStats(mediumStats(r.medium))
  ].join('')), 'blue', { compact: true });

  const resultDetails = [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h, 3), unit: 'm³/h' },
    { label: 'ΔT', value: fmt(r.deltaT), unit: 'K' },
    { label: 'Medium', value: r.medium.label },
    { label: 'Dichte', value: fmt(r.medium.density, 0), unit: 'kg/m³' }
  ].filter(item => item.label !== targetLabel(s.calcTarget));

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
    mainResult(`Ergebnis — ${targetLabel(s.calcTarget)}`, targetMain(s.calcTarget, r), resultDetails, accent),
    `<div class="formula">Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)</div>`
  ].join(''));

  const recommendation = stack([
    selectField({ id: 'pipeSystemId', label: 'Rohrmaterial', value: s.pipeSystemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    r.pipe
      ? mainResult('', { label: 'Empfohlene Dimension', value: 'DN ' + r.pipe.dn }, [
          { label: 'Material', value: r.pipe.system.label },
          { label: 'Geschwindigkeit', value: fmt(r.pipe.velocity), unit: 'm/s' },
          { label: 'Druckverlust', value: fmt(r.pipe.pressureLoss), unit: 'Pa/m' },
          { label: 'Norm', value: r.pipe.norm }
        ], 'blue')
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
