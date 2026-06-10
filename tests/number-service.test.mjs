import assert from 'node:assert/strict';
import { numberService, parseNumber, formatNumber, toInputNumber } from '../js/core/numberService.js';

const cases = [
  ['2.500', 2500],
  ['2.500,5', 2500.5],
  ['2,5', 2.5],
  ['2500', 2500],
  ['1 234,56', 1234.56],
  ['1.234.567,89', 1234567.89],
  ['0,75', 0.75],
  ['-1.250,5', -1250.5]
];

for (const [input, expected] of cases) {
  assert.equal(parseNumber(input), expected, `parseNumber(${input})`);
  assert.equal(numberService.parse(input), expected, `numberService.parse(${input})`);
}

assert.equal(formatNumber(2500.5, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), '2.500,5');
assert.equal(toInputNumber(2500.5), '2500,5');
assert.equal(numberService.parse('abc', { fallback: 42 }), 42);
console.log('number-service regression ok');
