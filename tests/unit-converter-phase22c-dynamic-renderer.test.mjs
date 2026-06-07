import fs from 'node:fs';
import assert from 'node:assert/strict';

const index = fs.readFileSync('js/modules/unit-converter/index.js', 'utf8');
const config = fs.readFileSync('js/modules/unit-converter/config.js', 'utf8');
const dynamic = fs.readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');

assert.match(index, /createUnitConverterDynamicRenderer/, 'unit converter must use the platform dynamic renderer');
assert.match(index, /data-unit-dynamic=\"conversion\"/, 'conversion island must be declared');
assert.match(index, /data-unit-dynamic=\"result\"/, 'result island must be declared');
assert.match(index, /dynamicUpdate:\s*updateUnitConverterDynamic/, 'unit converter must wire dynamicUpdate');
assert.match(index, /isDynamicAction:\s*isDynamicUnitConverterAction/, 'unit converter must enable dynamic actions');
assert.doesNotMatch(index, /isDynamicAction:\s*\(\)\s*=>\s*false/, 'unit converter must not depend on forced full renders after 22C');
assert.match(dynamic, /export function createUnitConverterDynamicRenderer/, 'platform dynamic renderer must export unit converter renderer');
assert.match(dynamic, /data-unit-dynamic=\"conversion\"/, 'dynamic renderer must update conversion island');
assert.match(dynamic, /data-unit-dynamic=\"result\"/, 'dynamic renderer must update result island');
assert.match(config, /phase-22c-dynamic-renderer/, 'migrationStatus must include phase-22c-dynamic-renderer');

const module = await import('../js/modules/unit-converter/index.js');
assert.equal(typeof module.default.mount, 'function', 'unit converter must remain mountable');
