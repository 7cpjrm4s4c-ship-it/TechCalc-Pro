import assert from 'node:assert/strict';

import {
  getDataStatus,
  getDataVersions,
  getEN378SafetyData,
  listEN378SafetyData,
  listRefrigerants
} from '../js/utils/refrigerants/index.js';

const refrigerants = listRefrigerants();
const safetyData = listEN378SafetyData();

assert.equal(getDataStatus().en378SafetyData, 'specified');
assert.equal(getDataVersions().en378SafetyData, '1.0.0');
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

console.log('EN 378 refrigerant safety data tests passed.');
