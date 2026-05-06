import { airDensity, num } from '../../utils/calculations.js';

const CP_AIR_KJ_KG_K = 1.005;
const P_ATM_PA = 101325;
const H_VAP_KJ_KG = 2500;

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function saturationPressurePa(tempC) {
  // Magnus approximation over water/ice, sufficient for ventilation engineering UI.
  const t = Number(tempC) || 0;
  const a = t >= 0 ? 17.62 : 22.46;
  const b = t >= 0 ? 243.12 : 272.62;
  return 611.2 * Math.exp((a * t) / (b + t));
}

function humidityRatioKgKg(tempC, rhPercent) {
  const rh = clamp(rhPercent, 0, 100) / 100;
  const pv = Math.min(rh * saturationPressurePa(tempC), P_ATM_PA * 0.95);
  return 0.62198 * pv / Math.max(P_ATM_PA - pv, 1);
}

function relativeHumidityPercent(tempC, wKgKg) {
  const ws = humidityRatioKgKg(tempC, 100);
  if (!ws) return 0;
  return clamp((wKgKg / ws) * 100, 0, 100);
}

function enthalpyKjKg(tempC, wKgKg) {
  return 1.006 * tempC + wKgKg * (2501 + 1.86 * tempC);
}

function dryAirMassFlowKgh(volumeFlowM3h, tempC) {
  const rho = airDensity(tempC || 20);
  return Math.max(0, volumeFlowM3h || 0) * rho;
}

function airPoint(volumeFlowM3h, tempC, rhPercent) {
  const volume = Math.max(0, num(volumeFlowM3h));
  const temp = num(tempC);
  const rh = clamp(num(rhPercent), 0, 100);
  const w = humidityRatioKgKg(temp, rh);
  const rho = airDensity(temp || 20);
  const massFlowKgh = volume * rho;
  const dryMassFlowKgh = dryAirMassFlowKgh(volume, temp);
  return {
    volumeFlowM3h: volume,
    tempC: temp,
    rhPercent: rh,
    humidityRatioGkg: w * 1000,
    humidityRatio: w,
    enthalpyKjKg: enthalpyKjKg(temp, w),
    densityKgm3: rho,
    massFlowKgh,
    dryMassFlowKgh
  };
}

function pointFromTempHumidity(volumeFlowM3h, tempC, wKgKg, referenceMassFlowKgh = null) {
  const rh = relativeHumidityPercent(tempC, wKgKg);
  return {
    volumeFlowM3h: volumeFlowM3h || 0,
    tempC,
    rhPercent: rh,
    humidityRatioGkg: wKgKg * 1000,
    humidityRatio: wKgKg,
    enthalpyKjKg: enthalpyKjKg(tempC, wKgKg),
    densityKgm3: airDensity(tempC || 20),
    massFlowKgh: referenceMassFlowKgh ?? dryAirMassFlowKgh(volumeFlowM3h, tempC)
  };
}

function calculateWrg(s) {
  const outdoor = airPoint(s.outdoorVolumeFlowM3h, s.outdoorTemp, s.outdoorRh);
  const extract = airPoint(s.extractVolumeFlowM3h, s.extractTemp, s.extractRh);
  const efficiency = clamp(num(s.efficiency), 0, 100);
  const eta = efficiency / 100;

  const supplyTemp = outdoor.tempC + eta * (extract.tempC - outdoor.tempC);
  const exhaustTempRaw = extract.tempC - eta * (extract.tempC - outdoor.tempC);

  const supply = pointFromTempHumidity(outdoor.volumeFlowM3h, supplyTemp, outdoor.humidityRatio, outdoor.massFlowKgh);

  const extractWSatAtExhaust = humidityRatioKgKg(exhaustTempRaw, 100);
  const condensateKgh = Math.max(0, extract.dryMassFlowKgh * (extract.humidityRatio - extractWSatAtExhaust));
  const exhaustHumidity = condensateKgh > 0 ? extractWSatAtExhaust : extract.humidityRatio;
  const exhaustRh = relativeHumidityPercent(exhaustTempRaw, exhaustHumidity);
  const exhaust = pointFromTempHumidity(extract.volumeFlowM3h, exhaustTempRaw, exhaustHumidity, extract.massFlowKgh);
  exhaust.rhPercent = exhaustRh;

  const avgRho = airDensity((outdoor.tempC + extract.tempC) / 2 || 20);
  const factor = avgRho * CP_AIR_KJ_KG_K / 3.6;
  const recoveredPowerKw = outdoor.volumeFlowM3h * factor * (supplyTemp - outdoor.tempC) / 1000;
  const condensationPowerKw = condensateKgh * H_VAP_KJ_KG / 3600;

  return {
    mode: 'wrg',
    efficiency,
    outdoor,
    extract,
    supply,
    exhaust,
    recoveredPowerKw,
    condensateKgh,
    condensationPowerKw,
    condensateLs: condensateKgh / 3600,
    hasCondensation: condensateKgh > 0.001,
    factor,
    cp: CP_AIR_KJ_KG_K
  };
}

function calculateMixing(s) {
  const outdoor = airPoint(s.mixingOutdoorVolumeFlowM3h, s.mixingOutdoorTemp, s.mixingOutdoorRh);
  const recirc = airPoint(s.mixingRecircVolumeFlowM3h, s.mixingRecircTemp, s.mixingRecircRh);

  const totalDryMass = outdoor.dryMassFlowKgh + recirc.dryMassFlowKgh;
  const mixedVolume = outdoor.volumeFlowM3h + recirc.volumeFlowM3h;
  const mixedTemp = totalDryMass
    ? ((outdoor.tempC * outdoor.dryMassFlowKgh) + (recirc.tempC * recirc.dryMassFlowKgh)) / totalDryMass
    : 0;
  const mixedHumidity = totalDryMass
    ? ((outdoor.humidityRatio * outdoor.dryMassFlowKgh) + (recirc.humidityRatio * recirc.dryMassFlowKgh)) / totalDryMass
    : 0;

  const wsAtMixed = humidityRatioKgKg(mixedTemp, 100);
  const condensateKgh = Math.max(0, totalDryMass * (mixedHumidity - wsAtMixed));
  const finalHumidity = condensateKgh > 0 ? wsAtMixed : mixedHumidity;
  const mixed = pointFromTempHumidity(mixedVolume, mixedTemp, finalHumidity, totalDryMass);
  const outdoorShare = mixedVolume ? outdoor.volumeFlowM3h / mixedVolume * 100 : 0;
  const recircShare = 100 - outdoorShare;
  const condensationPowerKw = condensateKgh * H_VAP_KJ_KG / 3600;

  return {
    mode: 'mixing',
    outdoor,
    recirc,
    mixed,
    supply: mixed,
    outdoorShare,
    recircShare,
    condensateKgh,
    condensationPowerKw,
    condensateLs: condensateKgh / 3600,
    hasCondensation: condensateKgh > 0.001,
    cp: CP_AIR_KJ_KG_K,
    factor: mixed.densityKgm3 * CP_AIR_KJ_KG_K / 3.6
  };
}

export function calculate(s) {
  return (s.mode || 'wrg') === 'mixing' ? calculateMixing(s) : calculateWrg(s);
}
