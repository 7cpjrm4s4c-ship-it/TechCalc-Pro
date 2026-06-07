import fs from 'node:fs';
import assert from 'node:assert/strict';

const index = fs.readFileSync('js/modules/unit-converter/index.js', 'utf8');
const viewModel = fs.readFileSync('js/modules/unit-converter/viewModel.js', 'utf8');
const config = fs.readFileSync('js/modules/unit-converter/config.js', 'utf8');
const results = fs.readFileSync('js/modules/unit-converter/results.js', 'utf8');

assert.match(viewModel, /renderResultModel\s*\(/, 'unit converter must render results via platform renderResultModel');
assert.match(viewModel, /buildUnitConverterResultModel/, 'unit converter view-model must use a dedicated result model');
assert.doesNotMatch(index + viewModel, /resultRows/, 'unit converter must not use legacy resultRows directly');
assert.match(results, /buildUnitConverterResultModel/, 'unit converter must expose buildUnitConverterResultModel');
assert.match(config, /phase-22b3-result-renderer/, 'migrationStatus must include phase-22b3-result-renderer');

const resultModule = await import('../js/modules/unit-converter/results.js');
const model = resultModule.buildUnitConverterResultModel({ category: 'pressure', value: '1', from: 'bar', to: 'kPa' }, 'green');
assert.equal(model.primary, undefined, 'unit converter must not render a separate conversion result card');
assert.ok(model.groups.some(group => group.title === 'Alle Werte'), 'all values group must be part of the result model');
const allValues = model.groups.find(group => group.title === 'Alle Werte');
assert.ok(allValues.rows.some(row => row.label === 'kPa' && row.value === '100'), 'all values group must contain converted target values');

const module = await import('../js/modules/unit-converter/index.js');
assert.equal(typeof module.default.mount, 'function', 'platform module must remain mountable');
