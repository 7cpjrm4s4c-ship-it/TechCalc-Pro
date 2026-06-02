import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rainwater = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');
const pipeline = readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/modules/rainwater/config.js', import.meta.url), 'utf8');

assert.doesNotMatch(rainwater, /card\('Flächen \/ Berechnung'/, 'Rainwater must not render the duplicate result-side area calculation card.');
assert.match(controller, /deleteAttr:\s*'data-saved-delete'/, 'Rainwater surface list must keep global delete actions through controller data.');
assert.match(controller, /surfaceMode:[\s\S]*patch:\s*modeDefaultsPatch/, 'Rainwater surfaceMode switch must be declarative platform segment config.');
assert.match(runtime, /handlers\.segment/, 'Platform runtime must own segment action dispatch.');
assert.match(pipeline, /segmentActionKey/, 'Central pipeline must de-duplicate pointer/click segment actions.');
assert.match(pipeline, /handleSegment\(segment, event\)/, 'Central pipeline must dispatch module segment handlers before fallback commits.');
assert.match(config, /phase-14[fg]-rainwater-(reference-workflow|global-standard)/, 'Rainwater migration status must reflect Phase 14F.');

console.log('rainwater phase14e global workflow regression ok');
