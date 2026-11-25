import { formatNumber, parseNumber } from '../../core/engineering/numberService.js';
import { airDensity, ventilation } from '../../core/data/index.js';

const MODE_PREFIX = { heating: 'heating', cooling: 'cooling' };
const fmt = (value, digits = 2) => formatNumber(value, { maximumFractionDigits: digits });

export function prefixFor(s = {}) { return MODE_PREFIX[s.mode] || 'heating'; }
export function key(s = {}, name) { return `${prefixFor(s)}${name}`; }
export function activeValue(s = {}, name) { return s[key(s, name)]; }

function volumeFlowFromResult(r = {}) {
  if (r.volumeFlowM3h) return r.volumeFlowM3h;
  if (r.massFlowKgh && r.rho) return r.massFlowKgh / r.rho;
  return null;
}

export function resolveLineSectionVolumeFlowM3h(item = {}) {
  const direct = parseDisplayNumber(item.volumeFlowM3h);
  if (direct) return direct;

  const input = item.inputState || item.state || {};
  const mode = input.mode || item.uiState?.mode || item.mode || 'heating';
  const prefix = MODE_PREFIX[mode] || 'heating';
  const active = {
    mode,
    calcTarget: input.calcTarget || input[`${prefix}CalcTarget`] || 'power',
    powerW: input.powerW || input[`${prefix}PowerW`] || '',
    powerUnit: input.powerUnit || input[`${prefix}PowerUnit`] || 'W',
    volumeFlowM3h: input.volumeFlowM3h || input[`${prefix}VolumeFlowM3h`] || '',
    supplyTemp: input.supplyTemp || input[`${prefix}SupplyTemp`] || '',
    roomTemp: input.roomTemp || input[`${prefix}RoomTemp`] || ''
  };
  active.deltaT = input.deltaT ?? input[`${prefix}DeltaT`] ?? derivedDeltaT(active);

  const recalculated = ventilation(active);
  const fromInputState = volumeFlowFromResult(recalculated);
  if (fromInputState) return String(fromInputState);

  const supplyTemp = parseNumber(active.supplyTemp || item.supplyTemp, { fallback: NaN });
  const rho = Number.isFinite(supplyTemp) ? airDensity(supplyTemp) : (recalculated.rho || airDensity(20));
  const massFlow = parseDisplayNumber(item.massFlowKgh);
  if (massFlow && rho) return String(massFlow / rho);
  const powerKw = parseDisplayNumber(item.powerKw);
  const deltaT = parseDisplayNumber(item.deltaT) || parseNumber(active.deltaT, { fallback: 0 });
  if (powerKw && deltaT && rho) return String((powerKw * 1000) / ((rho * 1.005 / 3.6) * deltaT));
  return '';
}

export function ventilationLineSectionStats(item = {}) {
  const volumeFlow = resolveLineSectionVolumeFlowM3h(item);
  return [
    { label: 'Leistung', value: item.powerKw || '—', unit: item.powerKw && item.powerKw !== '—' ? 'kW' : '' },
    { label: 'Volumenstrom', value: volumeFlow ? fmt(volumeFlow) : '—', unit: volumeFlow ? 'm³/h' : '' },
    { label: 'Massenstrom', value: item.massFlowKgh || '—', unit: item.massFlowKgh && item.massFlowKgh !== '—' ? 'kg/h' : '' },
    { label: 'Temperaturdifferenz', value: item.deltaT || '—', unit: item.deltaT && item.deltaT !== '—' ? 'K' : '' },
    { label: 'Zuluft', value: item.supplyTemp || '—', unit: item.supplyTemp && item.supplyTemp !== '—' ? '°C' : '' },
    { label: 'Raum', value: item.roomTemp || '—', unit: item.roomTemp && item.roomTemp !== '—' ? '°C' : '' },
    { label: 'Betriebsart', value: item.modeLabel || '—' }
  ];
}

export function buildVentilationLineSectionRecord(currentState, r, active, modeLabel, items, id, name, existing = null) {
  return {
    id,
    name: name || currentState.activeVentLineSectionName || existing?.name || `Abschnitt ${items.length + 1}`,
    powerKw: fmt(r.powerKw),
    volumeFlowM3h: fmt(volumeFlowFromResult(r)),
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

export function savedVentilationPatch(item, currentState) {
  const input = item.inputState || item.state || item.uiState || {};
  const nextMode = inferStoredMode(input, item, currentState.mode || 'heating');
  const prefix = nextMode === 'cooling' ? 'cooling' : 'heating';
  const calcTarget = firstFilled(input.calcTarget, input[`${prefix}CalcTarget`], currentState[`${prefix}CalcTarget`], 'power');
  const powerFromInput = firstFilled(input.powerW, input[`${prefix}PowerW`]);
  const powerFromResult = calcTarget !== 'power' ? parseDisplayNumber(item.powerKw) : '';
  const restoredPower = firstFilled(powerFromInput, powerFromResult);
  const restoredPowerUnit = powerFromInput
    ? firstFilled(input.powerUnit, input[`${prefix}PowerUnit`], 'W')
    : (powerFromResult ? 'kW' : firstFilled(input.powerUnit, input[`${prefix}PowerUnit`], 'W'));
  return {
    ...(item.uiState || {}),
    mode: nextMode,
    [`${prefix}CalcTarget`]: calcTarget,
    [`${prefix}PowerW`]: restoredPower,
    [`${prefix}PowerUnit`]: restoredPowerUnit,
    [`${prefix}VolumeFlowM3h`]: firstFilled(input.volumeFlowM3h, input[`${prefix}VolumeFlowM3h`], parseDisplayNumber(item.volumeFlowM3h), resolveLineSectionVolumeFlowM3h(item)),
    [`${prefix}SupplyTemp`]: firstFilled(input.supplyTemp, input[`${prefix}SupplyTemp`], parseDisplayNumber(item.supplyTemp)),
    [`${prefix}RoomTemp`]: firstFilled(input.roomTemp, input[`${prefix}RoomTemp`], parseDisplayNumber(item.roomTemp)),
    activeVentLineSectionId: item.id,
    activeVentLineSectionName: item.name || ''
  };
}

export function activeCalculationState(s = {}) {
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

export function derivedDeltaT(active = {}) {
  const supply = parseNumber(active.supplyTemp, { fallback: NaN });
  const room = parseNumber(active.roomTemp, { fallback: NaN });
  if (!Number.isFinite(supply) || !Number.isFinite(room)) return '';

  const mode = active.mode === 'cooling' ? 'cooling' : 'heating';
  const delta = mode === 'cooling'
    ? room - supply
    : supply - room;

  return delta > 0 ? delta : 0;
}

export function ventilationAccent(s = {}) {
  return s.mode === 'cooling' ? 'cooling' : 'orange';
}

export function ventilationModeLabel(s = {}) {
  return s.mode === 'cooling' ? 'Kälte' : 'Heizung';
}

export function ventilationFormulaText(r = {}) {
  return `Q = V̇ × (ρ × cₚ / 3,6) × ΔT / 1000 · Wärmewert = ${fmt(r.factor, 3)} Wh/(m³·K)`;
}
