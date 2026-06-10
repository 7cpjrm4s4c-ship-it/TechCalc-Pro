import fs from 'node:fs';
import assert from 'node:assert/strict';

const config = fs.readFileSync('js/modules/unit-converter/config.js', 'utf8');
const results = fs.readFileSync('js/modules/unit-converter/results.js', 'utf8');

assert.match(config, /phase-22c1-result-cleanup/, 'migrationStatus must include phase-22c1-result-cleanup');
assert.doesNotMatch(results, /title:\s*['"]Umrechnung['"]/, 'unit converter must not expose a separate Umrechnung result card');

const { buildUnitConverterResultModel } = await import('../js/modules/unit-converter/results.js');
const model = buildUnitConverterResultModel({ category: 'pressure', value: '1', from: 'bar', to: 'kPa' }, 'green');
assert.equal(model.primary, undefined, 'result model must omit primary conversion card');
assert.equal(model.groups.length, 1, 'result model should only render the all-values card');
assert.equal(model.groups[0].title, 'Alle Werte', 'remaining result card must be Alle Werte');
assert.ok(model.groups[0].rows.some(row => row.label === 'kPa' && row.value === '100'), 'all-values card must preserve conversion output');
