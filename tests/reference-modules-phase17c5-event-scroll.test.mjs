import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const eventPipelineSource = readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
const coordinatorSource = readFileSync(new URL('../js/core/renderCoordinator.js', import.meta.url), 'utf8');

assert.match(runtimeSource, /'line:save': save/, 'Saved-record save must be registered through the central Heizung/Kälte action map.');
assert.match(runtimeSource, /'saved:toggle': toggle/, 'Saved-record toggle must be registered through the central Heizung/Kälte action map.');
assert.match(eventPipelineSource, /resolveActionHandler/, 'Central event pipeline must resolve platform action handlers.');
assert.doesNotMatch(eventPipelineSource, /__tcPlatformSavedRecordContext\?\.handlers/, 'Saved-record actions must not use the removed context bridge.');
assert.match(runtimeSource, /root\.__tcPlatformSegmentContext\s*=\s*null/, 'Legacy segment capture context must be disabled; the central pipeline owns segment actions.');
assert.doesNotMatch(runtimeSource, /__tcPlatformSegmentContext\?\.commit/, 'Segment capture handler must not compete with the central pipeline.');
assert.match(coordinatorSource, /clampViewportToDocumentEnd/, 'Renderer must clamp scroll after structural rerenders.');
assert.match(coordinatorSource, /clampViewportStable\(\)/, 'Renderer must stabilize scroll clamping after DOM replacement.');

console.log('phase17c5 reference event and scroll regression ok');
