import assert from 'node:assert/strict';
import { createModuleRuntime } from '../js/core/moduleRuntime.js';

function createRoot() {
  const listeners = new Map();
  return {
    dataset: {},
    innerHTML: '',
    attributes: new Set(),
    __tcLastHtml: '',
    setAttribute(name) { this.attributes.add(name); },
    removeAttribute(name) { this.attributes.delete(name); },
    hasAttribute(name) { return this.attributes.has(name); },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach(handler => handler(event));
      return true;
    },
    addEventListener(type, handler) {
      listeners.set(type, [...(listeners.get(type) || []), handler]);
    },
    focus() {}
  };
}

const root = createRoot();
const calls = [];
let cleanupA = 0;
const registry = new Map([
  ['a', { mount(target) { calls.push(`mount-a:${target.dataset.pendingModuleId}`); target.innerHTML = '<section>A</section>'; return () => { cleanupA += 1; calls.push('cleanup-a'); }; } }],
  ['b', { mount(target) { calls.push(`mount-b:${target.dataset.pendingModuleId}`); target.innerHTML = '<section>B</section>'; return () => calls.push('cleanup-b'); } }],
]);

const nav = [];
const runtime = createModuleRuntime({
  root,
  modules: { get: id => registry.get(id) || null },
  renderNavigation: id => nav.push(id),
});

assert.equal(await runtime.mount('a'), true);
assert.equal(root.dataset.activeModuleId, 'a');
assert.equal(root.hasAttribute('aria-busy'), false);
assert.deepEqual(nav, ['a']);
assert.equal(await runtime.mount('b'), true);
assert.equal(cleanupA, 1, 'previous module cleanup runs before next mount');
assert.equal(root.dataset.activeModuleId, 'b');
assert.equal(root.innerHTML, '<section>B</section>');
assert.deepEqual(nav, ['a', 'b']);
assert.ok(calls.includes('mount-a:a'));
assert.ok(calls.includes('mount-b:b'));

console.log('module runtime phase16a ok');
