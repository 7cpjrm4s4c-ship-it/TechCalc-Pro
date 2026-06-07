import fs from 'node:fs';
import assert from 'node:assert/strict';

const index = fs.readFileSync('js/modules/unit-converter/index.js', 'utf8');
const config = fs.readFileSync('js/modules/unit-converter/config.js', 'utf8');
const results = fs.readFileSync('js/modules/unit-converter/results.js', 'utf8');

assert.match(index, /renderResultModel\s*\(/, 'unit converter must render results via platform renderResultModel');
assert.match(index, /buildUnitConverterResultModel/, 'unit converter view must use a dedicated result model');
assert.doesNotMatch(index, /resultRows/, 'unit converter view must not use legacy resultRows directly');
assert.match(results, /buildUnitConverterResultModel/, 'unit converter must expose buildUnitConverterResultModel');
assert.match(config, /phase-22b3-result-renderer/, 'migrationStatus must include phase-22b3-result-renderer');

const resultModule = await import('../js/modules/unit-converter/results.js');
const model = resultModule.buildUnitConverterResultModel({ category: 'pressure', value: '1', from: 'bar', to: 'kPa' }, 'green');
assert.equal(model.primary.title, 'Umrechnung');
assert.equal(model.primary.primary.value, '100');
assert.equal(model.primary.primary.unit, 'kPa');
assert.ok(model.groups.some(group => group.title === 'Alle Werte'), 'all values group must be part of the result model');

const module = await import('../js/modules/unit-converter/index.js');
assert.equal(typeof module.default.mount, 'function', 'platform module must remain mountable');
