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

function dryAirMassKgS(input, result) {
  const start = result.processPath[0];
  return (Number(input.airVolumeM3h) / 3600) * start.densityKgm3 / (1 + start.humidityRatio);
}

function expectedEnthalpyPower(input, result) {
  const start = result.processPath[0];
  const end = result.processPath[result.processPath.length - 1];
  return dryAirMassKgS(input, result) * Math.abs(end.enthalpyKjKg - start.enthalpyKjKg);
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

const steamInput = {
  tempC: 20,
  rhPercent: 40,
  targetTempC: 25,
  targetRhPercent: 60,
  airVolumeM3h: 5000,
  process: 'steam'
};
const steam = sizingRows(steamInput);
const humidificationSegment = steam.result.processPath.findIndex((point, index, points) => index > 0 && point.humidityRatio > points[index - 1].humidityRatio);
assert.ok(humidificationSegment > 0, 'steam process must contain a humidification segment');
const steamPrevious = steam.result.processPath[humidificationSegment - 1];
const steamCurrent = steam.result.processPath[humidificationSegment];
const expectedEvaporatorKw = dryAirMassKgS(steamInput, steam.result) * Math.max(0, steamCurrent.enthalpyKjKg - steamPrevious.enthalpyKjKg);
assert.ok(Math.abs(rowValue(steam.rows, 'Verdampferleistung') - expectedEvaporatorKw) <= 0.01,
  'evaporator power must be calculated from the humidification segment enthalpy difference');

console.log('h,x enthalpy-based heating, cooling and evaporator power regression ok');
