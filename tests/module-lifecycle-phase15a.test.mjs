import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appJs = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');

assert.match(appJs, /let renderQueue = Promise\.resolve\(true\)/, 'App render must be globally serialized.');
assert.match(appJs, /function disposeCurrentModule\(\)/, 'Central module cleanup must exist.');
assert.match(appJs, /performModuleRender\(target\)/, 'Queued render must delegate to a single module mount function.');
assert.match(appJs, /resetAppRootPlatformState\(app\)/, 'Root platform state must be reset before every mount.');

console.log('module lifecycle phase15a test passed');
