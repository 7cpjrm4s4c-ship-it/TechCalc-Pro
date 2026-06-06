import { parseNumber } from '../../core/numberService.js';
import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';

const MODE_PREFIX = { heating: 'heating', cooling: 'cooling' };
function prefixFor(s) { return MODE_PREFIX[s.mode] || 'heating'; }
function key(s, name) { return `${prefixFor(s)}${name}`; }
function activeValue(s, name) { return s[key(s, name)]; }



function ventilationLineSectionStats(item = {}) {
  return [
    { label: 'Leistung', value: item.powerKw || '—', unit: item.powerKw && item.powerKw !== '—' ? 'kW' : '' },
    { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: item.volumeFlowM3h && item.volumeFlowM3h !== '—' ? 'm³/h' : '' },
    { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: item.massFlowKgh && item.massFlowKgh !== '—' ? 'kg/h' : '' },
    { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: item.deltaT && item.deltaT !== '—' ? 'K' : '' },
    { label: 'Zuluft', value: item.supplyTemp || '—', unit: item.supplyTemp && item.supplyTemp !== '—' ? '°C' : '' },
    { label: 'Raum', value: item.roomTemp || '—', unit: item.roomTemp && item.roomTemp !== '—' ? '°C' : '' },
    { label: 'Betriebsart', value: item.modeLabel || '—' }
  ];
}

function buildVentilationLineSectionRecord(currentState, r, active, modeLabel, items, id, name, existing = null) {
  return {
    id,
    name: name || currentState.activeVentLineSectionName || existing?.name || `Abschnitt ${items.length + 1}`,
    powerKw: fmt(r.powerKw),
    volumeFlowM3h: fmt(r.volumeFlowM3h),
    massFlowKgh: fmt(r.massFlowKgh),
    deltaT: fmt(r.deltaT),
    supplyTemp: fmt(active.supplyTemp),
    roomTemp: fmt(active.roomTemp),
    modeLabel,
    inputState: activeCalculationState(currentState),
    uiState: { mode: currentState.mode },
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
  const hasCooling = ['coolingCalcTarget', 'coolingPowerW', 'coolingVolumeFlowM3h', 'coolingDeltaT', 'coolingSupplyTemp', 'coolingRoomTemp'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  const hasHeating = ['heatingCalcTarget', 'heatingPowerW', 'heatingVolumeFlowM3h', 'heatingDeltaT', 'heatingSupplyTemp', 'heatingRoomTemp'].some(k => input[k] !== undefined && input[k] !== null && input[k] !== '');
  if (hasCooling && !hasHeating) return 'cooling';
  return fallback === 'cooling' ? 'cooling' : 'heating';
}

function savedVentilationPatch(item, currentState) {
  const input = item.inputState || item.state || item.uiState || {};
  const nextMode = inferStoredMode(input, item, currentState.mode || 'heating');
  const prefix = nextMode === 'cooling' ? 'cooling' : 'heating';
  const calcTarget = firstFilled(input.calcTarget, input[`${prefix}CalcTarget`], currentState[`${prefix}CalcTarget`], 'power');
  const powerFromResult = parseDisplayNumber(item.powerKw);
  return {
    ...(item.uiState || {}),
    mode: nextMode,
    [`${prefix}CalcTarget`]: calcTarget,
    [`${prefix}PowerW`]: firstFilled(input.powerW, input[`${prefix}PowerW`], calcTarget !== 'power' ? powerFromResult : ''),
    [`${prefix}PowerUnit`]: firstFilled(input.powerUnit, input[`${prefix}PowerUnit`], calcTarget !== 'power' && powerFromResult ? 'kW' : 'W'),
    [`${prefix}VolumeFlowM3h`]: firstFilled(input.volumeFlowM3h, input[`${prefix}VolumeFlowM3h`], parseDisplayNumber(item.volumeFlowM3h)),
    [`${prefix}SupplyTemp`]: firstFilled(input.supplyTemp, input[`${prefix}SupplyTemp`], parseDisplayNumber(item.supplyTemp)),
    [`${prefix}RoomTemp`]: firstFilled(input.roomTemp, input[`${prefix}RoomTemp`], parseDisplayNumber(item.roomTemp)),
    activeVentLineSectionId: item.id,
    activeVentLineSectionName: item.name || ''
  };
}


const ventilationLineSectionController = createLineSectionController({
  state,
  listKey: 'ventLineSections',
  activeIdKey: 'activeVentLineSectionId',
  nameKey: 'activeVentLineSectionName',
  expandedIdKey: 'expandedVentLineSectionId',
  recordPrefix: 'vent',
  cardTitle: 'Leitungsabschnitte',
  nameInputId: 'ventLineSectionName',
  namePlaceholder: 'z. B. Zuluft Büro Nord',
  emptyText: 'Noch keine Leitungsabschnitte angelegt',
  accent: 'cyan',
  dynamicAttr: 'line-sections',
  dynamicDataAttr: 'data-line-dynamic',
  title: item => item.name || 'Abschnitt',
  stats: ventilationLineSectionStats,
  currentResult: () => calculate(activeCalculationState(state.get())),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildVentilationLineSectionRecord(
    currentState,
    result,
    activeCalculationState(currentState),
    currentState.mode === 'cooling' ? 'Kälte' : 'Heizung',
    items,
    id,
    name,
    existing
  ),
  hydrateRecord: ({ item, currentState }) => savedVentilationPatch(item, currentState)
});

export function readVentilationLineSections() {
  return ventilationLineSectionController.read();
}

export function writeVentilationLineSections(items) {
  ventilationLineSectionController.write(items);
}

function activeCalculationState(s) {
  const active = {
    mode: s.mode,
    calcTarget: activeValue(s, 'CalcTarget') || 'power',
    powerW: activeValue(s, 'PowerW') || '',
    powerUnit: activeValue(s, 'PowerUnit') || 'W',
    volumeFlowM3h: activeValue(s, 'VolumeFlowM3h') || '',
    supplyTemp: activeValue(s, 'SupplyTemp') || '',
    roomTemp: activeValue(s, 'RoomTemp') || ''
  };
  return {
    ...active,
    deltaT: derivedDeltaT(active)
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
  const supply = parseNumber(active.supplyTemp, { fallback: NaN });
  const room = parseNumber(active.roomTemp, { fallback: NaN });
  if (!Number.isFinite(supply) || !Number.isFinite(room)) return '';

  const mode = active.mode === 'cooling' ? 'cooling' : 'heating';
  const delta = mode === 'cooling'
    ? room - supply
    : supply - room;

  return delta > 0 ? delta : 0;
}

function derivedDeltaTField(s, active) {
  return field({
    id: key(s, 'DeltaT'),
    label: 'ΔT Temperatur',
    unit: 'K',
    value: fmtInput(derivedDeltaT(active), 2),
    readonly: true
  });
}

function inputFields(s, active) {
  const dtValue = derivedDeltaT(active);
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

function targetLabel(target) { return target === 'power' ? 'Leistung' : target === 'volumeFlow' ? 'Volumenstrom' : 'Temperaturspreizung'; }
function targetMain(target, r) {
  if (target === 'power') return { label: 'Berechnete Luftleistung', value: fmt(r.powerKw), unit: 'kW' };
  if (target === 'volumeFlow') return { label: 'Berechneter Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' };
  return { label: 'Berechnete Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' };
}

function temperatureFields(s, active) {
  return grid([
    field({ id: key(s, 'SupplyTemp'), label: 'Zuluft Tzl', unit: '°C', value: fmtInput(active.supplyTemp, 2) }),
    field({ id: key(s, 'RoomTemp'), label: 'Raum Tr', unit: '°C', value: fmtInput(active.roomTemp, 2) })
  ].join(''), 2);
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
    card('Temperaturen', `<div data-vent-dynamic="temperatures">${temperatureFields(s, active)}</div>`, accent),
    card('Betriebsart', `<div data-vent-dynamic="mode-segment">${segmented('mode', [
      { value: 'heating', label: '● Heizleistung' },
      { value: 'cooling', label: '● Kühlleistung' }
    ], s.mode, { accent })}</div>`, accent, { compact: true }),
    card(`${modeLabel} — Eingaben`, stack([
      `<div data-vent-dynamic="target-segment">${segmented(key(s, 'CalcTarget'), [
        { value: 'power', label: 'Q Leistung' },
        { value: 'volumeFlow', label: 'V̇ Volumenstrom' },
        { value: 'deltaT', label: 'ΔT Temperatur' }
      ], active.calcTarget, { accent })}</div>`,
      `<div data-vent-dynamic="input-fields">${grid(inputFields(s, active).join(''), 2)}</div>`
    ].join('')), accent),
    `<div class="formula" data-vent-dynamic="formula">Q = V̇ × (ρ × cₚ / 3,6) × ΔT / 1000 · Wärmewert = ${fmt(r.factor, 3)} Wh/(m³·K)</div>`
  ].join(''));

  const airStats = card('Luftkennwerte aktuell', inlineStats([
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
  ]), 'cyan', { compact: true });

  const outputColumn = stack([
    `<div data-vent-dynamic="result">${mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent)}</div>`,
    `<div data-vent-dynamic="air-stats">${airStats}</div>`,
    ventilationLineSectionController.renderCard(s)
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputColumn}</div>
    <div class="span-6">${outputColumn}</div>
  `);
}

function setInner(root, selector, html) {
  const el = root?.querySelector?.(selector);
  if (!el) return;
  const next = String(html ?? '');
  if (el.innerHTML !== next) el.innerHTML = next;
}

function setInputValue(root, field, value) {
  const el = root?.querySelector?.(`input[data-field="${field}"], textarea[data-field="${field}"]`);
  if (!el || document.activeElement === el) return;
  const next = String(value ?? '');
  if (el.value !== next) el.value = next;
}

function updateSegment(root, name, value) {
  root?.querySelectorAll?.(`[data-segment="${name}"]`)?.forEach(button => {
    button.classList.toggle('is-active', String(button.dataset.value) === String(value));
    button.setAttribute('aria-selected', String(String(button.dataset.value) === String(value)));
  });
}

function updateCardAccent(root, selector, accent) {
  const cardEl = root?.querySelector?.(selector)?.closest?.('.card');
  if (!cardEl) return;
  [...cardEl.classList].forEach(cls => {
    if (cls.startsWith('card--accent-')) cardEl.classList.remove(cls);
  });
  cardEl.classList.add(`card--accent-${accent}`);
}

function setCardTitle(root, selector, title) {
  const titleEl = root?.querySelector?.(selector)?.closest?.('.card')?.querySelector?.('.card__title');
  if (titleEl && titleEl.textContent !== title) titleEl.textContent = title;
}


function renderAirStats(r) {
  return card('Luftkennwerte aktuell', inlineStats([
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
  ]), 'cyan', { compact: true });
}

function updateVentilationDynamic(root, s, meta = {}) {
  const active = activeCalculationState(s);
  const r = calculate(active);
  const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
  const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';
  const previous = root.__tcVentilationDynamic || {};
  const previousPrefix = previous.prefix || 'heating';
  const currentPrefix = prefixFor(s);
  const action = String(meta.action || '');
  const changed = Array.isArray(meta.changed) ? meta.changed : [];
  const modeChanged = previous.mode !== s.mode || changed.includes('mode');
  const targetChanged = previous.calcTarget !== active.calcTarget || previousPrefix !== currentPrefix || changed.includes(key(s, 'CalcTarget'));
  const lineStructural = /^(line:|saved:|vent-line:)/.test(action);
  const appStructural = /^(record:|module:|replace|reset)/.test(action);
  const resultDetails = [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));

  updateCardAccent(root, '[data-vent-dynamic="temperatures"]', accent);
  updateCardAccent(root, '[data-vent-dynamic="mode-segment"]', accent);
  updateCardAccent(root, '[data-vent-dynamic="target-segment"]', accent);
  updateSegment(root, 'mode', s.mode);

  if (modeChanged) {
    setInner(root, '[data-vent-dynamic="temperatures"]', temperatureFields(s, active));
    setInner(root, '[data-vent-dynamic="mode-segment"]', segmented('mode', [
      { value: 'heating', label: '● Heizleistung' },
      { value: 'cooling', label: '● Kühlleistung' }
    ], s.mode, { accent }));
    setCardTitle(root, '[data-vent-dynamic="target-segment"]', `${modeLabel} — Eingaben`);
  }

  if (modeChanged || targetChanged) {
    setInner(root, '[data-vent-dynamic="target-segment"]', segmented(key(s, 'CalcTarget'), [
      { value: 'power', label: 'Q Leistung' },
      { value: 'volumeFlow', label: 'V̇ Volumenstrom' },
      { value: 'deltaT', label: 'ΔT Temperatur' }
    ], active.calcTarget, { accent }));
    setInner(root, '[data-vent-dynamic="input-fields"]', grid(inputFields(s, active).join(''), 2));
  } else {
    updateSegment(root, key(s, 'CalcTarget'), active.calcTarget);
    setInputValue(root, key(s, 'PowerW'), fmtInput(active.powerW, 2));
    setInputValue(root, key(s, 'VolumeFlowM3h'), fmtInput(active.volumeFlowM3h, 2));
    setInputValue(root, key(s, 'DeltaT'), fmtInput(derivedDeltaT(active), 2));
    setInputValue(root, key(s, 'SupplyTemp'), fmtInput(active.supplyTemp, 2));
    setInputValue(root, key(s, 'RoomTemp'), fmtInput(active.roomTemp, 2));
  }

  setInputValue(root, key(s, 'SupplyTemp'), fmtInput(active.supplyTemp, 2));
  setInputValue(root, key(s, 'RoomTemp'), fmtInput(active.roomTemp, 2));

  setInner(root, '[data-vent-dynamic="result"]', mainResult(`Ergebnis — ${targetLabel(active.calcTarget)}`, targetMain(active.calcTarget, r), resultDetails, accent));
  setInner(root, '[data-vent-dynamic="air-stats"]', renderAirStats(r));
  setInner(root, '[data-vent-dynamic="formula"]', `Q = V̇ × (ρ × cₚ / 3,6) × ΔT / 1000 · Wärmewert = ${fmt(r.factor, 3)} Wh/(m³·K)`);

  if (lineStructural || appStructural || changed.includes('ventLineSections') || changed.includes('activeVentLineSectionId') || changed.includes('activeVentLineSectionName') || changed.includes('expandedVentLineSectionId')) {
    ventilationLineSectionController.updateControls(root, s);
    setInner(root, '[data-line-dynamic="line-sections"]', ventilationLineSectionController.renderRows(s));
  }

  root.__tcVentilationDynamic = {
    mode: s.mode,
    prefix: currentPrefix,
    calcTarget: active.calcTarget
  };
}

function isDynamicVentilationAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

function bindVentilationPlatform(root) {
  ventilationLineSectionController.bind(root);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindVentilationPlatform,
  dynamicUpdate: updateVentilationDynamic,
  isDynamicAction: isDynamicVentilationAction
});
