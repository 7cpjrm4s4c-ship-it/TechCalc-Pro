import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const runtimeSource = fs.readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
const configSource = fs.readFileSync('js/modules/heating-cooling/config.js', 'utf8');

assert.match(moduleSource, /import \{ createPlatformModule \} from '\.\.\/\.\.\/platform\/moduleRuntime\/index\.js';/, 'heating/cooling must use the platform module runtime.');
assert.match(moduleSource, /export default createPlatformModule\(\{[\s\S]*view,[\s\S]*bind: bindHeatingCoolingPlatform,[\s\S]*dynamicUpdate: updateHeatingCoolingDynamic,[\s\S]*isDynamicAction: isDynamicHeatingCoolingAction[\s\S]*\}\);/, 'heating/cooling must delegate mount, binding and dynamic updates to createPlatformModule.');
assert.doesNotMatch(moduleSource, /function mountHeatingCooling\(root\) \{/, 'heating/cooling must not keep its former module-owned mount implementation.');
assert.doesNotMatch(moduleSource, /mount\(root\) \{\s*return mountHeatingCooling\(root\);\s*\}/, 'heating/cooling must not export a custom mount wrapper.');
assert.match(runtimeSource, /function mountDynamicPlatformModule/, 'platform runtime must own the custom-view dynamic mount adapter.');
assert.match(runtimeSource, /customView/, 'platform runtime must support custom view adapters for migrated modules.');
assert.match(runtimeSource, /customDynamicUpdate/, 'platform runtime must support centralized dynamic update adapters.');
assert.match(configSource, /phase-18b4-platform-mount/, 'module migration status must record Phase 18B.4.');

console.log('heating-cooling phase18b4 platform-mount regression ok');
