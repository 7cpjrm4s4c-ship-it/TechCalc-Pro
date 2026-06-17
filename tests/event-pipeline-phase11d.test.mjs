import fs from 'node:fs';
import assert from 'node:assert/strict';

const pipeline = fs.readFileSync('js/core/eventPipeline.js', 'utf8');
const binding = fs.readFileSync('js/core/stateBinding.js', 'utf8');
const renderer = fs.readFileSync('js/core/renderer.js', 'utf8');
const savedRecords = fs.readFileSync('js/core/savedRecords.js', 'utf8');

assert.match(pipeline, /readElementValue/, 'central pipeline must own field value extraction');
assert.match(pipeline, /registerCentralActions/, 'central pipeline must expose action registration');
assert.match(pipeline, /tc:commit/, 'central pipeline must emit commit events for lifecycle integration');
assert.match(pipeline, /field:change:immediate/, 'select/master-data changes must commit immediately');
assert.match(pipeline, /field:blur[^\n]+notify: true/s, 'blur must trigger calculation immediately');
assert.match(pipeline, /field:enter[\s\S]+commitElementField\(state, el, \{ action, notify: true, root \}\)/, 'Enter must trigger calculation immediately');
assert.match(pipeline, /segment:select/, 'switches/segments must use one central action');
assert.match(binding, /root\.__tcCentralEventPipelineBound/, 'legacy state binding must stand down when central pipeline is active');
assert.match(renderer, /data-tc-action="segment"/, 'segment controls must be marked as central actions');
assert.match(savedRecords, /data-tc-action="saved:load"/, 'saved cards must be marked as central load actions');
assert.match(savedRecords, /data-tc-action="saved:toggle"/, 'saved toggles must be marked as central toggle actions');
assert.match(savedRecords, /data-tc-action="saved:delete"/, 'saved deletes must be marked as central delete actions');

console.log('phase 11D event pipeline regression ok');
