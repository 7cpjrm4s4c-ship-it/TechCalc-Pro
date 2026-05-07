const P_ATM_PA = 101325;

function num(value, fallback = 0) {
  const normalized = String(value ?? '').replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  // Stull approximation, adequate for UI indication in normal HVAC range.
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
  const volumeFlowM3h = Math.max(0, num(input.volumeFlowM3h));
  const w = humidityRatioKgKg(tempC, rhPercent);
  const density = airDensityKgm3(tempC, w);
  return {
    id: input.id ?? crypto.randomUUID(),
    label: String(input.label || 'Zustand'),
    tempC,
    rhPercent,
    volumeFlowM3h,
    humidityRatioGkg: w * 1000,
    humidityRatio: w,
    enthalpyKjKg: enthalpyKjKg(tempC, w),
    densityKgm3: density,
    massFlowKgh: volumeFlowM3h * density,
    dewPointC: dewPointC(tempC, rhPercent),
    wetBulbC: wetBulbApproxC(tempC, rhPercent)
  };
}

export function calculate(input) {
  const current = calculatePoint(input);
  const points = (input.points ?? []).map(point => calculatePoint(point));
  return { current, points };
}
