import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const eventPipeline = readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const rainwater = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');
const wastewater = readFileSync(new URL('../js/modules/wastewater/controller.js', import.meta.url), 'utf8');

assert.match(eventPipeline, /function resolveActionHandler/, 'Central event pipeline must own platform action resolution.');
assert.match(eventPipeline, /startsWith\('saved:'\)/, 'SavedRecord actions must be routed as structural platform actions.');
assert.match(eventPipeline, /__tcPlatformSavedRecordContext\?\.handlers\?\.\[action\]/, 'SavedRecord handler must be resolved from the latest mounted module context.');
assert.doesNotMatch(runtime, /__tcPlatformSavedRecordCaptureBound/, 'moduleRuntime must not install a competing SavedRecord capture flag.');
assert.doesNotMatch(runtime, /SavedRecord[\s\S]{0,900}addEventListener\('pointerup', capture/, 'moduleRuntime must not install a competing SavedRecord pointer capture patch.');
assert.doesNotMatch(runtime, /SavedRecord[\s\S]{0,900}addEventListener\('click', capture/, 'moduleRuntime must not install a competing SavedRecord click capture patch.');
assert.doesNotMatch(rainwater, /data-saved-|bindSavedRecord|createSavedRecordActions/, 'Rainwater must not carry legacy SavedRecord bindings or attrs.');
assert.doesNotMatch(wastewater, /data-saved-|bindSavedRecord|createSavedRecordActions/, 'Wastewater must not carry legacy SavedRecord bindings or attrs.');

console.log('phase17c6 saved-record root-cause regression ok');
