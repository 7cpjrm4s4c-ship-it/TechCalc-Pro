import assert from 'node:assert/strict';
import { bindDrinkingWaterActions } from '../modules/drinking-water/controller.js';
import { state } from '../modules/drinking-water/state.js';
import { cancelViewportRestoration } from '../core/ui/renderer.js';

const originalState = state.get();
const names = ['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'];
const originals = Object.fromEntries(names.map(key => [key, globalThis[key]]));
const pending = new Map();
let id = 0;
globalThis.setTimeout = callback => { pending.set(++id, callback); return id; };
globalThis.clearTimeout = key => pending.delete(key);
globalThis.requestAnimationFrame = globalThis.setTimeout;
globalThis.cancelAnimationFrame = globalThis.clearTimeout;
globalThis.window = Object.assign(new EventTarget(), { scrollX: 0, scrollY: 0 });
globalThis.document = Object.assign(new EventTarget(), {
  scrollingElement: { scrollLeft: 0, scrollTop: 0 },
  activeElement: null, body: { classList: { remove() {} } }
});
const handlers = new Map();
const fields = [
  { dataset: { field: 'unitConsumerType' }, value: 'basin' },
  { dataset: { field: 'unitCount' }, value: '2' },
  { dataset: { field: 'singleConsumerType' }, value: 'tapDn20' },
  { dataset: { field: 'singleCount' }, value: '3' }
];
const root = {
  dataset: {}, contains: () => true,
  querySelector: () => null,
  querySelectorAll: selector => selector === '[data-field]' ? fields : [],
  addEventListener(type, handler) { handlers.set(type, [...(handlers.get(type) || []), handler]); }
};
function dispatch(type, target) {
  const event = {
    type, target, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() {}, stopImmediatePropagation() {}
  };
  (handlers.get(type) || []).forEach(handler => handler(event));
  return event;
}
try {
  state.set({ unitDraftConsumers: [], singleDraftConsumers: [], savedUsageUnits: [], savedSingleConsumers: [] }, { notify: false });
  bindDrinkingWaterActions(root);
  for (const [kind, key, count] of [['unit', 'unitDraftConsumers', 2], ['single', 'singleDraftConsumers', 3]]) {
    const button = { dataset: { dwDraftAdd: kind } };
    button.closest = selector => selector === '[data-dw-draft-add]' ? button : null;
    for (const type of ['pointerdown', 'touchstart', 'pointermove', 'touchmove', 'pointercancel', 'touchcancel', 'pointerup', 'touchend']) {
      const event = dispatch(type, button);
      assert.equal(event.defaultPrevented, false, `${kind}: ${type} must leave native scrolling enabled`);
      assert.equal(state.get()[key].length, 0, `${kind}: ${type} must not add a consumer`);
    }
    dispatch('click', button);
    assert.equal(state.get()[key].length, 1, `${kind}: confirmed activation must add exactly one consumer`);
    assert.equal(state.get()[key][0].count, count, `${kind}: visible fields must be committed before addition`);
    dispatch('click', button);
    assert.equal(state.get()[key].length, 2, `${kind}: a second intentional activation must not be time-suppressed`);
  }
  console.log('Drinking-water draft touch activation regression passed.');
} finally {
  cancelViewportRestoration();
  state.set(originalState, { notify: false });
  Object.assign(globalThis, originals);
}
