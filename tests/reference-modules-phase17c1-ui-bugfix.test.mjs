import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import wastewater from '../js/modules/wastewater/index.js';
import rainwater from '../js/modules/rainwater/index.js';
import { view as rainwaterView } from '../js/modules/rainwater/view.js';
import { renderFormSchema } from '../js/core/formSchema.js';

const savedRecordsSource = readFileSync(new URL('../js/core/savedRecords.js', import.meta.url), 'utf8');
const collectionRendererSource = readFileSync(new URL('../js/platform/collectionRenderer/index.js', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

const lineType = wastewater.schema.fields.find(field => field.key === 'lineType');
assert.equal(lineType?.type, 'select', 'Schmutzwasser Leitungsart must be a platform dropdown.');
assert.equal(lineType?.commit, 'immediate', 'Schmutzwasser Leitungsart dropdown must rerender dependent fields immediately.');
assert.ok(Array.isArray(lineType?.options) && lineType.options.length >= 8, 'Schmutzwasser Leitungsart dropdown must expose all line types.');
assert.ok(!wastewater.schema.fields.some(field => field.key === 'lineFamily' || field.key === 'lineVentilation'), 'Legacy line segment fields must be removed from the schema.');
assert.ok(!wastewater.controller.segments, 'Legacy line segment controller handlers must be removed.');

const wastewaterHtml = renderFormSchema(wastewater.schema, {
  ...wastewater.initialState,
  fixtures: [{ id:'fixture-1', typeId:'bathtub', quantity:'5' }, { id:'fixture-2', typeId:'wc6', quantity:'2' }]
}, { result: wastewater.calculate({ ...wastewater.initialState, fixtures: [{ id:'fixture-1', typeId:'bathtub', quantity:'5' }, { id:'fixture-2', typeId:'wc6', quantity:'2' }] }) });
assert.match(wastewaterHtml, /<select[^>]+id="lineType"/, 'Line type must render as a native select.');
assert.match(wastewaterHtml, /tc-consumer-row--editable/, 'Collection rows must use the editable platform row contract.');
assert.match(collectionRendererSource, /tc-collection-row__content/, 'Collection renderer must expose a stable content column for quantity alignment.');
assert.match(cssSource, /tc-collection-row\.tc-consumer-row--editable[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) 82px 38px/, 'Platform CSS must stabilize quantity/delete columns.');

assert.match(savedRecordsSource, /data-saved-record-id="\$\{esc\(item\.id\)\}"/, 'Saved cards must expose an explicit platform record id.');
assert.match(savedRecordsSource, /\$\{toggleAttr\}="\$\{esc\(item\.id\)\}"/, 'Saved-card toggles must carry the record id for robust mobile selection.');

function renderRainwater(state) {
  return rainwaterView(state);
}
const roofHtml = renderRainwater({ ...rainwater.initialState, surfaceMode:'roof', calculationType:'roof' });
const propertyPatch = rainwater.controller.segments.fields.surfaceMode.patch('property', rainwater.initialState);
const propertyHtml = renderRainwater({ ...rainwater.initialState, ...propertyPatch });
assert.match(roofHtml, /Regenspende r\(5,5\)/, 'Roof mode must show r(5,5).');
assert.doesNotMatch(roofHtml, /Regenspende r\(5,2\)/, 'Roof mode must not show r(5,2).');
assert.match(propertyHtml, /Regenspende r\(5,2\)/, 'Property mode must rerender to r(5,2) immediately.');
assert.doesNotMatch(propertyHtml, /Regenspende r\(5,5\)/, 'Property mode must no longer display r(5,5) after switch.');

console.log('phase17c1 reference-module UI bugfix regression ok');
