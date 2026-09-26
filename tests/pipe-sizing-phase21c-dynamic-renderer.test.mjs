import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPipeSizingDynamicRenderer } from '../core/ui/dynamicRenderer.js';

const index = readFileSync('modules/pipe-sizing/index.js', 'utf8');
const view = readFileSync('modules/pipe-sizing/view.js', 'utf8');
const dynamicRenderer = readFileSync('core/ui/dynamicRenderer.js', 'utf8');

assert.equal(typeof createPipeSizingDynamicRenderer, 'function', 'core must export pipe-sizing dynamic renderer');
assert.match(index, /createPipeSizingDynamicRenderer/, 'pipe-sizing must use the dynamic renderer');
assert.match(index, /dynamicUpdate:\s*updatePipeSizingDynamic/, 'pipe-sizing must register dynamicUpdate');
assert.match(index, /isDynamicAction:\s*isDynamicPipeSizingAction/, 'pipe-sizing must register isDynamicAction');
assert.match(view, /data-pipe-dynamic="input"/, 'pipe-sizing input island must be marked');
assert.match(view, /data-pipe-dynamic="saved-records"/, 'pipe-sizing saved-record island must be marked');
assert.match(view, /data-pipe-dynamic="result"/, 'pipe-sizing result island must be marked');
assert.match(dynamicRenderer, /function createPipeSizingDynamicRenderer/, 'dynamic renderer implementation must be centralized');

console.log('pipe-sizing phase21c dynamic renderer regression ok');
