import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync(new URL('../js/platform/moduleRuntime/index.js', import.meta.url), 'utf8');
const savedRecordsSource = readFileSync(new URL('../js/core/savedRecords.js', import.meta.url), 'utf8');
const rainControllerSource = readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8');

assert.doesNotMatch(runtimeSource, /__tcPlatformSavedRecordDirectBinding/, 'Saved records must not use direct pointer bindings with stale module closures.');
assert.match(runtimeSource, /'saved:load': \(\{ element, event \}\) => actions\.load/, 'Saved-record load must be routed through the central action map.');
assert.match(runtimeSource, /'saved:delete': \(\{ element \}\) => actions\.delete/, 'Saved-record delete must remain a central platform action.');
assert.match(runtimeSource, /'saved:toggle': \(\{ element \}\) => actions\.toggle/, 'Saved-record accordion toggle must remain a central platform action.');
assert.match(savedRecordsSource, /data-tc-action="saved:load"/, 'Saved cards must expose central load actions.');
assert.match(savedRecordsSource, /data-tc-action="saved:toggle"/, 'Saved cards must expose central accordion actions.');
assert.match(savedRecordsSource, /data-tc-action="saved:delete"/, 'Saved cards must expose central delete actions.');
assert.match(runtimeSource, /queueMicrotask\(\(\) => scheduler\?\.flushNow/, 'Segment-driven schema switches must get a settled microtask flush.');
assert.match(rainControllerSource, /surfaceMode:[\s\S]*patch:\s*modeDefaultsPatch/, 'Rainwater Berechnungsbereich must use platform segment patching.');
assert.match(rainControllerSource, /calculationType:\s*mode/, 'Rainwater switch must keep the legacy calculationType alias synchronized.');

console.log('phase17c3 saved-record and rainwater switch regression ok');
