import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const eventPipelineSource = readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
const coordinatorSource = readFileSync(new URL('../js/core/renderCoordinator.js', import.meta.url), 'utf8');

assert.match(runtimeSource, /root\.__tcPlatformSavedRecordContext = \{ handlers, state \}/, 'Saved-record context must publish the latest module handlers.');
assert.match(eventPipelineSource, /resolveActionHandler/, 'Central event pipeline must resolve platform action handlers.');
assert.match(eventPipelineSource, /__tcPlatformSavedRecordContext\?\.handlers\?\.\[action\]/, 'Saved-record actions must be resolved from current context per event.');
assert.match(runtimeSource, /root\.__tcPlatformSegmentContext = \{ commit \}/, 'Segment capture listener must use the latest module commit function.');
assert.match(runtimeSource, /__tcPlatformSegmentContext\?\.commit\?\./, 'Segment capture handler must call current module segment commit.');
assert.match(coordinatorSource, /clampViewportToDocumentEnd/, 'Renderer must clamp scroll after structural rerenders.');
assert.match(coordinatorSource, /clampViewportStable\(\)/, 'Renderer must stabilize scroll clamping after DOM replacement.');

console.log('phase17c5 reference event and scroll regression ok');
