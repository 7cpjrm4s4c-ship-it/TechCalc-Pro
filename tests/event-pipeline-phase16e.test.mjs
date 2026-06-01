import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const eventPipeline = readFileSync('js/core/eventPipeline.js', 'utf8');
assert.match(eventPipeline, /export function registerPipelineCommitHandler/, 'eventPipeline must expose central commit hooks');
assert.match(eventPipeline, /__tcCommitHandlers/, 'eventPipeline must keep commit hooks inside the platform');

for (const file of ['js/modules/buffer-storage/index.js', 'js/modules/pressure-holding/index.js']) {
  const src = readFileSync(file, 'utf8');
  assert.match(src, /bindSavedRecordWorkflow/, `${file} must use the central saved-record workflow`);
  assert.doesNotMatch(src, /\.addEventListener\s*\(/, `${file} must not bind module-local DOM events`);
}

const rainwater = readFileSync('js/modules/rainwater/index.js', 'utf8');
assert.match(rainwater, /registerPipelineCommitHandler/, 'rainwater lookup hydration must use pipeline commit hook');
assert.doesNotMatch(rainwater, /addEventListener\('tc:commit'/, 'rainwater must not bind tc:commit directly');

console.log('phase16e event pipeline consolidation ok');
