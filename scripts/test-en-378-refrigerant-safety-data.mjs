import assert from 'node:assert/strict';

import {
  getDataStatus,
  getDataVersions,
  getEN378SafetyData,
  listEN378SafetyData,
  listRefrigerants
} from '../core/data/refrigerants.js';

const refrigerants = listRefrigerants();
const safetyData = listEN378SafetyData();

assert.equal(getDataStatus().en378SafetyData, 'specified');
assert.equal(getDataVersions().en378SafetyData, '1.1.0');
assert.equal(safetyData.length, refrigerants.length);

for (const refrigerant of refrigerants) {
  const entry = getEN378SafetyData(refrigerant.id);
  assert.ok(entry, `Missing EN 378 safety data for ${refrigerant.id}`);
  assert.equal(entry.refrigerantId, refrigerant.id);
  assert.ok(['A', 'B'].includes(entry.toxicityClass));
  assert.ok(['1', '2L', '2', '3'].includes(entry.flammabilityClass));
  assert.equal(typeof entry.practicalLimitKgM3, 'number');
  assert.equal(typeof entry.atelOdlKgM3, 'number');
  assert.equal(typeof entry.molarMassKgKmol, 'number');
  assert.ok(entry.source.sourceId);
}

assert.equal(getEN378SafetyData('R32').refrigerantId, 'HFKW-32');
assert.equal(getEN378SafetyData('R-32').safetyClass, 'A2L');
assert.equal(getEN378SafetyData('R-717').toxicityClass, 'B');
assert.equal(getEN378SafetyData('R-290').flammabilityClass, '3');
assert.equal(getEN378SafetyData('R-744').lflKgM3, null);
assert.doesNotThrow(() => JSON.stringify(safetyData));

// EN 378-1:2021-06, Tabelle E.1: Selbstentzündungstemperaturen (auto-ignition temperatures)
assert.equal(getEN378SafetyData('HFKW-32').autoIgnitionTemperatureC, 648);
assert.equal(getEN378SafetyData('HFKW-134a').autoIgnitionTemperatureC, 743);
assert.equal(getEN378SafetyData('R-717').autoIgnitionTemperatureC, 630);
assert.equal(getEN378SafetyData('R-290').autoIgnitionTemperatureC, 470);
assert.equal(getEN378SafetyData('R-600').autoIgnitionTemperatureC, 365);
assert.equal(getEN378SafetyData('R-600a').autoIgnitionTemperatureC, 460);
assert.equal(getEN378SafetyData('R-1270').autoIgnitionTemperatureC, 455);
assert.equal(getEN378SafetyData('HFKW-152a').autoIgnitionTemperatureC, 455);
assert.equal(getEN378SafetyData('HFKW-1234yf').autoIgnitionTemperatureC, 405);
assert.equal(getEN378SafetyData('HFKW-1234ze (E)').autoIgnitionTemperatureC, 368);
assert.equal(getEN378SafetyData('HFKW-125').autoIgnitionTemperatureC, 733);
assert.equal(getEN378SafetyData('HFKW-143a').autoIgnitionTemperatureC, 750);
assert.equal(getEN378SafetyData('R-744').autoIgnitionTemperatureC, null);
assert.ok(!('criticalTemperatureC' in getEN378SafetyData('HFKW-32')), 'criticalTemperatureC must be renamed to autoIgnitionTemperatureC');

console.log('EN 378 refrigerant safety data tests passed.');
