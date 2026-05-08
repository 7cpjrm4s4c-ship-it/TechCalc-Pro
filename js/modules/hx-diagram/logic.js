const P_ATM_PA = 101325;

function num(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  let normalized = raw.replace(/\s/g, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else if (hasComma) normalized = normalized.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

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

export function calculatePoint(input) {
  const tempC = num(input.tempC);
  const rhPercent = clamp(num(input.rhPercent), 0, 100);
  const w = humidityRatioKgKg(tempC, rhPercent);
  return pointFromW({ id: input.id, label: input.label, tempC, wKgKg: w });
}

export function pointFromW(input) {
  const tempC = num(input.tempC);
  const w = Math.max(0, num(input.wKgKg));
  const rhPercent = relativeHumidityPercent(tempC, w);
  return {
    id: input.id ?? crypto.randomUUID(),
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
    if (humidityRatioKgKg(mid, 100) < wKgKg) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function saturationPointAtW(wKgKg, label) {
  return pointFromW({ label, tempC: dewPointFromW(wKgKg), wKgKg });
}

function pointOnConstantH(label, h, wKgKg) {
  return pointFromW({ label, tempC: tempFromEnthalpyAndW(h, wKgKg), wKgKg });
}

function uniqueByClose(points) {
  const out = [];
  points.forEach(point => {
    const previous = out[out.length - 1];
    if (!previous || Math.abs(previous.tempC - point.tempC) > 0.05 || Math.abs(previous.humidityRatioGkg - point.humidityRatioGkg) > 0.05) out.push(point);
  });
  return out;
}

export const PROCESS_OPTIONS = [
  { value: 'heat', label: 'Erhitzen', mode: 'heat' },
  { value: 'cool', label: 'Kühlen', mode: 'cool' },
  { value: 'adiabatic', label: 'Erhitzen + adiabat befeuchten', mode: 'heat' },
  { value: 'steam', label: 'Erhitzen + dampfbefeuchten', mode: 'heat' },
  { value: 'cool-dehumidify', label: 'Kühlen + entfeuchten', mode: 'cool' }
];

export function availableProcesses(start, target) {
  if (target.tempC > start.tempC + 0.05) return PROCESS_OPTIONS.filter(o => o.mode === 'heat');
  if (target.tempC < start.tempC - 0.05) return PROCESS_OPTIONS.filter(o => o.mode === 'cool');
  return PROCESS_OPTIONS;
}

export function processLabel(value) { return PROCESS_OPTIONS.find(option => option.value === value)?.label ?? 'Automatisch'; }

function buildHeat(start, target) {
  return uniqueByClose([{ ...start, label: '1 Ausgang' }, pointFromW({ label: '2 Erwärmen / Endzustand', tempC: target.tempC, wKgKg: start.humidityRatio })]);
}

function buildCool(start, target) {
  return uniqueByClose([{ ...start, label: '1 Ausgang' }, pointFromW({ label: '2 Kühlen / Endzustand', tempC: target.tempC, wKgKg: start.humidityRatio })]);
}

function buildAdiabatic(start, target) {
  const saturationForTargetX = saturationPointAtW(target.humidityRatio, '3 Sättigung nach adiabater Befeuchtung');
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
  return uniqueByClose([
    { ...start, label: '1 Ausgang' },
    pointFromW({ label: '2 Erwärmen', tempC: target.tempC, wKgKg: start.humidityRatio }),
    { ...target, label: '3 Dampfbefeuchten / Ziel' }
  ]);
}

function buildCoolDehumidify(start, target) {
  const dewStart = saturationPointAtW(start.humidityRatio, '2 Taupunkt / 100 % r.F.');
  const targetSat = saturationPointAtW(target.humidityRatio, '3 Kühlen und entfeuchten');
  const points = [{ ...start, label: '1 Ausgang' }];
  if (start.tempC > dewStart.tempC + 0.05) points.push(dewStart);
  points.push(targetSat);
  if (Math.abs(target.tempC - targetSat.tempC) > 0.05) points.push({ ...target, label: '4 Nacherwärmen / Ziel' });
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
  const current = calculatePoint({ label: 'Ausgangszustand', tempC: input.tempC, rhPercent: input.rhPercent });
  const target = calculatePoint({ label: 'Zielzustand', tempC: input.targetTempC, rhPercent: input.targetRhPercent });
  const options = availableProcesses(current, target);
  const selectedProcess = options.some(option => option.value === input.process) ? input.process : options[0]?.value ?? 'heat';
  const processPath = buildProcessPath(current, target, selectedProcess);
  const changeType = processLabel(selectedProcess);
  const last = processPath[processPath.length - 1] ?? target;
  const delta = {
    tempK: last.tempC - current.tempC,
    humidityGkg: last.humidityRatioGkg - current.humidityRatioGkg,
    enthalpyKjKg: last.enthalpyKjKg - current.enthalpyKjKg,
    rhPercent: last.rhPercent - current.rhPercent
  };
  const processes = Array.isArray(input.processes) ? input.processes : [];
  const activeProcess = processes.find(process => process.id === input.activeProcessId) ?? null;
  return { current, target, changeType, selectedProcess, processPath, delta, options, processes, activeProcess };
}
