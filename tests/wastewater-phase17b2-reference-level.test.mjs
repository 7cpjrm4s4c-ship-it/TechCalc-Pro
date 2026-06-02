import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import schema from '../js/modules/wastewater/schema.js';
import wastewater from '../js/modules/wastewater/index.js';
import { renderPlatformModuleView } from '../js/platform/moduleRenderer/index.js';

const schemaSource = readFileSync(new URL('../js/modules/wastewater/schema.js', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../js/modules/wastewater/controller.js', import.meta.url), 'utf8');
const schemaRendererSource = readFileSync(new URL('../js/core/schemaRenderer.js', import.meta.url), 'utf8');
const collectionModelSource = readFileSync(new URL('../js/platform/collectionModel/index.js', import.meta.url), 'utf8');
const savedRecordModelSource = readFileSync(new URL('../js/platform/savedRecordModel/index.js', import.meta.url), 'utf8');

assert.doesNotMatch(schemaSource, /from '\.\/controller\.js'|calculate\(/, 'Wastewater schema must not depend on controller code or recalculate collection presentation itself.');
assert.match(schemaSource, /from '\.\/lineModel\.js'/, 'Line type view state must be separated from the runtime controller.');
assert.match(schemaRendererSource, /options\.result/, 'Schema renderer must pass calculated result context into platform field rendering.');
assert.match(collectionModelSource, /upsertCollectionRecord/, 'Collection mutation helpers must live in the platform.');
assert.match(savedRecordModelSource, /createStateSnapshot/, 'Saved-record snapshot helpers must live in the platform.');
assert.match(controllerSource, /platform\/collectionModel/, 'Wastewater controller must use platform collection mutations.');
assert.match(controllerSource, /platform\/savedRecordModel/, 'Wastewater controller must use platform saved-record model helpers.');
assert.doesNotMatch(controllerSource, /function lineFamilyValue|function lineVentilationValue|function resolveLineType/, 'Wastewater controller must not own line presentation transforms.');

const state = {
  ...wastewater.initialState,
  fixtures: [{ id:'f1', typeId:'washbasin', quantity:'2' }]
};
const result = wastewater.calculate(state);
const resultModel = wastewater.results(state, result);
const html = renderPlatformModuleView({
  config: wastewater.config,
  schema,
  state,
  result,
  resultModel,
  savedRecords: wastewater.savedRecords(state, result)
});
assert.match(html, /tc-collection-list/);
assert.match(html, /ΣDU/);
assert.match(html, /Waschbecken/);
assert.doesNotMatch(html, /wastewater-|dw-consumer|platform:wastewater|collection:fixtures:add/);

console.log('wastewater phase17b2 reference-level regression ok');
