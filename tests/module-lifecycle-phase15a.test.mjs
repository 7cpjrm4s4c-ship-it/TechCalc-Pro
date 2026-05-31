import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appJs = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');
const runtimeJs = readFileSync(new URL('../js/core/moduleRuntime.js', import.meta.url), 'utf8');
const source = appJs + runtimeJs;

assert.match(source, /function (disposeCurrentModule|dispose)\(/, 'Central module cleanup must exist.');
assert.match(source, /hardResetModuleRoot\(root\)/, 'Root platform state must be reset before every mount.');
assert.match(source, /const token = \+\+renderToken/, 'Module renders must be guarded by a render token.');
assert.match(source, /DEFAULT_MOUNT_TIMEOUT_MS|MODULE_MOUNT_TIMEOUT_MS/, 'A stuck module mount must leave loading state via timeout.');
assert.match(appJs, /return moduleRuntime\.mount\(id\)/, 'Render must directly mount the requested latest module through the central runtime.');
assert.doesNotMatch(source, /latestRequestedModuleId/, 'Latest-request coalescing must not skip requested module mounts.');

console.log('module lifecycle phase15a/15b test passed');
