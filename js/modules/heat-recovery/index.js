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

function airOutputCard(title, point, accent = 'cyan') {
  return card(title, pointStats(point), accent);
}

function modeCard(s) {
  return card('Berechnungsart', segmented('mode', [
    { value: 'wrg', label: 'WRG' },
    { value: 'mixing', label: 'Mischluft' }
  ], s.mode, { accent: 'cyan' }), 'cyan', { compact: true });
}


function condensationCard(r) {
  if (!r.hasCondensation) return '';
  return mainResult('Kondensation', { label: 'Kondensationsleistung', value: fmt(r.condensateLs, 4), unit: 'l/s' }, [
    { label: 'Kondensat', value: fmt(r.condensateKgh, 2), unit: 'kg/h' },
    { label: 'Latente Leistung', value: fmt(r.condensationPowerKw, 2), unit: 'kW' },
    { label: 'Hinweis', value: '100%-Enthalpielinie überschritten', unit: '' }
  ], 'cyan');
}

function wrgFlowGrid(r, s) {
  return `<div class="wrg-flow-layout">
    <div class="wrg-flow-column">
      ${airInputCard('Außenluft', {
        volume: { id: 'outdoorVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.outdoorVolumeFlowM3h, 2) },
        temp: { id: 'outdoorTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.outdoorTemp, 2) },
        rh: { id: 'outdoorRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.outdoorRh, 2) }
      })}
      ${airOutputCard('Zuluft', r.supply)}
    </div>
    <div class="wrg-flow-column">
      ${airInputCard('Abluft', {
        volume: { id: 'extractVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.extractVolumeFlowM3h, 2) },
        temp: { id: 'extractTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.extractTemp, 2) },
        rh: { id: 'extractRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.extractRh, 2) }
      })}
      ${airOutputCard('Fortluft', r.exhaust)}
    </div>
  </div>`;
}

function mixingFlowGrid(r, s) {
  return `<div class="wrg-flow-layout">
    <div class="wrg-flow-column">
      ${airInputCard('Außenluft', {
        volume: { id: 'mixingOutdoorVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.mixingOutdoorVolumeFlowM3h, 2) },
        temp: { id: 'mixingOutdoorTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.mixingOutdoorTemp, 2) },
        rh: { id: 'mixingOutdoorRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.mixingOutdoorRh, 2) }
      })}
      ${airOutputCard('Mischluft / Zuluft', r.mixed)}
    </div>
    <div class="wrg-flow-column">
      ${airInputCard('Umluft / Raumluft', {
        volume: { id: 'mixingRecircVolumeFlowM3h', label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(s.mixingRecircVolumeFlowM3h, 2) },
        temp: { id: 'mixingRecircTemp', label: 'Temperatur', unit: '°C', value: fmtInput(s.mixingRecircTemp, 2) },
        rh: { id: 'mixingRecircRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.mixingRecircRh, 2) }
      })}
      ${card('Mischungsverhältnis', inlineStats([
        { label: 'Außenluftanteil', value: fmt(r.outdoorShare, 0), unit: '%' },
        { label: 'Umluftanteil', value: fmt(r.recircShare, 0), unit: '%' },
        { label: 'Gesamtvolumenstrom', value: fmt(r.mixed.volumeFlowM3h, 0), unit: 'm³/h' }
      ]), 'cyan')}
    </div>
  </div>`;
}

function wrgOutputs(r) {
  return stack([
    mainResult('WRG-Leistung', { label: 'Rückgewonnene Leistung', value: fmt(r.recoveredPowerKw, 2), unit: 'kW' }, [
      { label: 'Wirkungsgrad', value: fmt(r.efficiency, 0), unit: '%' },
      { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
    ], 'cyan'),
    condensationCard(r)
  ].join(''));
}

function mixingOutputs(r) {
  return condensationCard(r);
}

function view(s) {
  const r = calculate(s);
  const isMixing = s.mode === 'mixing';
  const formula = isMixing
    ? 'Mischluft: x und h aus Außenluft + Umluft über Massenstromanteile'
    : 'WRG: tZuluft = tAußen + ηWRG × (tAbluft − tAußen)';

  const body = isMixing
    ? stack([modeCard(s), mixingFlowGrid(r, s), `<div class="formula">${formula}</div>`, mixingOutputs(r)].join(''))
    : stack([modeCard(s), wrgFlowGrid(r, s), card('Wärmerückgewinnung', field({ id: 'efficiency', label: 'WRG-Wirkungsgrad', unit: '%', value: fmtInput(s.efficiency, 2) }), 'cyan'), `<div class="formula">${formula}</div>`, wrgOutputs(r)].join(''));

  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
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
