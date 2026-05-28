import assert from 'node:assert/strict';
import { createStore } from '../js/core/centralStore.js';

const store = createStore({ mode: 'heating', mediumId: 'water', nested: { a: 1 } }, { moduleId: 'test' });
let emitted = 0;
let lastMeta = null;
store.subscribe((_, meta) => { emitted += 1; lastMeta = meta; });

store.set({ mediumId: 'glycol30' }, { action: 'select' });
assert.equal(store.get().mediumId, 'glycol30');
assert.equal(emitted, 1);
assert.equal(lastMeta.action, 'select');
assert.deepEqual(lastMeta.changed, ['mediumId']);

store.set({ nested: { a: 1 } }, { action: 'same-object-value' });
assert.equal(emitted, 1, 'deep-equal object patches must not trigger redundant renders');

store.update(s => ({ mode: s.mode === 'heating' ? 'cooling' : 'heating' }), { action: 'toggle' });
assert.equal(store.get().mode, 'cooling');
assert.equal(emitted, 2);
