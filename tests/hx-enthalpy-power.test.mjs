import assert from 'node:assert/strict';

import { calculate } from '../js/modules/hx-diagram/logic.js';
import { buildHxResultModel } from '../js/modules/hx-diagram/results.js';

function parseGermanNumber(value) {
  return Number(String(value).replace(/\./g, '').replace(',', '.'));
}

function sizingRows(input) {
  const result = calculate(input);
  const model = buildHxResultModel({
    state: input,
    result,
    activePath: result.processPath,
    targetReached: result.targetReached
  });
  const group = model.groups.find(entry => entry.title === 'Erhitzer, Kühler und Befeuchter');
  assert.ok(group, 'equipment sizing group must be present');
  return { result, rows: group.rows };
}

function rowValue(rows, label) {
  const row = rows.find(entry => entry.label === label);
  assert.ok(row, `${label} must be present`);
  return parseGermanNumber(row.value);
}

function expectedEnthalpyPower(input, result) {
  const start = result.processPath[0];
  const end = result.processPath[result.processPath.length - 1];
  const dryAirMassKgS = (Number(input.airVolumeM3h) / 3600) * start.densityKgm3 / (1 + start.humidityRatio);
  return dryAirMassKgS * Math.abs(end.enthalpyKjKg - start.enthalpyKjKg);
}

const heatingInput = {
  tempC: 30,
  rhPercent: 80,
  targetTempC: 50,
  targetRhPercent: 30,
  airVolumeM3h: 5000,
  process: 'heat'
};
const heating = sizingRows(heatingInput);
const expectedHeatingKw = expectedEnthalpyPower(heatingInput, heating.result);
assert.ok(Math.abs(rowValue(heating.rows, 'Erhitzerleistung') - expectedHeatingKw) <= 0.01,
  'heating power must be calculated from dry-air mass flow and enthalpy difference');

const coolingInput = {
  tempC: 35,
  rhPercent: 30,
  targetTempC: 25,
  targetRhPercent: 50,
  airVolumeM3h: 5000,
  process: 'cool'
};
const cooling = sizingRows(coolingInput);
const expectedCoolingKw = expectedEnthalpyPower(coolingInput, cooling.result);
assert.ok(Math.abs(rowValue(cooling.rows, 'Kühlerleistung') - expectedCoolingKw) <= 0.01,
  'cooling power must remain based on dry-air mass flow and enthalpy difference');

console.log('h,x enthalpy-based heating and cooling power regression ok');
