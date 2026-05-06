import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

const MODE_PREFIX = { heating: 'heating', cooling: 'cooling' };
function prefixFor(s) { return MODE_PREFIX[s.mode] || 'heating'; }
function key(s, name) { return `${prefixFor(s)}${name}`; }
function activeValue(s, name) { return s[key(s, name)]; }

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

function derivedDeltaT(active) {
  if (active.deltaT !== '' && active.deltaT !== null && active.deltaT !== undefined) return active.deltaT;
  const supply = Number(String(active.supplyTemp || '').replace(',', '.'));
  const room = Number(String(active.roomTemp || '').replace(',', '.'));
  if (Number.isFinite(supply) && Number.isFinite(room)) return Math.abs(supply - room);
  return '';
}

function inputFields(s, active) {
  const dtValue = derivedDeltaT(active);
  if (active.calcTarget === 'power') {
    return [
      field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) }),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(dtValue, 2) })
    ];
  }
  if (active.calcTarget === 'volumeFlow') {
    return [powerField(s), field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(dtValue, 2) })];
  }
  return [powerField(s), field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) })];
}

function targetLabel(target) { return target === 'power' ? 'Leistung' : target === 'volumeFlow' ? 'Volumenstrom' : 'Temperaturspreizung'; }
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
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
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
    `<div class="formula">Q = V̇ × (ρ × cₚ / 3,6) × ΔT / 1000 · Wärmewert = ${fmt(r.factor, 3)} Wh/(m³·K)</div>`
  ].join(''));

  const airStats = card('Luftkennwerte aktuell', inlineStats([
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
  ]), 'cyan', { compact: true });

  const outputColumn = stack([
    mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent),
    airStats
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${outputColumn}</div>
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
