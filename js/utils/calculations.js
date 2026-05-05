export const MEDIA = [
  { id:'water', label:'Wasser', density:998, cpWhKgK:1.163, cpKjKgK:4.187 },
  { id:'eg25', label:'Ethylenglykol 25%', density:1038, cpWhKgK:1.045, cpKjKgK:3.762 },
  { id:'eg30', label:'Ethylenglykol 30%', density:1046, cpWhKgK:1.020, cpKjKgK:3.672 },
  { id:'eg35', label:'Ethylenglykol 35%', density:1054, cpWhKgK:0.995, cpKjKgK:3.582 },
  { id:'pg25', label:'Propylenglykol 25%', density:1020, cpWhKgK:1.055, cpKjKgK:3.798 },
  { id:'pg30', label:'Propylenglykol 30%', density:1027, cpWhKgK:1.030, cpKjKgK:3.708 },
  { id:'pg35', label:'Propylenglykol 35%', density:1034, cpWhKgK:1.005, cpKjKgK:3.618 }
];

export function getMedium(id = 'water') {
  return MEDIA.find(m => m.id === id) || MEDIA[0];
}

export function heatingCooling({ powerW, massFlowKgh, deltaT, mediumId = 'water', calcTarget = 'power' }) {
  const medium = getMedium(mediumId);
  const cp = medium.cpWhKgK;
  const qKwInput = num(powerW) / 1000;
  const m = num(massFlowKgh);
  const dt = num(deltaT);

  let powerKw = qKwInput || null;
  let mass = m || null;
  let spread = dt || null;

  if (calcTarget === 'power' && m && dt) {
    powerKw = (m * cp * dt) / 1000;
  }
  if (calcTarget === 'massFlow' && qKwInput && dt) {
    mass = (qKwInput * 1000) / (cp * dt);
  }
  if (calcTarget === 'deltaT' && qKwInput && m) {
    spread = (qKwInput * 1000) / (m * cp);
  }

  // Fallback for partially filled forms.
  if (!powerKw && m && dt) powerKw = (m * cp * dt) / 1000;
  if (!mass && qKwInput && dt) mass = (qKwInput * 1000) / (cp * dt);
  if (!spread && qKwInput && m) spread = (qKwInput * 1000) / (m * cp);

  const volumeFlowM3h = mass ? mass / medium.density : null;

  return { powerKw, massFlowKgh: mass, deltaT: spread, volumeFlowM3h, medium };
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
