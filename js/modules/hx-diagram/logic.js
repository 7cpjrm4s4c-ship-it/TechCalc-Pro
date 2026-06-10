import { parseNumber } from '../../core/numberService.js';

const P_ATM_PA = 101325;

function num(value, fallback = 0) {
  return parseNumber(value, { fallback });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createId() {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map(b => b.toString(16).padStart(2, '0'));
      return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10,16).join('')}`;
    }
  } catch {
    // Fallback below.
  }
  return `hx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}


export function saturationPressurePa(tempC) {
  const t = Number(tempC) || 0;
  const a = t >= 0 ? 17.62 : 22.46;
  const b = t >= 0 ? 243.12 : 272.62;
  return 611.2 * Math.exp((a * t) / (b + t));
}

export function humidityRatioKgKg(tempC, rhPercent) {
  const rh = clamp(num(rhPercent) / 100, 0, 1);
  const pv = Math.min(rh * saturationPressurePa(num(tempC)), P_ATM_PA * 0.95);
  return 0.62198 * pv / Math.max(P_ATM_PA - pv, 1);
}

export function relativeHumidityPercent(tempC, wKgKg) {
  const ws = humidityRatioKgKg(tempC, 100);
  return ws > 0 ? clamp((wKgKg / ws) * 100, 0, 100) : 0;
}

export function enthalpyKjKg(tempC, wKgKg) {
  const t = num(tempC);
  return 1.006 * t + wKgKg * (2501 + 1.86 * t);
}

function tempFromEnthalpyAndW(enthalpy, wKgKg) {
  return (enthalpy - wKgKg * 2501) / (1.006 + 1.86 * wKgKg);
}

export function airDensityKgm3(tempC, wKgKg) {
  const tK = num(tempC) + 273.15;
  const pv = (wKgKg * P_ATM_PA) / (0.62198 + wKgKg);
  const pd = P_ATM_PA - pv;
  return (pd / (287.05 * tK)) + (pv / (461.5 * tK));
}

export function dewPointC(tempC, rhPercent) {
  const rh = clamp(num(rhPercent), 0.1, 100) / 100;
  const t = num(tempC);
  const a = t >= 0 ? 17.62 : 22.46;
  const b = t >= 0 ? 243.12 : 272.62;
  const gamma = Math.log(rh) + (a * t) / (b + t);
  return (b * gamma) / (a - gamma);
}

export function wetBulbApproxC(tempC, rhPercent) {
  const t = num(tempC);
  const rh = clamp(num(rhPercent), 1, 100);
  return t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659))
    + Math.atan(t + rh)
    - Math.atan(rh - 1.676331)
    + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh)
    - 4.686035;
}

export function calculatePoint(input = {}) {
  return pointFromW({
    id: input.id,
    label: input.label || 'Zustand',
    tempC: input.tempC,
    wKgKg: input.wKgKg ?? humidityRatioKgKg(input.tempC, input.rhPercent)
  });
}

export function pointFromW(input) {
  const tempC = num(input.tempC);
  const w = Math.max(0, num(input.wKgKg));
  const rhPercent = relativeHumidityPercent(tempC, w);
  return {
    id: input.id ?? createId(),
    label: String(input.label || 'Zustand'),
    tempC,
    rhPercent,
    humidityRatioGkg: w * 1000,
    humidityRatio: w,
    enthalpyKjKg: enthalpyKjKg(tempC, w),
    densityKgm3: airDensityKgm3(tempC, w),
    dewPointC: dewPointFromW(w),
    wetBulbC: wetBulbApproxC(tempC, rhPercent)
  };
}

function dewPointFromW(wKgKg) {
  let low = -50;
  let high = 80;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    const ws = humidityRatioKgKg(mid, 100);
    if (ws < wKgKg) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function saturationPointAtW(wKgKg, label) {
  return pointFromW({ label, tempC: dewPointFromW(wKgKg), wKgKg });
}

function uniqueByClose(points) {
  const out = [];
  points.forEach(point => {
    const previous = out[out.length - 1];
    if (!previous || Math.abs(previous.tempC - point.tempC) > 0.05 || Math.abs(previous.humidityRatioGkg - point.humidityRatioGkg) > 0.05) {
      out.push(point);
    }
  });
  return out;
}

export const PROCESS_OPTIONS = [
  { value: 'heat', label: 'Erhitzen' },
  { value: 'cool', label: 'Kühlen' },
  { value: 'adiabatic', label: 'Erhitzen + adiabat befeuchten' },
  { value: 'steam', label: 'Erhitzen + dampfbefeuchten' },
  { value: 'cool-dehumidify', label: 'Kühlen + entfeuchten' }
];

export function processLabel(value) {
  return PROCESS_OPTIONS.find(option => option.value === value)?.label ?? 'Automatisch';
}


function pointReached(a, b) {
  return Math.abs(a.tempC - b.tempC) <= 0.1 && Math.abs(a.humidityRatioGkg - b.humidityRatioGkg) <= 0.1;
}

function buildHeat(start, target) {
  // Reines Erwärmen: x bleibt konstant. Es wird keine Befeuchtung ergänzt.
  const heated = pointFromW({ label: '2 Erwärmen', tempC: target.tempC, wKgKg: start.humidityRatio });
  return uniqueByClose([{ ...start, label: '1 Ausgang' }, heated]);
}

function buildCool(start, target) {
  // Reines Kühlen: x bleibt konstant bis maximal zum Taupunkt. Keine Entfeuchtung ergänzen.
  const saturated = saturationPointAtW(start.humidityRatio, '2 Taupunkt / 100 % r.F.');
  const endTemp = target.tempC < saturated.tempC ? saturated.tempC : target.tempC;
  const cooled = pointFromW({ label: target.tempC < saturated.tempC ? '2 Taupunkt / 100 % r.F.' : '2 Kühlen', tempC: endTemp, wKgKg: start.humidityRatio });
  return uniqueByClose([{ ...start, label: '1 Ausgang' }, cooled]);
}

function buildAdiabatic(start, target) {
  const saturationForTargetX = saturationPointAtW(target.humidityRatio, '3 adiabate Befeuchtung');
  const hSaturation = saturationForTargetX.enthalpyKjKg;
  const preheatT = tempFromEnthalpyAndW(hSaturation, start.humidityRatio);
  return uniqueByClose([
    { ...start, label: '1 Ausgang' },
    pointFromW({ label: '2 Vorerwärmen', tempC: preheatT, wKgKg: start.humidityRatio }),
    saturationForTargetX,
    { ...target, label: '4 Nacherwärmen / Ziel' }
  ]);
}

function buildSteam(start, target) {
  const heated = pointFromW({ label: '2 Erwärmen', tempC: target.tempC, wKgKg: start.humidityRatio });
  return uniqueByClose([
    { ...start, label: '1 Ausgang' },
    heated,
    { ...target, label: '3 Dampfbefeuchten / Ziel' }
  ]);
}

function buildCoolDehumidify(start, target) {
  const startSaturation = saturationPointAtW(start.humidityRatio, '2 Taupunkt / 100 % r.F.');
  const targetSaturation = saturationPointAtW(target.humidityRatio, '3 Kühlen und entfeuchten');
  const points = [{ ...start, label: '1 Ausgang' }];
  if (start.tempC > startSaturation.tempC) points.push(startSaturation);
  points.push(targetSaturation);
  if (!pointReached(targetSaturation, target)) {
    points.push({ ...target, label: '4 Nacherwärmen / Ziel' });
  }
  return uniqueByClose(points);
}

export function buildProcessPath(start, target, process) {
  switch (process) {
    case 'heat': return buildHeat(start, target);
    case 'cool': return buildCool(start, target);
    case 'adiabatic': return buildAdiabatic(start, target);
    case 'steam': return buildSteam(start, target);
    case 'cool-dehumidify': return buildCoolDehumidify(start, target);
    default: return buildHeat(start, target);
  }
}

export function classifyChange(start, target) {
  const dt = target.tempC - start.tempC;
  const dx = target.humidityRatioGkg - start.humidityRatioGkg;
  const dh = target.enthalpyKjKg - start.enthalpyKjKg;
  const epsT = 0.25;
  const epsX = 0.15;
  const epsH = 2.0;

  if (Math.abs(dt) <= epsT && Math.abs(dx) <= epsX) return 'Keine relevante Zustandsänderung';
  if (dx < -epsX && dt < -epsT) return 'Kühlen und Entfeuchten';
  if (dx > epsX && Math.abs(dh) <= epsH) return 'Erhitzen und adiabat befeuchten';
  if (dx > epsX && dh > epsH) return 'Erhitzen und dampfbefeuchten';
  if (Math.abs(dx) <= epsX && dt > epsT) return 'Erhitzen';
  if (Math.abs(dx) <= epsX && dt < -epsT) return 'Kühlen';
  if (dx < -epsX) return 'Entfeuchten';
  if (dx > epsX) return 'Befeuchten';
  return dt > 0 ? 'Erhitzen' : 'Kühlen';
}
export function calculate(input) {
  const current = calculatePoint({
    label: 'Ausgangszustand',
    tempC: input.tempC,
    rhPercent: input.rhPercent
  });
  const target = calculatePoint({
    label: 'Zielzustand',
    tempC: input.targetTempC,
    rhPercent: input.targetRhPercent
  });
  const selectedProcess = input.process || 'heat';
  const processPath = buildProcessPath(current, target, selectedProcess);
  const processEnd = processPath[processPath.length - 1] || current;
  const targetReached = pointReached(processEnd, target);
  const changeType = processLabel(selectedProcess);
  const delta = {
    tempK: processEnd.tempC - current.tempC,
    humidityGkg: processEnd.humidityRatioGkg - current.humidityRatioGkg,
    enthalpyKjKg: processEnd.enthalpyKjKg - current.enthalpyKjKg,
    rhPercent: processEnd.rhPercent - current.rhPercent
  };
  const points = (input.points ?? []).map(point => calculatePoint(point));
  return { current, target, processEnd, targetReached, changeType, selectedProcess, processPath, delta, points };
}
