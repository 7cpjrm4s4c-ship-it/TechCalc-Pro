import { airDensity, num } from '../../utils/calculations.js';

const CP_AIR_KJ_KG_K = 1.005;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function airFactor(tempC) {
  const rho = airDensity(tempC || 20);
  return {
    rho,
    cp: CP_AIR_KJ_KG_K,
    factor: rho * CP_AIR_KJ_K_K_SAFE() / 3.6
  };
}

function CP_AIR_KJ_K_K_SAFE() {
  return CP_AIR_KJ_KG_K;
}

export function calculate(s) {
  const mode = s.mode || 'wrg';
  const volumeFlowM3h = num(s.volumeFlowM3h);
  const outdoorTemp = num(s.outdoorTemp);
  const extractTemp = num(s.extractTemp);
  const roomTemp = num(s.roomTemp);
  const efficiency = clamp(num(s.efficiency), 0, 100);
  const targetSupplyTemp = num(s.targetSupplyTemp);
  const outdoorAirShare = clamp(num(s.outdoorAirShare), 0, 100);

  const referenceTemp = mode === 'wrg' ? outdoorTemp : ((outdoorTemp + roomTemp) / 2);
  const rho = airDensity(referenceTemp || 20);
  const cp = CP_AIR_KJ_KG_K;
  const factor = rho * cp / 3.6; // Wh/(m³·K)
  const massFlowKgh = volumeFlowM3h ? volumeFlowM3h * rho : null;

  if (mode === 'mixing') {
    const outdoorFraction = outdoorAirShare / 100;
    const recirculationShare = 100 - outdoorAirShare;
    const mixedTemp = outdoorTemp * outdoorFraction + roomTemp * (1 - outdoorFraction);
    const heatingCoolingLoadKw = volumeFlowM3h ? volumeFlowM3h * factor * (targetSupplyTemp - mixedTemp) / 1000 : null;
    return {
      mode,
      volumeFlowM3h: volumeFlowM3h || null,
      massFlowKgh,
      outdoorTemp,
      roomTemp,
      targetSupplyTemp,
      outdoorAirShare,
      recirculationShare,
      mixedTemp,
      heatingCoolingLoadKw,
      rho,
      cp,
      factor
    };
  }

  const supplyAfterWrg = outdoorTemp + (efficiency / 100) * (extractTemp - outdoorTemp);
  const recoveredDeltaT = supplyAfterWrg - outdoorTemp;
  const recoveredPowerKw = volumeFlowM3h ? volumeFlowM3h * factor * recoveredDeltaT / 1000 : null;
  const remainingLoadKw = volumeFlowM3h ? volumeFlowM3h * factor * (targetSupplyTemp - supplyAfterWrg) / 1000 : null;
  const exhaustAfterWrg = extractTemp - recoveredDeltaT;

  return {
    mode,
    volumeFlowM3h: volumeFlowM3h || null,
    massFlowKgh,
    outdoorTemp,
    extractTemp,
    targetSupplyTemp,
    efficiency,
    supplyAfterWrg,
    exhaustAfterWrg,
    recoveredDeltaT,
    recoveredPowerKw,
    remainingLoadKw,
    rho,
    cp,
    factor
  };
}
