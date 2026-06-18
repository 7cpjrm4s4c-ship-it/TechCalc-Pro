import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { commitAllFields } from '../js/core/eventPipeline.js';

const eventPipeline = readFileSync('js/core/eventPipeline.js', 'utf8');

assert.match(eventPipeline, /function isSameFieldValue\(a, b\)/, 'Event pipeline must compare field values before emitting surface commits.');
assert.match(eventPipeline, /if \(!Object\.keys\(patch\)\.length\) return false;/, 'commitAllFields must reject no-op surface commits.');
assert.match(eventPipeline, /const committed = commitAllFields\(root, state, \{ action: 'surface:confirm', notify: true \}\);/, 'surface confirm must inspect whether fields actually changed.');
assert.match(eventPipeline, /if \(hasDeferredInput\) renderDeferred\(true\);/, 'surface confirm must still flush deferred input without no-op surface churn.');

function field(name, value) {
  return { dataset: { field: name }, value };
}

let setCalls = [];
const state = {
  get: () => ({ unitName: 'Bad', unitCount: '1' }),
  set: (patch, meta) => setCalls.push({ patch, meta })
};

const noopRoot = {
  querySelectorAll: () => [field('unitName', 'Bad'), field('unitCount', '1')]
};

assert.equal(commitAllFields(noopRoot, state, { action: 'surface:confirm', notify: true }), false, 'No-op field commits must return false.');
assert.equal(setCalls.length, 0, 'No-op field commits must not notify the store.');

const changedRoot = {
  querySelectorAll: () => [field('unitName', 'Bad EG'), field('unitCount', '1')]
};

assert.equal(commitAllFields(changedRoot, state, { action: 'surface:confirm', notify: true }), true, 'Changed field commits must return true.');
assert.deepEqual(setCalls[0].patch, { unitName: 'Bad EG' }, 'Only changed fields may be committed.');
assert.equal(setCalls[0].meta.action, 'surface:confirm');
assert.equal(setCalls[0].meta.notify, true);

console.log('phase37c2e no-op surface confirm suppression guard passed');
