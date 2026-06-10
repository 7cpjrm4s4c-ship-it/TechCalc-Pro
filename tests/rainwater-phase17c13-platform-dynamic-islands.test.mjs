import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../js/platform/moduleRenderer/index.js', import.meta.url), 'utf8');
const rainController = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');

assert.match(renderer, /export function renderPlatformForm/, 'platform renderer must expose a reusable form island renderer.');
assert.match(renderer, /export function renderPlatformResultsAndSaved/, 'platform renderer must expose a reusable result/saved island renderer.');
assert.match(renderer, /data-platform-dynamic="form"/, 'platform module view must wrap the form in a dynamic island.');
assert.match(renderer, /data-platform-dynamic="result-saved"/, 'platform module view must wrap result and saved records in a dynamic island.');

assert.match(runtime, /function updateDynamicIslands/, 'platform runtime must own dynamic island updates.');
assert.match(runtime, /renderPlatformForm\(model\)/, 'segment commits must be able to rebuild the schema form island.');
assert.match(runtime, /renderPlatformResultsAndSaved\(model\)/, 'segment commits must be able to rebuild result/saved islands.');
assert.match(runtime, /reason: 'segment'/, 'segment commits must trigger the platform dynamic update path immediately.');
assert.match(runtime, /dynamicOptions\.dynamicUpdate/, 'segment handling must call the central dynamic update callback.');

assert.doesNotMatch(rainController, /domPatch|querySelector|patchSurfaceModeDom/, 'rainwater must not use DOM patching for the Dach-/Grundstück switch.');

console.log('rainwater phase17c.13 platform dynamic islands ok');
