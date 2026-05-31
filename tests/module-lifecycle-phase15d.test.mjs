import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appJs = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');
const adapterJs = readFileSync(new URL('../js/core/moduleLifecycleAdapter.js', import.meta.url), 'utf8');

assert.match(appJs, /createModuleLifecycleAdapter/, 'App must route every module through the central lifecycle adapter.');
assert.match(appJs, /hardResetModuleRoot/, 'App root cleanup must be delegated to the central lifecycle reset.');
assert.match(appJs, /createModuleLifecycleAdapter\(config\.id, module\.mount\)\(root\)/, 'Lazy modules must be wrapped by the lifecycle adapter.');
assert.match(adapterJs, /export function createModuleLifecycleAdapter/, 'Central lifecycle adapter must exist.');
assert.match(adapterJs, /abortController\?\.abort\?\./, 'Adapter must abort previous module resources.');
assert.match(adapterJs, /root\.__tcCentralEventPipelineBound = false/, 'Adapter must reset stale central event-pipeline state.');
assert.match(adapterJs, /lifecycle\.addCleanup|addCleanup\(cleanup\)/, 'Adapter must expose cleanup registration for migrated modules.');

console.log('module lifecycle phase15d legacy adapter regression ok');
