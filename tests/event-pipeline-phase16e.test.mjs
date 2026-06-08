import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const eventPipeline = readFileSync('js/core/eventPipeline.js', 'utf8');
assert.match(eventPipeline, /export function registerPipelineCommitHandler/, 'eventPipeline must expose central commit hooks');
assert.match(eventPipeline, /__tcCommitHandlers/, 'eventPipeline must keep commit hooks inside the platform');

for (const file of ['js/modules/buffer-storage/index.js']) {
  const src = readFileSync(file, 'utf8');
  assert.match(src, /bindBufferStorageActions/, `${file} must delegate saved-record binding to the platform controller`);
  assert.doesNotMatch(src, /bindSavedRecordWorkflow|\.addEventListener\s*\(/, `${file} must not bind legacy saved-record workflow or module-local DOM events`);
}

const pressureHolding = readFileSync('js/modules/pressure-holding/index.js', 'utf8');
const pressureHoldingController = readFileSync('js/modules/pressure-holding/controller.js', 'utf8');
assert.match(pressureHoldingController, /createSavedRecordActions/, 'pressure-holding must use central saved-record actions');
assert.match(pressureHoldingController, /registerCentralActions/, 'pressure-holding saved-record actions must use the central action registry');
assert.doesNotMatch(pressureHolding + pressureHoldingController, /bindSavedRecordWorkflow/, 'pressure-holding must not use the legacy saved-record workflow after phase 20B.2');
assert.doesNotMatch(pressureHolding + pressureHoldingController, /\.addEventListener\s*\(/, 'pressure-holding must not bind module-local DOM events');

const rainwater = readFileSync('js/modules/rainwater/index.js', 'utf8');
const controller = readFileSync('js/modules/rainwater/controller.js', 'utf8');
const runtime = readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
assert.doesNotMatch(rainwater, /registerPipelineCommitHandler/, 'rainwater index must not own lookup hydration hooks');
assert.match(runtime, /registerPipelineCommitHandler/, 'platform runtime must use pipeline commit hook for lookup hydration');
assert.match(controller, /platform:lookup-hydration/, 'lookup hydration must use the platform namespace.');
assert.doesNotMatch(rainwater, /addEventListener\('tc:commit'/, 'rainwater must not bind tc:commit directly');

console.log('phase16e event pipeline consolidation ok');
