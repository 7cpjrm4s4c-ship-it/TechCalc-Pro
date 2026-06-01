import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rainwater = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');
const mount = readFileSync(new URL('../js/core/mount.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

assert.match(mount, /root\.__tcActionHandlers = \{\}/, 'Module mounts must clear stale action handlers before rebinding the pipeline.');
assert.doesNotMatch(rainwater, /__rainwaterInputBound/, 'Rainwater must not keep module-owned root input listeners.');
assert.match(rainwater, /renderSavedRecordList\(items, \{/, 'Rainwater surfaces must use the global saved-record UI.');
assert.match(rainwater, /data-saved-load/, 'Rainwater surfaces must use platform saved-record load attributes.');
assert.match(rainwater, /expandedSurfaceResultId: null/, 'Switching Dachfläche/Grundstücksfläche must reset stale expanded surface state.');
assert.match(css, /\.tc-action-link[\s\S]*justify-content: center/, 'Global action links must be centered in cards.');

console.log('rainwater phase14f reference workflow regression ok');
