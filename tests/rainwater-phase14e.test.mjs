import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rainwater = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const pipeline = readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/modules/rainwater/config.js', import.meta.url), 'utf8');

assert.doesNotMatch(rainwater, /card\('Flächen \/ Berechnung'/, 'Rainwater must not render the duplicate result-side area calculation card.');
assert.match(rainwater, /data-tc-action="rainwater:surface-delete"/, 'Rainwater surface list must keep global delete actions.');
assert.match(rainwater, /'segment': selectSegment/, 'Rainwater must keep the surfaceMode switch on the central segment handler.');
assert.match(pipeline, /segmentActionKey/, 'Central pipeline must de-duplicate pointer/click segment actions.');
assert.match(pipeline, /handleSegment\(segment, event\)/, 'Central pipeline must dispatch module segment handlers before fallback commits.');
assert.match(config, /phase-14e-rainwater-global-workflow/, 'Rainwater migration status must reflect Phase 14E.');

console.log('rainwater phase14e global workflow regression ok');
