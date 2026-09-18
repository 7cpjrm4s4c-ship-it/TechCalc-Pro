import assert from 'node:assert/strict';
import { platformPolicy } from '../core/platformPolicy.js';
import { performanceBudget } from '../core/quality/performanceBudget.js';

assert.equal(platformPolicy.version, '1.3.0');
assert.ok(platformPolicy.moduleMustNotOwn.includes('eigene Zahlenparser'));
assert.ok(performanceBudget.maxModuleMountMs <= 80);
assert.ok(performanceBudget.maxRouteRenderMs <= 120);
console.log('platform-policy regression ok');
