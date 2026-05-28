import fs from 'node:fs';
import assert from 'node:assert/strict';

const state = fs.readFileSync('js/core/state.js', 'utf8');
assert.match(state, /createStore/, 'Module state must be backed by central store.');
assert.match(state, /registerModuleStore/, 'Module stores must register centrally.');

const pipeline = fs.readFileSync('js/core/eventPipeline.js', 'utf8');
assert.match(pipeline, /bindCentralEventPipeline/, 'Central event pipeline must be available.');
assert.match(pipeline, /field:change:immediate/, 'Select/change events must commit immediately.');
assert.match(pipeline, /field:blur/, 'Input blur must commit through central pipeline.');
assert.match(pipeline, /field:enter/, 'Enter must commit through central pipeline.');
assert.match(pipeline, /segment:select/, 'Segmented switches must use central event action.');

const renderer = fs.readFileSync('js/core/renderer.js', 'utf8');
assert.match(renderer, /bindCentralEventPipeline\(root, state/, 'Common input binding must delegate to central event pipeline.');

console.log('central store and event pipeline regression ok');
