import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schema = readFileSync('js/modules/rainwater/schema.js', 'utf8');
const controller = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const results = readFileSync('js/modules/rainwater/results.js', 'utf8');
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
assert.match(controller, /attrs:\s*\{\s*loadAttr:\s*'data-line-select',\s*toggleAttr:\s*'data-line-toggle',\s*deleteAttr:\s*'data-line-delete'\s*\}/, 'Rainwater controller must use the heating-style saved-record attrs.');
assert.doesNotMatch(results, /data-rainwater/, 'Rainwater saved-record data must not use module hooks.');
assert.match(results, /loadAttr:\s*'data-line-select'/, 'Rainwater saved-record data must use heating-style load attr.');

console.log('rainwater phase17a.6 platform-control decoupling ok');
