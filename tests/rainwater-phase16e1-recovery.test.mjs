import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/modules/rainwater/index.js', 'utf8');
const controller = fs.readFileSync('js/modules/rainwater/controller.js', 'utf8');
const runtime = fs.readFileSync('js/platform/moduleRuntime/index.js', 'utf8');

assert.doesNotMatch(source, /registerPipelineCommitHandler/, 'rainwater index must not bind platform commit hooks directly');
assert.match(runtime, /registerPipelineCommitHandler/, 'platform module runtime must own lookup hydration commit hooks');
assert.match(controller, /key:\s*'platform:lookup-hydration'/, 'lookup hydration key must use platform namespace.');

console.log('phase16e.1 rainwater recovery regression ok');
