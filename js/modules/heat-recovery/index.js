import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function modeLabel(mode) {
  return mode === 'mixing' ? 'Mischluft' : 'WRG';
}

function loadLabel(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Nachheiz-/Kühllast';
  return Number(value) >= 0 ? 'Nachheizleistung' : 'Kühlleistung';
}

function inputCards(s) {
  const common = card('Berechnungsart', segmented('mode', [
    { value: 'wrg', label: 'WRG' },
    { value: 'mixing', label: 'Mischluft' }
  ], s.mode, { accent: 'cyan' }), 'cyan', { compact: true });

  if (s.mode === 'mixing') {
    return stack([
      common,
      card('Mischluft — Eingaben', stack([
        grid([
          field({ id: 'volumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.volumeFlowM3h, 2) }),
          field({ id: 'outdoorAirShare', label: 'Außenluftanteil', unit: '%', value: fmtInput(s.outdoorAirShare, 2) })
        ].join(''), 2),
        grid([
          field({ id: 'outdoorTemp', label: 'Außenluft', unit: '°C', value: fmtInput(s.outdoorTemp, 2) }),
          field({ id: 'roomTemp', label: 'Umluft / Raumluft', unit: '°C', value: fmtInput(s.roomTemp, 2) })
        ].join(''), 2),
        field({ id: 'targetSupplyTemp', label: 'Ziel-Zulufttemperatur', unit: '°C', value: fmtInput(s.targetSupplyTemp, 2) })
      ].join('')), 'cyan')
    ].join(''));
  }

  return stack([
    common,
    card('WRG — Eingaben', stack([
      grid([
        field({ id: 'volumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.volumeFlowM3h, 2) }),
        field({ id: 'efficiency', label: 'WRG-Wirkungsgrad', unit: '%', value: fmtInput(s.efficiency, 2) })
      ].join(''), 2),
      grid([
        field({ id: 'outdoorTemp', label: 'Außenluft', unit: '°C', value: fmtInput(s.outdoorTemp, 2) }),
        field({ id: 'extractTemp', label: 'Abluft', unit: '°C', value: fmtInput(s.extractTemp, 2) })
      ].join(''), 2),
      field({ id: 'targetSupplyTemp', label: 'Ziel-Zulufttemperatur', unit: '°C', value: fmtInput(s.targetSupplyTemp, 2) })
    ].join('')), 'cyan')
  ].join(''));
}

function outputCards(r) {
  if (r.mode === 'mixing') {
    const main = { label: 'Mischlufttemperatur', value: fmt(r.mixedTemp), unit: '°C' };
    const details = [
      { label: loadLabel(r.heatingCoolingLoadKw), value: fmt(Math.abs(r.heatingCoolingLoadKw ?? 0)), unit: 'kW' },
      { label: 'Außenluftanteil', value: fmt(r.outdoorAirShare, 0), unit: '%' },
      { label: 'Umluftanteil', value: fmt(r.recirculationShare, 0), unit: '%' },
      { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
    ];
    return stack([
      mainResult('Ergebnis — Mischluft', main, details, 'cyan'),
      card('Luftkennwerte', inlineStats([
        { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
        { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
        { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
      ]), 'cyan', { compact: true })
    ].join(''));
  }

  const main = { label: 'Zuluft nach WRG', value: fmt(r.supplyAfterWrg), unit: '°C' };
  const details = [
    { label: 'WRG-Leistung', value: fmt(r.recoveredPowerKw), unit: 'kW' },
    { label: loadLabel(r.remainingLoadKw), value: fmt(Math.abs(r.remainingLoadKw ?? 0)), unit: 'kW' },
    { label: 'Fortluft nach WRG', value: fmt(r.exhaustAfterWrg), unit: '°C' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
  ];
  return stack([
    mainResult('Ergebnis — WRG', main, details, 'cyan'),
    card('Luftkennwerte', inlineStats([
      { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
      { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
      { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
    ]), 'cyan', { compact: true })
  ].join(''));
}

function view(s) {
  const r = calculate(s);
  const formula = s.mode === 'mixing'
    ? 'tMisch = tAußen × Außenluftanteil + tRaum × Umluftanteil'
    : 'tZuluft,WRG = tAußen + ηWRG × (tAbluft − tAußen)';

  return renderModuleShell(config, `
    <div class="span-6">${stack([inputCards(s), `<div class="formula">${formula}</div>`].join(''))}</div>
    <div class="span-6">${outputCards(r)}</div>
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
