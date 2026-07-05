import { card, field, segmented, renderModuleShell, stack, grid } from '../../core/renderer.js';
import { fmtInput } from '../../utils/calculations.js';
import { renderResultGroup, renderResultModel } from '../../platform/resultRenderer/index.js';
import { airStatsRows, buildVentilationResultModel } from './results.js';
import {
  activeCalculationState,
  activeValue,
  derivedDeltaT,
  key,
  ventilationAccent,
  ventilationFormulaText,
  ventilationModeLabel
} from './viewModel.js';

export function powerField(s) {
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

export function derivedDeltaTField(s, active) {
  return field({
    id: key(s, 'DeltaT'),
    label: 'ΔT Temperatur',
    unit: 'K',
    value: fmtInput(derivedDeltaT(active), 2),
    readonly: true
  });
}

export function inputFields(s, active) {
  if (active.calcTarget === 'power') {
    return [
      field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) }),
      derivedDeltaTField(s, active)
    ];
  }
  if (active.calcTarget === 'volumeFlow') {
    return [powerField(s), derivedDeltaTField(s, active)];
  }
  return [powerField(s), field({ id: key(s, 'VolumeFlowM3h'), label: 'Volumenstrom V̇', unit: 'm³/h', value: fmtInput(active.volumeFlowM3h, 2) })];
}

export function temperatureFields(s, active) {
  return grid([
    field({ id: key(s, 'SupplyTemp'), label: 'Zuluft Tzl', unit: '°C', value: fmtInput(active.supplyTemp, 2) }),
    field({ id: key(s, 'RoomTemp'), label: 'Raum Tr', unit: '°C', value: fmtInput(active.roomTemp, 2) })
  ].join(''), 2);
}

export function renderModeSegment(s, accent) {
  return segmented('mode', [
    { value: 'heating', label: '● Heizleistung' },
    { value: 'cooling', label: '● Kühlleistung' }
  ], s.mode, { accent });
}

export function renderTargetSegment(s, active, accent) {
  return segmented(key(s, 'CalcTarget'), [
    { value: 'power', label: 'Q Leistung' },
    { value: 'volumeFlow', label: 'V̇ Volumenstrom' },
    { value: 'deltaT', label: 'ΔT Temperatur' }
  ], active.calcTarget, { accent });
}

export function renderVentilationResult(_s, r, active, accent) {
  return renderResultModel(buildVentilationResultModel(active, r, accent), accent);
}

export function renderAirStats(r) {
  return renderResultGroup({
    title: 'Luftkennwerte aktuell',
    rows: airStatsRows(r),
    accent: 'cyan'
  });
}

export function createVentilationView(config, calculate, lineSectionController) {
  return function view(s) {
    const active = activeCalculationState(s);
    const r = calculate(active);
    const accent = ventilationAccent(s);
    const modeLabel = ventilationModeLabel(s);

    const inputColumn = stack([
      card('Temperaturen', `<div data-vent-dynamic="temperatures">${temperatureFields(s, active)}</div>`, accent),
      card('Betriebsart', `<div data-vent-dynamic="mode-segment">${renderModeSegment(s, accent)}</div>`, accent, { compact: true }),
      card(`${modeLabel} — Eingaben`, stack([
        `<div data-vent-dynamic="target-segment">${renderTargetSegment(s, active, accent)}</div>`,
        `<div data-vent-dynamic="input-fields">${grid(inputFields(s, active).join(''), 2)}</div>`
      ].join('')), accent),
      `<div class="formula" data-vent-dynamic="formula">${ventilationFormulaText(r)}</div>`
    ].join(''));

    const outputColumn = stack([
      `<div data-vent-dynamic="result">${renderVentilationResult(s, r, active, accent)}</div>`,
      `<div data-vent-dynamic="air-stats">${renderAirStats(r)}</div>`,
      lineSectionController.renderCard(s)
    ].join(''));

    return renderModuleShell(config, `
      <div class="span-6">${inputColumn}</div>
      <div class="span-6">${outputColumn}</div>
    `);
  };
}
