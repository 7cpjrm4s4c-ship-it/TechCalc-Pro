import assert from 'node:assert/strict';

import {
  assertFGasesEN378Coverage,
  canAssessRefrigerantWithEN378,
  getUnsupportedFGasesRefrigerants,
  listFGasesEN378Coverage
} from '../js/modules/en-378-safety-check/refrigerantCoverage.js';
import { getEN378SafetyData, listRefrigerants } from '../js/utils/refrigerants/index.js';

const coverage = listFGasesEN378Coverage();
const refrigerants = listRefrigerants();

assert.equal(coverage.length, refrigerants.length);
assert.equal(getUnsupportedFGasesRefrigerants().length, 0);
assert.equal(assertFGasesEN378Coverage(), true);
assert.equal(canAssessRefrigerantWithEN378('R-513A'), true);
assert.equal(canAssessRefrigerantWithEN378('HFKW-32'), true);
assert.equal(getEN378SafetyData('R-32').safetyClass, 'A2L');
assert.equal(getEN378SafetyData('R513A').safetyClass, 'A1');
assert.ok(coverage.some(entry => entry.refrigerantId === 'R-513A' && entry.hasEN378SafetyData));

console.log('EN 378 refrigerant coverage tests passed.');
