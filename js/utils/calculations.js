import { parseGermanNumber } from '../core/numbers.js';
export const MEDIA = [
  { id:'water', label:'Wasser', density:998, cpWhKgK:1.163, cpKjKgK:4.187, frostC:null },
  { id:'eg25', label:'Ethylenglykol 25%', density:1038, cpWhKgK:1.045, cpKjKgK:3.762, frostC:-12 },
  { id:'eg30', label:'Ethylenglykol 30%', density:1046, cpWhKgK:1.020, cpKjKgK:3.672, frostC:-15 },
  { id:'eg35', label:'Ethylenglykol 35%', density:1054, cpWhKgK:0.995, cpKjKgK:3.582, frostC:-20 },
  { id:'pg25', label:'Propylenglykol 25%', density:1020, cpWhKgK:1.055, cpKjKgK:3.798, frostC:-10 },
  { id:'pg30', label:'Propylenglykol 30%', density:1027, cpWhKgK:1.030, cpKjKgK:3.708, frostC:-14 },
  { id:'pg35', label:'Propylenglykol 35%', density:1034, cpWhKgK:1.005, cpKjKgK:3.618, frostC:-18 }
];

export function getMedium(id = 'water') {
  return MEDIA.find(m => m.id === id) || MEDIA[0];
}

export function heatingCooling({ powerW, powerUnit = 'W', massFlowKgh, deltaT, mediumId = 'water', calcTarget = 'power' }) {
  const medium = getMedium(mediumId);
  const cp = medium.cpWhKgK;
  const inputPowerW = num(powerW) * (powerUnit === 'kW' ? 1000 : 1);
  const qKwInput = inputPowerW ? inputPowerW / 1000 : null;
  const m = num(massFlowKgh);
  const dt = num(deltaT);

  let powerKw = qKwInput;
  let mass = m || null;
  let spread = dt || null;

  // Keine automatische Rückwärtsberechnung außerhalb der gewählten Methode.
  // Dadurch erscheinen keine scheinbaren Ergebnisse, solange Pflichtwerte fehlen.
  if (calcTarget === 'power') {
    powerKw = m && dt ? (m * cp * dt) / 1000 : null;
  }
  if (calcTarget === 'massFlow') {
    mass = inputPowerW && dt ? inputPowerW / (cp * dt) : null;
  }
  if (calcTarget === 'deltaT') {
    spread = inputPowerW && m ? inputPowerW / (m * cp) : null;
  }

  const volumeFlowM3h = mass ? mass / medium.density : null;

  return { powerKw, massFlowKgh: mass, deltaT: spread, volumeFlowM3h, medium };
}

export function airDensity(tempC = 20) { return 353.05 / (Number(tempC) + 273.15); }
export function ventilation({ volumeFlowM3h, powerW, powerUnit = 'W', deltaT, supplyTemp, roomTemp, tempC = 20, calcTarget = 'power' }) {
  const referenceTemp = supplyTemp !== undefined && supplyTemp !== '' ? supplyTemp : tempC;
  const rho = airDensity(referenceTemp);
  const cp = 1.005;
  // Wärmewert Luft in Wh/(m³·K): ρ × cₚ / 3,6
  const factor = rho * cp / 3.6;
  const inputPowerW = num(powerW) * (powerUnit === 'kW' ? 1000 : 1);
  const qKwInput = inputPowerW ? inputPowerW / 1000 : null;
  const v = num(volumeFlowM3h);
  const derivedDt = deltaT !== '' && deltaT !== null && deltaT !== undefined
    ? num(deltaT)
    : Math.abs(num(supplyTemp) - num(roomTemp)) || 0;
  const dt = derivedDt;

  let volume = v || null;
  let powerKw = qKwInput;
  let spread = dt || null;

  if (calcTarget === 'power') {
    powerKw = v && dt ? (v * factor * dt) / 1000 : null;
  }
  if (calcTarget === 'volumeFlow') {
    volume = inputPowerW && dt ? inputPowerW / (factor * dt) : null;
  }
  if (calcTarget === 'deltaT') {
    spread = inputPowerW && v ? inputPowerW / (v * factor) : null;
  }

  return {
    powerKw,
    volumeFlowM3h: volume,
    deltaT: spread,
    massFlowKgh: volume ? volume * rho : null,
    rho,
    cp,
    factor
  };
}

export function num(v){ return parseGermanNumber(v, 0); }
export function fmt(v, digits = 2){ return v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toLocaleString('de-DE', { maximumFractionDigits: digits }); }
export function fmtInput(v, digits = 2){
  if (v === '' || v === null || v === undefined) return '';
  const n = num(v);
  if (!n) return String(v);
  return n.toLocaleString('de-DE', { maximumFractionDigits: digits });
}
