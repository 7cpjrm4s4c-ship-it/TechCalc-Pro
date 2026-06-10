import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { on, once, createEventScope, getActiveEventListenerCount } from '../js/core/eventManager.js';

assert.equal(typeof on, 'function');
assert.equal(typeof once, 'function');
assert.equal(typeof createEventScope, 'function');
assert.equal(typeof getActiveEventListenerCount, 'function');

const appSource = fs.readFileSync(path.join(process.cwd(), 'js/core/app.js'), 'utf8');
assert.match(appSource, /trackGlobalEventListener/);
assert.match(appSource, /\.\/eventManager\.js/);

const delegationSource = fs.readFileSync(path.join(process.cwd(), 'js/core/eventDelegation.js'), 'utf8');
assert.match(delegationSource, /createEventScope/);
assert.match(delegationSource, /return on\(root, eventName, listener, options\)/);

const scope = createEventScope('phase28c-test');
assert.equal(scope.size, 0);
scope.add(() => {});
assert.equal(scope.size, 1);
scope.dispose();
assert.equal(scope.size, 0);

console.log('Phase 28C Event System Cleanup Test bestanden.');
