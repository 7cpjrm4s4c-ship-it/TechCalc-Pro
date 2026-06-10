import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync(new URL('../js/modules/drinking-water/controller.js', import.meta.url), 'utf8');
const view = fs.readFileSync(new URL('../js/modules/drinking-water/view.js', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../js/modules/drinking-water/schema.js', import.meta.url), 'utf8');

assert.match(schema, /action:\s*'platform:segment:waterHeatingMode'/, 'waterHeatingMode must expose the platform segment action like rainwater surfaceMode');
assert.match(view, /action:'platform:segment:waterHeatingMode'/, 'rendered waterHeatingMode segment must use the platform segment action');
assert.match(controller, /installWaterHeatingModeSegmentBridge/, 'drinking water must install a direct segment bridge');
assert.match(controller, /pointerdown/, 'direct bridge must commit before delayed click handlers');
assert.match(controller, /touchstart/, 'direct bridge must support mobile Safari touchstart');
assert.match(controller, /commitWaterHeatingModeSegment/, 'direct bridge must use a dedicated mode commit function');
assert.match(controller, /refreshDrinkingWater\(root\)/, 'waterHeatingMode commit must rebuild visible input and result islands');
assert.doesNotMatch(controller, /root\.innerHTML\s*=/, 'segment fix must not replace the whole module root and must preserve navigation');

console.log('drinking-water phase25e2d rainwater segment bridge ok');
