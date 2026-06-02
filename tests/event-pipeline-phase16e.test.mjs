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
const controller = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const runtime = readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
assert.doesNotMatch(rainwater, /registerPipelineCommitHandler/, 'rainwater index must not own lookup hydration hooks');
assert.match(runtime, /registerPipelineCommitHandler/, 'platform runtime must use pipeline commit hook for lookup hydration');
assert.match(controller, /platform:lookup-hydration/, 'lookup hydration must use the platform namespace.');
assert.doesNotMatch(rainwater, /addEventListener\('tc:commit'/, 'rainwater must not bind tc:commit directly');

console.log('phase16e event pipeline consolidation ok');
