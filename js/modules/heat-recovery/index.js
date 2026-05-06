import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function pointStats(point) {
  return inlineStats([
    { label: 'Volumenstrom', value: fmt(point.volumeFlowM3h, 0), unit: 'm³/h' },
    { label: 'Temperatur', value: fmt(point.tempC, 2), unit: '°C' },
    { label: 'rel. Feuchte', value: fmt(point.rhPercent, 0), unit: '%' },
    { label: 'x', value: fmt(point.humidityRatioGkg, 2), unit: 'g/kg' }
  ]);
}

function airInputCard(title, fields, accent = 'cyan') {
  return card(title, stack([
    field(fields.volume),
    grid([
      field(fields.temp),
      field(fields.rh)
    ].join(''), 2)
  ].join('')), accent);
}

function modeCard(s) {
  return card('Berechnungsart', segmented('mode', [
    { value: 'wrg', label: 'WRG' },
    { value: 'mixing', label: 'Mischluft' }
  ], s.mode, { accent: 'cyan' }), 'cyan', { compact: true });
}

function wrgInputs(s) {
  return stack([
    modeCard(s),
    grid([
      airInputCard('Außenluft', {
        volume: { id: 'outdoorVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.outdoorVolumeFlowM3h, 2) },
        temp: { id: 'outdoorTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.outdoorTemp, 2) },
        rh: { id: 'outdoorRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.outdoorRh, 2) }
      }),
      airInputCard('Abluft', {
        volume: { id: 'extractVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.extractVolumeFlowM3h, 2) },
        temp: { id: 'extractTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.extractTemp, 2) },
        rh: { id: 'extractRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.extractRh, 2) }
      })
    ].join(''), 2),
    card('Wärmerückgewinnung', field({ id: 'efficiency', label: 'WRG-Wirkungsgrad', unit: '%', value: fmtInput(s.efficiency, 2) }), 'cyan')
  ].join(''));
}

function mixingInputs(s) {
  return stack([
    modeCard(s),
    grid([
      airInputCard('Außenluft', {
        volume: { id: 'mixingOutdoorVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.mixingOutdoorVolumeFlowM3h, 2) },
        temp: { id: 'mixingOutdoorTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.mixingOutdoorTemp, 2) },
        rh: { id: 'mixingOutdoorRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.mixingOutdoorRh, 2) }
      }),
      airInputCard('Umluft / Raumluft', {
        volume: { id: 'mixingRecircVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.mixingRecircVolumeFlowM3h, 2) },
        temp: { id: 'mixingRecircTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.mixingRecircTemp, 2) },
        rh: { id: 'mixingRecircRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.mixingRecircRh, 2) }
      })
    ].join(''), 2)
  ].join(''));
}

function wrgOutputs(r) {
  const condensation = r.hasCondensation
    ? mainResult('Kondensation', { label: 'Kondensationsleistung', value: fmt(r.condensationPowerKw, 2), unit: 'kW' }, [
        { label: 'Kondensat', value: fmt(r.condensateKgh, 2), unit: 'kg/h' },
        { label: 'Hinweis', value: '100%-Linie überschritten', unit: '' }
      ], 'cyan')
    : '';

  return stack([
    grid([
      card('Zuluft', pointStats(r.supply), 'cyan'),
      card('Fortluft', pointStats(r.exhaust), 'cyan')
    ].join(''), 2),
    mainResult('WRG-Leistung', { label: 'Rückgewonnene Leistung', value: fmt(r.recoveredPowerKw, 2), unit: 'kW' }, [
      { label: 'Wirkungsgrad', value: fmt(r.efficiency, 0), unit: '%' },
      { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
    ], 'cyan'),
    condensation
  ].join(''));
}

function mixingOutputs(r) {
  const condensation = r.hasCondensation
    ? mainResult('Kondensation', { label: 'Kondensationsleistung', value: fmt(r.condensationPowerKw, 2), unit: 'kW' }, [
        { label: 'Kondensat', value: fmt(r.condensateKgh, 2), unit: 'kg/h' },
        { label: 'Hinweis', value: '100%-Linie überschritten', unit: '' }
      ], 'cyan')
    : '';

  return stack([
    grid([
      card('Mischluft / Zuluft', pointStats(r.mixed), 'cyan'),
      card('Mischungsverhältnis', inlineStats([
        { label: 'Außenluftanteil', value: fmt(r.outdoorShare, 0), unit: '%' },
        { label: 'Umluftanteil', value: fmt(r.recircShare, 0), unit: '%' },
        { label: 'Gesamtvolumenstrom', value: fmt(r.mixed.volumeFlowM3h, 0), unit: 'm³/h' }
      ]), 'cyan')
    ].join(''), 2),
    condensation
  ].join(''));
}

function view(s) {
  const r = calculate(s);
  const isMixing = s.mode === 'mixing';
  const formula = isMixing
    ? 'Mischluft: x und h aus Außenluft + Umluft über Massenstromanteile'
    : 'WRG: tZuluft = tAußen + ηWRG × (tAbluft − tAußen)';

  return renderModuleShell(config, `
    <div class="span-6">${stack([isMixing ? mixingInputs(s) : wrgInputs(s), `<div class="formula">${formula}</div>`].join(''))}</div>
    <div class="span-6">${isMixing ? mixingOutputs(r) : wrgOutputs(r)}</div>
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
