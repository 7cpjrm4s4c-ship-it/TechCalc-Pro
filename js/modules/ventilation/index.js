import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

const MODE_PREFIX = {
  heating: 'heating',
  cooling: 'cooling'
};

function prefixFor(s) {
  return MODE_PREFIX[s.mode] || 'heating';
}

function key(s, name) {
  return `${prefixFor(s)}${name}`;
}

function activeValue(s, name) {
  return s[key(s, name)];
}

function activeCalculationState(s) {
  return {
    mode: s.mode,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    volumeFlowM3h: activeValue(s, 'VolumeFlowM3h') || '',
    deltaT: activeValue(s, 'DeltaT') || '',
    supplyTemp: activeValue(s, 'SupplyTemp') || '',
    roomTemp: activeValue(s, 'RoomTemp') || ''
  };
}

function powerField(s) {
  const unit = activeValue(s, 'PowerUnit') || 'W';
  return field({
    id: key(s, 'PowerW'),
    label: 'Leistung Q',
    unit,
    unitField: key(s, 'PowerUnit'),
    unitOptions: [
      { value: 'W', label: 'W' },
      { value: 'kW', label: 'kW' }
    ],
    value: fmtInput(activeValue(s, 'PowerW'), 2)
  });
}

function inputFields(s, active) {
  if (active.calcTarget === 'power') {
    return [
      field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) }),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2), placeholder: 'auto' })
    ];
  }
  if (active.calcTarget === 'volumeFlow') {
    return [
      powerField(s),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2), placeholder: 'auto' })
    ];
  }
  return [
    powerField(s),
    field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) })
  ];
}

function targetLabel(target) {
  return target === 'power' ? 'Leistung' : target === 'volumeFlow' ? 'Volumenstrom' : 'Temperaturspreizung';
}

function targetMain(target, r) {
  if (target === 'power') return { label: 'Berechnete Luftleistung', value: fmt(r.powerKw), unit: 'kW' };
  if (target === 'volumeFlow') return { label: 'Berechneter Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' };
  return { label: 'Berechnete Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' };
}

function view(s) {
  const active = activeCalculationState(s);
  const r = calculate(active);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

  const resultDetails = [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' },
    { label: 'ΔT', value: fmt(r.deltaT), unit: 'K' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' },
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));

  const inputColumn = stack([
    card('Temperaturen', grid([
      field({ id: key(s, 'SupplyTemp'), label: 'Zuluft Tzl', unit: '°C', value: fmtInput(active.supplyTemp, 2) }),
      field({ id: key(s, 'RoomTemp'), label: 'Raum Tr', unit: '°C', value: fmtInput(active.roomTemp, 2) })
    ].join(''), 2), accent),
    card('Betriebsart', segmented('mode', [
      { value: 'heating', label: '● Heizleistung' },
      { value: 'cooling', label: '● Kühlleistung' }
    ], s.mode, { accent }), accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      segmented(key(s, 'CalcTarget'), [
        { value: 'power', label: 'Q Leistung' },
        { value: 'volumeFlow', label: 'V̇ Volumenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], active.calcTarget, { accent }),
      grid(inputFields(s, active).join(''), 2)
    ].join('')), accent),
    mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent),
    `<div class="formula">Q = V̇ × ρL(t) × cₚ,L × ΔT · ρL = ${fmt(r.rho, 3)} kg/m³ · cₚ,L = ${fmt(r.cp, 3)} kJ/(kg·K)</div>`
  ].join(''));

  const airStats = card('Luftkennwerte aktuell', inlineStats([
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3600', value: fmt(r.factor, 4), unit: 'Wh/(m³·K)' }
  ]), 'cyan', { compact: true });

  return renderModuleShell(config, `
    <div class="span-8">${inputColumn}</div>
    <div class="span-4">${airStats}</div>
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
