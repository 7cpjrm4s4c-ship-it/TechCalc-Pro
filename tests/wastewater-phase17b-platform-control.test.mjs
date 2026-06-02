import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import wastewater from '../js/modules/wastewater/index.js';
import schema from '../js/modules/wastewater/schema.js';
import { calculate } from '../js/modules/wastewater/logic.js';

const indexSource = readFileSync(new URL('../js/modules/wastewater/index.js', import.meta.url), 'utf8');
const moduleSources = ['index.js','schema.js','controller.js','results.js']
  .map(file => readFileSync(new URL(`../js/modules/wastewater/${file}`, import.meta.url), 'utf8'))
  .join('\n');

assert.equal(typeof wastewater.mount, 'function');
assert.equal(typeof wastewater.results, 'function');
assert.equal(typeof wastewater.savedRecords, 'function');
assert.ok(wastewater.controller?.collections?.fixtures);
assert.ok(schema.fields.some(field => field.type === 'collection' && field.key === 'fixtures'));
assert.ok(schema.fields.some(field => field.type === 'action' && field.action === 'collection:fixtures:add'));

assert.doesNotMatch(indexSource, /renderModuleShell|mountModule|addEventListener|querySelector|innerHTML|data-wastewater|wastewater-/);
assert.doesNotMatch(moduleSources, /renderResult|resultCard|noticeCard|data-wastewater/);

const result = calculate({
  ...wastewater.initialState,
  lineType: 'branch-unvented',
  fixtures: [{ id:'f1', typeId:'washbasin', quantity:'2' }]
});
const model = wastewater.results(wastewater.initialState, result);
assert.ok(model.primary);
assert.ok(Array.isArray(model.groups));
assert.ok(Array.isArray(model.notices));

console.log('wastewater phase17b platform-control regression ok');
