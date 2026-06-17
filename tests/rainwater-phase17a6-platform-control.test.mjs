import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schema = readFileSync('js/modules/rainwater/schema.js', 'utf8');
const controller = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const results = readFileSync('js/modules/rainwater/results.js', 'utf8');
const viewModel = readFileSync('js/modules/rainwater/viewModel.js', 'utf8');
const schemaRenderer = readFileSync('js/core/schemaRenderer.js', 'utf8');
const formSchema = readFileSync('js/core/formSchema.js', 'utf8');

assert.doesNotMatch(schema, /FIELD_TYPES\.CUSTOM|inlineStats|afterHtml|<div class=|<a class=|esc\(/, 'Rainwater schema must not contain module-local mini HTML renderers.');
assert.match(schema, /FIELD_TYPES\.NOTICE/, 'Rainwater notices must be described as platform schema data.');
assert.match(schema, /FIELD_TYPES\.STATS/, 'Rainwater inline stats must be described as platform schema data.');
assert.match(schema, /actions:\s*\[/, 'Schema group links must be data-driven platform actions.');
assert.match(formSchema, /NOTICE:\s*'notice'/, 'Form schema must expose notice field type.');
assert.match(formSchema, /STATS:\s*'stats'/, 'Form schema must expose stats field type.');
assert.match(schemaRenderer, /function renderNotice/, 'Schema renderer must own notice rendering.');
assert.match(schemaRenderer, /function renderStats/, 'Schema renderer must own stats rendering.');
assert.match(schemaRenderer, /function renderGroupActions/, 'Schema renderer must own group action rendering.');
assert.doesNotMatch(controller, /rainwater:|platform:rainwater|preCreateAction|preUpdateAction/, 'Rainwater controller must not contain module-specific platform action names.');
assert.match(controller, /createLineSectionController\s*\(/, 'Rainwater controller must use the heating-style line-section saved-record controller.');
assert.doesNotMatch(controller, /attrs:\s*\{/, 'Rainwater controller must not keep legacy saved-record attr configuration.');
assert.doesNotMatch(results, /data-rainwater/, 'Rainwater saved-record data must not use module hooks.');
assert.doesNotMatch(results, /export function savedRecords/, 'Rainwater results must not keep legacy saved-record data renderer.');
assert.match(viewModel, /rainwaterSavedController\.renderCard/, 'Rainwater saved panel must be rendered through the line-section controller.');

console.log('rainwater phase17a.6 platform-control decoupling ok');
