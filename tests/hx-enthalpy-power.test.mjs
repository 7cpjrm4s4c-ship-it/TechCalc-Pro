import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import hxModule from '../js/modules/hx-diagram/index.js';
import { reportSections } from '../js/core/pdf/pdfDataMapping.js';
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

function savedHxRecord(name, input) {
  const result = calculate(input);
  return {
    name,
    label: name,
    process: input.process,
    processLabel: result.changeType || input.process,
    input: { ...input, label: name },
    path: result.processPath
  };
}
function printableHxSections(moduleData) {
  return reportSections(moduleData).filter(section => !/^(?:\d+\.\s*)?(Berichtszusammenfassung|Eingaben)$/.test(section.title));
}
const summerRecord = savedHxRecord('Test Sommer', {
  tempC: 32,
  rhPercent: 40,
  targetTempC: 21,
  targetRhPercent: 55,
  airVolumeM3h: 20,
  heatingSupplyTempC: 45,
  heatingReturnTempC: 30,
  coolingSupplyTempC: 8,
  coolingReturnTempC: 10,
  process: 'cool-dehumidify'
});
const winterRecord = savedHxRecord('Test Winter', {
  tempC: -12,
  rhPercent: 90,
  targetTempC: 21,
  targetRhPercent: 50,
  airVolumeM3h: 20,
  heatingSupplyTempC: 45,
  heatingReturnTempC: 30,
  coolingSupplyTempC: 8,
  coolingReturnTempC: 10,
  process: 'adiabatic'
});
const hxReportDto = hxModule.report({ savedProcesses: [summerRecord, winterRecord] });
assert.equal(hxReportDto.charts.length, 2, 'each saved h,x process must expose its own chart');
assert.equal(hxReportDto.chartSvg, hxReportDto.charts[0].svg, 'single-chart fallback remains the first saved process chart');
assert.deepEqual(hxReportDto.sections.map(section => section.title), ['Test Sommer', 'Test Winter']);
assert.deepEqual(hxReportDto.sections.map(section => section.chartIndex), [0, 1]);
assert.match(hxReportDto.charts[0].svg, /<svg/);
assert.match(hxReportDto.charts[1].svg, /<svg/);
assert.notEqual(hxReportDto.charts[0].svg, hxReportDto.charts[1].svg, 'saved process charts must remain record-specific');

const hxModuleData = {
  id: 'hx-diagram',
  title: 'h,x-Diagramm',
  shortTitle: 'h,x-Diagramm',
  reportDto: hxReportDto,
  reportSource: 'typed-dto'
};
assert.deepEqual(printableHxSections(hxModuleData).map(section => section.title), ['Test Sommer', 'Test Winter']);
assert.deepEqual(printableHxSections(hxModuleData).map(section => section.chartIndex), [0, 1]);

const pdfLayoutSource = readFileSync(new URL('../js/core/pdf/pdfLayout.js', import.meta.url), 'utf8');
assert.match(pdfLayoutSource, /this\.standardSection\(section\);\s*this\.sectionChartBlock\(section, index\);/,
  'h,x PDF layout must render each saved record before its corresponding diagram');
assert.doesNotMatch(pdfLayoutSource, /if \(isHxDiagram\) \{\s*this\.chartBlock\(\);\s*sections\.forEach\(section => this\.standardSection\(section\)\);/,
  'h,x PDF layout must not render one combined diagram block before all saved records');

hxModule.calculate({
  tempC: 30,
  rhPercent: 50,
  targetTempC: 18,
  targetRhPercent: 60,
  airVolumeM3h: 2000,
  heatingSupplyTempC: 45,
  heatingReturnTempC: 30,
  coolingSupplyTempC: 8,
  coolingReturnTempC: 10,
  process: 'cool-dehumidify'
});
const hxReportWithoutStoredPath = hxModule.report({
  savedProcesses: [{
    name: 'Gespeicherter Prozess ohne Diagrammdaten',
    process: 'heat',
    input: {
      label: 'Gespeicherter Prozess ohne Diagrammdaten',
      airVolumeM3h: 1000,
      tempC: 20,
      rhPercent: 40,
      targetTempC: 24,
      targetRhPercent: 40
    }
  }]
});
assert.equal(hxReportWithoutStoredPath.charts.length, 0, 'saved records without stored path must not inherit the last displayed h,x diagram');
assert.equal(hxReportWithoutStoredPath.sections[0].chartIndex, undefined);

console.log('h,x enthalpy-based heating, cooling, evaporator power and PDF record/chart regression ok');
