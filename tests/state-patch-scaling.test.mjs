import assert from 'node:assert/strict';
import { createStore } from '../core/state/centralStore.js';

const state = Object.fromEntries(Array.from({ length: 1_000 }, (_, index) => [
  `field${index}`, { values: Array.from({ length: 20 }, (_, item) => index + item) }
]));
const store = createStore(state, { moduleId: 'scaling-regression' });
const events = [];
store.subscribe((snapshot, meta) => events.push({ snapshot, meta }));

store.set({ field999: { values: state.field999.values } }, { action: 'no-change' });
assert.equal(store.getRevision(), 0);
assert.equal(events.length, 0);
store.set({ optional: undefined }, { action: 'new-undefined' });
assert.equal(store.getRevision(), 1, 'a new key with undefined value is a state change');
assert.deepEqual(events.at(-1).meta.changed, ['optional']);
store.set({ field999: { values: [42] } }, { action: 'one-field' });
assert.deepEqual(events.at(-1).meta.changed, ['field999']);
assert.equal(store.get().field999.values[0], 42);
assert.deepEqual(store.get().field998, state.field998);
store.set(null);
assert.equal(store.getRevision(), 2);
store.set({}, { notify: true });
assert.equal(events.at(-1).meta.action, 'noop');
assert.deepEqual(events.at(-1).meta.changed, []);
const copied = store.get();
copied.field999.values[0] = 99;
assert.equal(store.get().field999.values[0], 42, 'public snapshots remain isolated');

const renderStore = createStore({ value: 1 });
let renderMeta;
renderStore.subscribe((snapshot, meta) => {
  assert.equal(snapshot, undefined, 'meta-only render subscriptions do not clone state');
  renderMeta = meta;
}, { snapshot: false });
renderStore.set({ value: 2 });
assert.deepEqual(renderMeta.changed, ['value']);
let fullSnapshot;
renderStore.subscribe(snapshot => { fullSnapshot = snapshot; });
renderStore.set({ value: 3 });
assert.deepEqual(fullSnapshot, { value: 3 }, 'regular subscribers still receive an isolated snapshot');
console.log('Store partial-update semantics passed.');
