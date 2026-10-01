import assert from 'node:assert/strict';
import { restoreViewport, restoreViewportStable, cancelViewportRestoration } from '../core/ui/renderer.js';
import { resetModuleScroll, restorePosition, runWithoutScrollJump } from '../core/ux/scrollManager.js';
import { createModuleRuntime } from '../core/runtime/moduleRuntime.js';
import { initializeLayoutStabilityController } from '../core/ux/layoutStabilityController.js';

const originals = Object.fromEntries(['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'].map(key => [key, globalThis[key]]));
const frames = new Map();
const timers = new Map();
let nextId = 0;
let scrollWrites = 0;
function scrollHost(y = 0) {
  return { scrollTop: y, scrollLeft: 0, scrollTo({ top, left }) { scrollWrites++; this.scrollTop = top; this.scrollLeft = left; } };
}
const page = scrollHost(200);
const nested = scrollHost(80);
const root = scrollHost(40);
const win = new EventTarget();
Object.assign(win, {
  innerHeight: 800, innerWidth: 400,
  visualViewport: Object.assign(new EventTarget(), { height: 800, width: 400 }),
  scrollTo(x, y) { scrollWrites++; page.scrollLeft = x; page.scrollTop = y; }
});
Object.defineProperties(win, {
  scrollX: { get: () => page.scrollLeft }, scrollY: { get: () => page.scrollTop }
});
const doc = new EventTarget();
let styleWrites = 0;
const styles = new Map();
Object.assign(page, { style: {
  getPropertyValue: key => styles.get(key) || '',
  setProperty(key, value) { styleWrites++; styles.set(key, value); }
}, classList: { add() {}, contains: () => true } });
Object.assign(doc, {
  scrollingElement: page, documentElement: page, body: scrollHost(), visibilityState: 'visible',
  querySelector: () => null, querySelectorAll: () => [nested, root, page]
});
globalThis.window = win;
globalThis.document = doc;
globalThis.requestAnimationFrame = callback => { const id = ++nextId; frames.set(id, callback); return id; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
globalThis.setTimeout = callback => { const id = ++nextId; timers.set(id, callback); return id; };
globalThis.clearTimeout = id => timers.delete(id);
const flushFrame = () => { const batch = [...frames]; frames.clear(); batch.forEach(([, callback]) => callback()); };
const flushAll = () => {
  for (let guard = 0; frames.size || timers.size; guard++) {
    assert.ok(guard < 50, 'Scheduling must settle');
    flushFrame();
    const batch = [...timers]; timers.clear(); batch.forEach(([, callback]) => callback());
  }
};
try {
  restoreViewport({ x: 0, y: 200 });
  restorePosition({ scope: page, x: 0, y: 200 });
  assert.equal(scrollWrites, 0, 'Unchanged positions must not write');
  restoreViewport({ x: 0, y: 150 });
  assert.equal(page.scrollTop, 150, 'A changed position must still be restored');
  doc.querySelector = () => ({ getBoundingClientRect: () => ({ top: 70 }) });
  restoreViewport({ x: 0, y: 150, anchor: { selector: '#anchor', top: 50 } });
  assert.equal(page.scrollTop, 170, 'Anchor displacement must still be compensated');
  doc.querySelector = () => null;
  const beforeReset = scrollWrites;
  resetModuleScroll(root);
  assert.equal(page.scrollTop, 0);
  assert.equal(root.scrollTop, 0);
  assert.equal(nested.scrollTop, 0);
  assert.equal(scrollWrites - beforeReset, 3, 'Each displaced host must be reset once');
  resetModuleScroll(root);
  assert.equal(scrollWrites - beforeReset, 3, 'Repeated reset at zero must not write');

  restoreViewportStable({ x: 0, y: 100 }, { frames: 3, delays: [40, 120] });
  win.dispatchEvent(new Event('wheel'));
  page.scrollTop = 250;
  flushAll();
  assert.equal(page.scrollTop, 250, 'New user scrolling must cancel old restoration');
  restoreViewportStable({ x: 0, y: 100 });
  doc.dispatchEvent(new Event('techcalc:module-before-unmount'));
  flushAll();
  assert.equal(page.scrollTop, 250, 'Unmount must cancel old restoration');
  restoreViewportStable({ x: 0, y: 100 });
  restoreViewportStable({ x: 0, y: 300 });
  flushAll();
  assert.equal(page.scrollTop, 300, 'Only the latest restoration may run');

  let complete;
  const pending = runWithoutScrollJump(() => new Promise(resolve => { complete = resolve; }), { frames: 2, delays: [40] });
  flushAll();
  win.dispatchEvent(new Event('pointerdown'));
  page.scrollTop = 450;
  complete();
  await pending;
  flushAll();
  assert.equal(page.scrollTop, 450, 'Async completion must not revive a cancelled restoration');
  const uncancelled = runWithoutScrollJump(() => Promise.resolve().then(() => { page.scrollTop = 500; }), { frames: 2 });
  await uncancelled;
  flushAll();
  assert.equal(page.scrollTop, 450, 'Valid async completion must restore the captured position');

  const moduleRoot = Object.assign(new EventTarget(), scrollHost(), { dataset: {}, focus() {} });
  const attributes = new Set();
  Object.assign(moduleRoot, {
    setAttribute: name => attributes.add(name),
    removeAttribute: name => attributes.delete(name),
    hasAttribute: name => attributes.has(name)
  });
  let resolveMount;
  const runtime = createModuleRuntime({ root: moduleRoot, modules: new Map([
    ['a', { mount() {} }],
    ['b', { mount() { return new Promise(resolve => { resolveMount = resolve; }); } }]
  ]) });
  await runtime.mount('a');
  const mountingB = runtime.mount('b');
  for (let turn = 0; !resolveMount && turn < 20; turn++) await Promise.resolve();
  assert.equal(typeof resolveMount, 'function');
  page.scrollTop = 220;
  flushFrame();
  assert.equal(page.scrollTop, 220, 'An old module frame must not reset the pending module');
  resolveMount();
  assert.equal(await mountingB, true);
  assert.equal(page.scrollTop, 0, 'The completed module mount must reset the page');
  runtime.dispose();
  page.scrollTop = 330;
  flushFrame();
  assert.equal(page.scrollTop, 330, 'Disposed runtime must not execute an old scroll reset');

  initializeLayoutStabilityController();
  for (let i = 0; i < 100; i++) win.visualViewport.dispatchEvent(new Event('scroll'));
  assert.equal(frames.size, 1, 'A scroll burst must schedule one viewport update');
  flushAll();
  assert.equal(styleWrites, 2, 'Unchanged viewport dimensions must not be rewritten');
  win.visualViewport.height = 550;
  win.visualViewport.dispatchEvent(new Event('resize'));
  flushAll();
  assert.equal(styles.get('--tc-viewport-height'), '550px', 'Keyboard viewport resizing must remain effective');
  assert.equal(styleWrites, 3);
  win.visualViewport.dispatchEvent(new Event('scroll'));
  doc.visibilityState = 'hidden';
  doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(frames.size, 0, 'Backgrounding must cancel viewport work');
  assert.equal(timers.size, 0);
  console.log('Scroll and viewport efficiency regression passed.');
} finally {
  cancelViewportRestoration();
  Object.assign(globalThis, originals);
}
