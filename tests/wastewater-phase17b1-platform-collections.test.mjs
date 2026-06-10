import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import schema from '../js/modules/wastewater/schema.js';
import { renderFormSchema } from '../js/core/formSchema.js';
import wastewater from '../js/modules/wastewater/index.js';

const schemaSource = readFileSync(new URL('../js/modules/wastewater/schema.js', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../js/modules/wastewater/controller.js', import.meta.url), 'utf8');
const schemaRendererSource = readFileSync(new URL('../js/core/schemaRenderer.js', import.meta.url), 'utf8');
const collectionRendererSource = readFileSync(new URL('../js/platform/collectionRenderer/index.js', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');

assert.ok(schema.fields.some(field => field.key === 'fixtureAdd' && field.collection === 'fixtures' && !field.action), 'Wastewater action must declare collection intent, not a bespoke action name.');
assert.doesNotMatch(schemaSource, /collection:fixtures:add|platform:wastewater|dw-/);
assert.doesNotMatch(controllerSource, /collection:fixtures:add|platform:wastewater/);
assert.match(schemaRendererSource, /renderPlatformCollection\(def, state\)/, 'Schema renderer must delegate collection markup to the platform collection renderer.');
assert.match(collectionRendererSource, /export function renderCollection/, 'Platform collection renderer must expose renderCollection.');
assert.match(runtimeSource, /'platform:collection:add'/, 'Runtime must own generic collection add action.');
assert.match(runtimeSource, /'platform:collection:delete'/, 'Runtime must own generic collection delete action.');

const html = renderFormSchema(schema, {
  ...wastewater.initialState,
  fixtures: [{ id:'f1', typeId:'washbasin', quantity:'2' }]
});
assert.match(html, /data-tc-action="platform:collection:add"/);
assert.match(html, /data-collection="fixtures"/);
assert.match(html, /tc-collection-list/);
assert.doesNotMatch(html, /dw-consumer/);

console.log('wastewater phase17b1 platform collections regression ok');
