import assert from 'node:assert/strict';
import { convert, unitCategories } from '../js/utils/units.js';
import { unitsFor } from '../js/modules/unit-converter/logic.js';
import { normalizeUnitSelection, unitConverterAllValueRows } from '../js/modules/unit-converter/results.js';

const BTU_PER_HOUR_TO_WATT = 0.2930710701722;

assert.equal(unitCategories.power.units['BTU/h'], BTU_PER_HOUR_TO_WATT);
assert.equal(unitsFor('power').at(-1), 'BTU/h');

assert.equal(convert('power', '1', 'BTU/h', 'W'), BTU_PER_HOUR_TO_WATT);
assert.ok(Math.abs(convert('power', '1', 'W', 'BTU/h') - (1 / BTU_PER_HOUR_TO_WATT)) < 1e-12);
assert.equal(convert('power', '1000', 'BTU/h', 'kW'), BTU_PER_HOUR_TO_WATT);

const normalized = normalizeUnitSelection({ category: 'power', from: 'BTU/h', to: 'W' });
assert.equal(normalized.from, 'BTU/h');
assert.equal(normalized.to, 'W');

const rows = unitConverterAllValueRows({ category: 'power', value: '1', from: 'BTU/h', to: 'W' });
assert.ok(rows.some(row => row.label === 'W' && row.value === '0,29' && row.unit === 'W'));
assert.ok(rows.some(row => row.label === 'BTU/h' && row.value === '1' && row.unit === 'BTU/h'));

console.log('Unit converter BTU/h regression ok');
