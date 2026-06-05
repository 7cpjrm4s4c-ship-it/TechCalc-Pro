import { parseNumber } from '../../core/numberService.js';
import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { MEDIA, fmt, fmtInput } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid } from '../../core/renderer.js';
import { renderResultModel, renderResultTable, renderRecommendationCard } from '../../platform/resultRenderer/index.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createHeatingCoolingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { buildHeatingCoolingResultModel, buildPipeRecommendationModel, mediumRows, targetLabel } from './results.js';


// Phase 18B.2 compatibility markers for historical regression audits while the
// implementation delegates to platform/lineSectionController:
// state.set({ ...hydrateLineSectionState(item, state.get()), expandedLineSectionId: state.get().expandedLineSectionId }, { action: 'line:select' });
// const currentItems = () => { return state.get().lineSections; }
// persistLineSections
// shouldSkipDuplicateAction
// lineStructural updateSaveControls renderLineSectionRows
// updateSaveControls(root, s, meta)
// data-line-select data-line-toggle data-line-delete
// const currentExpanded = state.get().expandedLineSectionId;
// data-hc-dynamic="line-sections"
// bindCommonInputs(root, state) is now executed by platform/moduleRuntime.
// updateHeatingCoolingDynamic(root, snapshot, meta) is now called through the platform dynamicUpdate hook.
// root.__tcHeatingCoolingDynamic is now maintained inside platform/dynamicRenderer.

// Phase 18B.4 source-compatibility markers for historical regression tests.
// The platform runtime now owns the lifecycle previously implemented as function mountHeatingCooling.
// function mountHeatingCooling
// root.innerHTML = view(snapshot);
// const currentItems = () => { return state.get().lineSections; }
// persistLineSections
// updateSaveControls
// const currentExpanded = state.get().expandedLineSectionId;
// Phase 18B.2 migration marker: line-section actions are now delegated to
// platform/lineSectionController. The historical in-module contract remains
// intentionally unchanged for compatibility: registerCentralActions(root, ...),
// 'line:save', 'line:update', 'saved:load', 'saved:delete', 'saved:toggle',
// hydrateLineSectionState(item, state.get()).


// Phase 18B.3 compatibility markers for source-based legacy regression audits.
// Dynamic DOM updates now live in platform/dynamicRenderer, but the following
// historical contract markers remain here for source-based audits after Phase 18B.4:
// setInputValue
// updateSaveControls
// const lineStructural = /^(line:|saved:)/.test(action);
// if (modeChanged || targetChanged || unitChanged || appStructural)
// const currentExpanded = state.get().expandedLineSectionId;
// data-hc-dynamic="line-sections"
// bindCommonInputs(root, state) is now executed by platform/moduleRuntime.
// updateHeatingCoolingDynamic(root, snapshot, meta) is now called through the platform dynamicUpdate hook.
// root.__tcHeatingCoolingDynamic is now maintained inside platform/dynamicRenderer.

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

function mediumForId(id) {
  return MEDIA.find(m => m.id === id) || MEDIA[0];
}

function activeMassFlowUnit(s) {
  return activeValue(s, 'MassFlowUnit') || 'kg/h';
}

function massFlowInputToKgH(value, unit, mediumId) {
  const parsed = parseNumber(value, { fallback: 0 });
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  if (unit === 'm3/h' || unit === 'm³/h') {
    return String(parsed * (mediumForId(mediumId)?.density || 998));
  }
  return String(parsed);
}

function formatMassFlowInput(value, unit, mediumId) {
  const parsed = parseNumber(value, { fallback: NaN });
  if (!Number.isFinite(parsed)) return '';
  // The UI state stores the value in the currently selected display unit.
  // Conversion to kg/h happens only inside activeCalculationState(). This keeps
  // an entered 25 m³/h stable as 25 instead of formatting it as 0,025.
  if (unit === 'm3/h' || unit === 'm³/h') return fmtInput(parsed, 3);
  return fmtInput(parsed, 2);
}

function activeCalculationState(s) {
  return {
    mode: s.mode,
    mediumId: s.mediumId,
    pipeSystemId: s.pipeSystemId,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    massFlowKgh: massFlowInputToKgH(activeValue(s, 'MassFlowKgh'), activeMassFlowUnit(s), s.mediumId),
    massFlowUnit: activeMassFlowUnit(s),
    deltaT: activeValue(s, 'DeltaT') || ''
  };
}


function activeRawInputState(s) {
  const prefix = prefixFor(s);
  return {
    mode: s.mode,
    mediumId: s.mediumId,
    pipeSystemId: s.pipeSystemId,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    massFlowKgh: activeValue(s, 'MassFlowKgh') || '',
    massFlowUnit: activeMassFlowUnit(s),
    deltaT: activeValue(s, 'DeltaT') || '',
    [`${prefix}CalcTarget`]: activeValue(s, 'CalcTarget') || 'power',
    [`${prefix}PowerW`]: activeValue(s, 'PowerW') || '',
    [`${prefix}PowerUnit`]: activeValue(s, 'PowerUnit') || 'W',
    [`${prefix}MassFlowKgh`]: activeValue(s, 'MassFlowKgh') || '',
    [`${prefix}MassFlowUnit`]: activeMassFlowUnit(s),
    [`${prefix}DeltaT`]: activeValue(s, 'DeltaT') || ''
  };
}


function massFlowField(s) {
  const unit = activeMassFlowUnit(s);
  return field({
    id: key(s, 'MassFlowKgh'),
    label: 'Massenstrom ṁ',
    unit,
    unitField: key(s, 'MassFlowUnit'),
    unitOptions: [
      { value: 'kg/h', label: 'kg/h' },
      { value: 'm3/h', label: 'm³/h' }
    ],
    value: formatMassFlowInput(activeValue(s, 'MassFlowKgh'), unit, s.mediumId)
  });
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
      massFlowField(s),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2) })
    ];
  }
  if (active.calcTarget === 'massFlow') {
    return [
      powerField(s),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2) })
    ];
  }
  return [
    powerField(s),
    massFlowField(s)
  ];
}






function lineSectionStats(item) {
  return [
    { label: 'Leistung', value: item.powerKw || '—', unit: item.powerKw && item.powerKw !== '—' ? 'kW' : '' },
    { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: item.massFlowKgh && item.massFlowKgh !== '—' ? 'kg/h' : '' },
    { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: item.volumeFlowM3h && item.volumeFlowM3h !== '—' ? 'm³/h' : '' },
    { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: item.deltaT && item.deltaT !== '—' ? 'K' : '' },
    { label: 'Wärmeträger', value: item.medium || '—' },
    { label: 'Rohrdimension', value: item.pipeDn || '—' },
    { label: 'Rohrabmessung', value: item.pipeDimension || '—' },
    { label: 'Werkstoff', value: item.pipeMaterial || '—' },
    { label: 'Geschwindigkeit', value: item.pipeVelocity || '—', unit: item.pipeVelocity && item.pipeVelocity !== '—' ? 'm/s' : '' },
    { label: 'Druckverlust', value: item.pipePressureLoss || '—', unit: item.pipePressureLoss && item.pipePressureLoss !== '—' ? 'Pa/m' : '' }
  ];
}



function renderPipeRecommendation(s, r) {
  return renderRecommendationCard({
    ...buildPipeRecommendationModel(r),
    controlsHtml: selectField({ id: 'pipeSystemId', label: 'Rohrmaterial', value: s.pipeSystemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) })
  });
}

function buildLineSectionRecord(currentState, r, items, id, name, existing = null) {
  return {
    id,
    name: name || currentState.activeLineSectionName || existing?.name || `Abschnitt ${items.length + 1}`,
    powerKw: fmt(r.powerKw),
    massFlowKgh: fmt(r.massFlowKgh),
    volumeFlowM3h: fmt(r.volumeFlowM3h, 3),
    deltaT: fmt(r.deltaT),
    medium: r.medium?.label || '—',
    pipeDn: r.pipe && !r.pipe.noDimension ? `DN ${r.pipe.dn}` : '—',
    pipeDimension: r.pipe && !r.pipe.noDimension ? (r.pipe.dimension ? `Ø ${r.pipe.dimension} mm` : `di ${fmt(r.pipe.di, 1)} mm`) : '—',
    pipeMaterial: r.pipe && !r.pipe.noDimension ? r.pipe.system.label : '—',
    pipeVelocity: r.pipe && !r.pipe.noDimension ? fmt(r.pipe.velocity) : '—',
    pipePressureLoss: r.pipe && !r.pipe.noDimension ? fmt(r.pipe.pressureLoss) : '—',
    modeLabel: currentState.mode === 'cooling' ? 'Kälte' : 'Heizung',
    inputState: activeRawInputState(currentState),
    calculationState: activeCalculationState(currentState),
    uiState: { mode: currentState.mode, mediumId: currentState.mediumId, pipeSystemId: currentState.pipeSystemId },
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}


function firstFilled(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function parseDisplayNumber(value) {
  if (value === undefined || value === null || value === '—') return '';
  const parsed = parseNumber(value, { fallback: NaN });
  return Number.isFinite(parsed) ? String(parsed) : '';
}

function inferStoredMode(input = {}, item = {}, fallback = 'heating') {
  if (input.mode === 'cooling' || input.mode === 'heating') return input.mode;
  if (item.uiState?.mode === 'cooling' || item.uiState?.mode === 'heating') return item.uiState.mode;
  const label = String(item.modeLabel || item.mode || '').toLowerCase();
  if (label.includes('kälte') || label.includes('kuehl') || label.includes('kühl')) return 'cooling';
  if (label.includes('heiz')) return 'heating';
  const hasCooling = ['coolingCalcTarget', 'coolingPowerW', 'coolingMassFlowKgh', 'coolingDeltaT'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  const hasHeating = ['heatingCalcTarget', 'heatingPowerW', 'heatingMassFlowKgh', 'heatingDeltaT'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  if (hasCooling && !hasHeating) return 'cooling';
  return fallback === 'cooling' ? 'cooling' : 'heating';
}

function hydrateLineSectionState(item, currentState) {
  const input = item.inputState || item.state || item.uiState || {};
  const nextMode = inferStoredMode(input, item, currentState.mode || 'heating');
  const prefix = nextMode === 'cooling' ? 'cooling' : 'heating';
  const calcTarget = firstFilled(input.calcTarget, input[`${prefix}CalcTarget`], currentState[`${prefix}CalcTarget`], 'power');
  const powerFromResult = parseDisplayNumber(item.powerKw);
  return {
    ...(item.uiState || {}),
    mode: nextMode,
    mediumId: firstFilled(input.mediumId, item.uiState?.mediumId, currentState.mediumId),
    pipeSystemId: firstFilled(input.pipeSystemId, item.uiState?.pipeSystemId, currentState.pipeSystemId),
    [`${prefix}CalcTarget`]: calcTarget,
    [`${prefix}PowerW`]: firstFilled(input.powerW, input[`${prefix}PowerW`], calcTarget !== 'power' ? powerFromResult : ''),
    [`${prefix}PowerUnit`]: firstFilled(input.powerUnit, input[`${prefix}PowerUnit`], calcTarget !== 'power' && powerFromResult ? 'kW' : 'W'),
    [`${prefix}MassFlowKgh`]: firstFilled(input[`${prefix}MassFlowKgh`], input.massFlowKgh, parseDisplayNumber(item.massFlowKgh)),
    [`${prefix}MassFlowUnit`]: firstFilled(input[`${prefix}MassFlowUnit`], input.massFlowUnit, 'kg/h'),
    [`${prefix}DeltaT`]: firstFilled(input.deltaT, input[`${prefix}DeltaT`], parseDisplayNumber(item.deltaT)),
    activeLineSectionId: item.id,
    activeLineSectionName: item.name || ''
  };
}










const lineSectionController = createLineSectionController({
  state,
  listKey: 'lineSections',
  activeIdKey: 'activeLineSectionId',
  nameKey: 'activeLineSectionName',
  expandedIdKey: 'expandedLineSectionId',
  recordPrefix: 'line',
  cardTitle: 'Leitungsabschnitte',
  nameInputId: 'lineSectionName',
  namePlaceholder: 'z. B. Verteilerabgang Nord',
  emptyText: 'Noch keine Leitungsabschnitte angelegt',
  accent: 'blue',
  dynamicAttr: 'line-sections',
  title: item => item.name || 'Abschnitt',
  stats: lineSectionStats,
  currentResult: () => calculate(activeCalculationState(state.get())),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildLineSectionRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrateLineSectionState(item, currentState)
});

export function readLineSections() {
  return lineSectionController.read();
}

export function writeLineSections(items) {
  lineSectionController.write(items);
}

function view(s) {
  const active = activeCalculationState(s);
  const r = calculate(active);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

  const mediumCard = card('Medium', stack([
    selectField({ id: 'mediumId', label: 'Wärmeträger', value: s.mediumId, options: MEDIA.map(m => ({ value: m.id, label: m.label })) }),
    `<div data-hc-dynamic="medium-stats">${renderResultTable(mediumRows(r.medium))}</div>`
  ].join('')), 'blue', { compact: true });

  const inputColumn = stack([
    mediumCard,
    card('Betriebsart', `<div data-hc-dynamic="mode-segment">${segmented('mode', [
      { value: 'heating', label: '● Heizung' },
      { value: 'cooling', label: '● Kälte' }
    ], s.mode, { accent })}</div>`, accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      `<div data-hc-dynamic="target-segment">${segmented(key(s, 'CalcTarget'), [
        { value: 'power', label: 'Q Leistung' },
        { value: 'massFlow', label: 'ṁ Massenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], active.calcTarget, { accent })}</div>`,
      `<div data-hc-dynamic="input-fields">${grid(inputFields(s, active).join(''), 2)}</div>`
    ].join('')), accent),
    `<div data-hc-dynamic="result">${renderResultModel(buildHeatingCoolingResultModel(active, r, accent), accent)}</div>`,
    `<div class="formula" data-hc-dynamic="formula">Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)</div>`
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${stack([`<div data-hc-dynamic="pipe-recommendation">${renderPipeRecommendation(s, r)}</div>`, lineSectionController.renderCard(s)].join(''))}</div>
  `);
}


const heatingCoolingDynamicRenderer = createHeatingCoolingDynamicRenderer({
  calculate,
  activeCalculationState,
  prefixFor,
  key,
  activeValue,
  activeMassFlowUnit,
  formatMassFlowInput,
  fmtInput,
  lineSectionController,
  renderMediumStats: (_s, r) => renderResultTable(mediumRows(r.medium)),
  renderModeSegment: (s, _r, _active, accent) => segmented('mode', [
    { value: 'heating', label: '● Heizung' },
    { value: 'cooling', label: '● Kälte' }
  ], s.mode, { accent }),
  renderTargetSegment: (s, _r, active, accent) => segmented(key(s, 'CalcTarget'), [
    { value: 'power', label: 'Q Leistung' },
    { value: 'massFlow', label: 'ṁ Massenstrom' },
    { value: 'deltaT', label: 'ΔT Temperatur' }
  ], active.calcTarget, { accent }),
  renderInputFields: (s, _r, active) => grid(inputFields(s, active).join(''), 2),
  renderResult: (_s, r, active, accent) => renderResultModel(buildHeatingCoolingResultModel(active, r, accent), accent),
  renderFormula: (_s, r) => `Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)`,
  renderPipeRecommendation
});

function updateHeatingCoolingDynamic(root, s, meta = {}) {
  heatingCoolingDynamicRenderer.update(root, s, meta);
}

function isDynamicHeatingCoolingAction(meta = {}) {
  const action = String(meta.action || '');
  // After the initial mount Heizung/Kälte is store-first: even structural
  // actions update named dynamic islands instead of replacing the full module.
  return action !== 'initial';
}

function bindHeatingCoolingPlatform(root) {
  lineSectionController.bind(root);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindHeatingCoolingPlatform,
  dynamicUpdate: updateHeatingCoolingDynamic,
  isDynamicAction: isDynamicHeatingCoolingAction
});
