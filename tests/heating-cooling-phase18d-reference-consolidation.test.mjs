import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const controllerSource = fs.readFileSync('js/modules/heating-cooling/controller.js', 'utf8');
const configSource = fs.readFileSync('js/modules/heating-cooling/config.js', 'utf8');

assert.match(configSource, /phase-18d-reference-consolidation/, 'Phase 18D must be recorded in migration status.');
assert.match(moduleSource, /from '\.\/controller\.js'/, 'heating/cooling index must import the consolidated controller helpers.');
assert.doesNotMatch(moduleSource, /const MODE_PREFIX|function activeCalculationState|function hydrateLineSectionState|function buildLineSectionRecord/, 'heating/cooling index must not keep extracted controller logic.');
assert.match(controllerSource, /export function activeCalculationState/, 'controller must own active calculation state mapping.');
assert.match(controllerSource, /export function inputFields/, 'controller must own active input-field composition.');
assert.match(controllerSource, /export function buildLineSectionRecord/, 'controller must own line-section record mapping.');
assert.match(controllerSource, /export function hydrateLineSectionState/, 'controller must own line-section hydration.');
assert.match(moduleSource, /export default createPlatformModule\(\{[\s\S]*view,[\s\S]*bind: bindHeatingCoolingPlatform,[\s\S]*dynamicUpdate: updateHeatingCoolingDynamic[\s\S]*\}\);/, 'heating/cooling must remain mounted by the platform runtime after consolidation.');
assert.doesNotMatch(moduleSource, /function mountHeatingCooling|bindCommonInputs|bindNoClickScroll|registerCentralActions/, 'legacy module-owned mount and binding logic must stay removed.');

console.log('heating-cooling phase18d reference-consolidation regression ok');
