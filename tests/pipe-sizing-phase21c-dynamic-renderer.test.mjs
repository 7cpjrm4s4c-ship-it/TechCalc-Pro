import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPipeSizingDynamicRenderer } from '../js/platform/dynamicRenderer/index.js';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');
const dynamicRenderer = readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');

assert.match(dynamicRenderer, /createPipeSizingDynamicRenderer/, 'platform dynamicRenderer must expose pipe-sizing dynamic renderer');
assert.match(index, /createPipeSizingDynamicRenderer/, 'pipe-sizing must use the platform dynamic renderer');
assert.match(index, /dynamicUpdate:\s*updatePipeSizingDynamic/, 'pipe-sizing must register dynamicUpdate');
assert.match(index, /isDynamicAction:\s*isDynamicPipeSizingAction/, 'pipe-sizing must register isDynamicAction');
assert.match(index, /data-pipe-dynamic="input"/, 'pipe-sizing input island must be marked');
assert.match(index, /data-pipe-dynamic="saved-records"/, 'pipe-sizing saved-record island must be marked');
assert.match(index, /data-pipe-dynamic="result"/, 'pipe-sizing result island must be marked');
assert.match(config, /phase-21c-dynamic-renderer/, 'pipe-sizing config must record phase 21C migration');

const renderer = createPipeSizingDynamicRenderer({
  calculate: s => ({ dn: 25, system: { label: s.systemId || 'System' } }),
  renderInput: s => `<input data-field="flowValue" value="${s.flowValue || ''}">`,
  renderSavedPanel: s => `<section>${s.pipeName || ''}</section>`,
  renderResult: (_s, r) => `<strong>DN ${r.dn}</strong>`
});
assert.equal(typeof renderer.update, 'function', 'pipe-sizing dynamic renderer must return update function');

console.log('pipe-sizing phase21c dynamic-renderer regression ok');
