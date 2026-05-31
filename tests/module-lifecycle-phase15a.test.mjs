import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appJs = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');

assert.match(appJs, /function disposeCurrentModule\(\)/, 'Central module cleanup must exist.');
assert.match(appJs, /resetAppRootPlatformState\(app\)/, 'Root platform state must be reset before every mount.');
assert.match(appJs, /const token = \+\+renderToken/, 'Module renders must be guarded by a render token.');
assert.match(appJs, /MODULE_MOUNT_TIMEOUT_MS/, 'A stuck module mount must leave loading state via timeout.');
assert.match(appJs, /return performModuleRender\(id\)/, 'Render must directly mount the requested latest module.');
assert.doesNotMatch(appJs, /latestRequestedModuleId/, 'Latest-request coalescing must not skip requested module mounts.');

console.log('module lifecycle phase15a/15b test passed');
