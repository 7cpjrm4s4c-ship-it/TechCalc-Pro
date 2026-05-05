export const WATER_C = 1.163;
export function heatingCooling({ powerW, massFlowKgh, deltaT }) {
  const q = num(powerW) / 1000;
  const m = num(massFlowKgh);
  const dt = num(deltaT);
  if (!q && m && dt) return { powerKw: m * WATER_C * dt / 1000, massFlowKgh: m, deltaT: dt };
  if (q && !m && dt) return { powerKw: q, massFlowKgh: q * 1000 / (WATER_C * dt), deltaT: dt };
  if (q && m && !dt) return { powerKw: q, massFlowKgh: m, deltaT: q * 1000 / (m * WATER_C) };
  return { powerKw: q || null, massFlowKgh: m || null, deltaT: dt || null };
}
export function airDensity(tempC = 20) { return 353.05 / (Number(tempC) + 273.15); }
export function ventilation({ volumeFlowM3h, powerW, deltaT, tempC = 20 }) {
  const rho = airDensity(tempC); const cp = 1.005; const factor = rho * cp / 3600;
  const q = num(powerW) / 1000; const v = num(volumeFlowM3h); const dt = num(deltaT);
  let volume = v, powerKw = q, spread = dt;
  if (!q && v && dt) powerKw = v * factor * dt;
  if (q && !v && dt) volume = q / (factor * dt);
  if (q && v && !dt) spread = q / (v * factor);
  return { powerKw: powerKw || null, volumeFlowM3h: volume || null, deltaT: spread || null, massFlowKgh: volume ? volume * rho : null, rho, cp, factor };
}
function num(v){ const n = Number(String(v ?? '').replace(',','.')); return Number.isFinite(n) ? n : 0; }
export function fmt(v, digits = 2){ return v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toLocaleString('de-DE', { maximumFractionDigits: digits }); }
