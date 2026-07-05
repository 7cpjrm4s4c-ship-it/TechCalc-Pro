import { preserveViewport as preserveRendererViewport } from './renderer.js';

export const SCROLL_STABILITY_PRESETS = Object.freeze({
  default: Object.freeze({ frames: 3, blurActive: false, delays: [0, 40, 100] }),
  action: Object.freeze({ frames: 3, blurActive: false, delays: [0, 40, 100] }),
  savedRecord: Object.freeze({ frames: 4, blurActive: false, delays: [0, 16, 40, 100] })
});

export function preserveScroll(action, preset = 'default', overrides = {}) {
  const base = SCROLL_STABILITY_PRESETS[preset] || SCROLL_STABILITY_PRESETS.default;
  return preserveRendererViewport(action, { ...base, ...overrides });
}

export function preserveActionScroll(action, overrides = {}) {
  return preserveScroll(action, 'action', overrides);
}

export function preserveSavedRecordScroll(action, overrides = {}) {
  return preserveScroll(action, 'savedRecord', overrides);
}

export function preserveSavedRecordMutation(action, overrides = {}) {
  return runWithoutScrollJump(action, {
    frames: 4,
    delays: [0, 16, 40, 100],
    ...overrides
  });
}



let touchScrollActive = false;
let touchScrollListenersBound = false;

function bindTouchScrollGuards() {
  if (touchScrollListenersBound || typeof window === 'undefined') return;
  touchScrollListenersBound = true;
  const activate = () => { touchScrollActive = true; };
  const release = () => { touchScrollActive = false; };
  window.addEventListener('touchstart', activate, { passive: true });
  window.addEventListener('touchmove', activate, { passive: true });
  window.addEventListener('touchend', release, { passive: true });
  window.addEventListener('touchcancel', release, { passive: true });
}

export function isTouchScrollActive() {
  bindTouchScrollGuards();
  return touchScrollActive;
}

function getDefaultScrollScope(scope = null) {
  if (scope && scope !== window) return scope;
  if (typeof document === 'undefined') return null;
  return document.scrollingElement || document.documentElement;
}

function readScrollPosition(scope = null) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { scope: 'none', x: 0, y: 0 };
  }
  const target = getDefaultScrollScope(scope);
  if (!target || target === window) {
    return {
      scope: 'window',
      x: window.scrollX || 0,
      y: window.scrollY || document.documentElement?.scrollTop || 0
    };
  }
  return {
    scope: target,
    x: target.scrollLeft || 0,
    y: target.scrollTop || 0
  };
}

function writeScrollPosition(snapshot = {}, options = {}) {
  if (!snapshot || typeof window === 'undefined' || typeof document === 'undefined') return;
  const x = Math.max(0, Number(snapshot.x) || 0);
  const y = Math.max(0, Number(snapshot.y) || 0);
  const behavior = options.behavior || 'auto';
  if (snapshot.scope && snapshot.scope !== 'window' && snapshot.scope !== 'none') {
    if (typeof snapshot.scope.scrollTo === 'function') {
      snapshot.scope.scrollTo({ left: x, top: y, behavior });
    } else {
      snapshot.scope.scrollLeft = x;
      snapshot.scope.scrollTop = y;
    }
    return;
  }
  if (typeof window.scrollTo === 'function') window.scrollTo({ left: x, top: y, behavior });
}

export function capturePosition(scope = null) {
  return readScrollPosition(scope);
}

export function restorePosition(snapshot, options = {}) {
  writeScrollPosition(snapshot, options);
}

let freezeCounter = 0;
const activeFreezes = new Set();

export function freeze(reason = 'platform-scroll-freeze') {
  const token = Object.freeze({ id: ++freezeCounter, reason, snapshot: capturePosition() });
  activeFreezes.add(token);
  return token;
}

export function unfreeze(token, options = {}) {
  if (!token || !activeFreezes.has(token)) return false;
  activeFreezes.delete(token);
  if (options.restore !== false) restorePosition(token.snapshot, options);
  return true;
}

export function isScrollFrozen() {
  return activeFreezes.size > 0;
}

export function runWithoutScrollJump(action, options = {}) {
  bindTouchScrollGuards();
  const snapshot = options.snapshot || capturePosition(options.scope || null);
  const skipDuringActiveTouch = options.skipDuringActiveTouch === true;
  const restore = () => {
    if (skipDuringActiveTouch && isTouchScrollActive()) return;
    restorePosition(snapshot, options);
  };
  const scheduleRestore = () => {
    restore();
    const delays = Array.isArray(options.delays) ? options.delays : [];
    delays.forEach(delay => setTimeout(restore, delay));
    if (options.frames) {
      let remaining = Math.max(0, Number(options.frames) || 0);
      const frame = () => {
        restore();
        remaining -= 1;
        const scheduleFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
      if (remaining > 0) scheduleFrame(frame);
      };
      const scheduleFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
      if (remaining > 0) scheduleFrame(frame);
    }
  };

  const result = action?.();
  if (result && typeof result.then === 'function') {
    scheduleRestore();
    return result.finally(scheduleRestore);
  }
  scheduleRestore();
  return result;
}

export function preserveModuleSwitchScroll(action, overrides = {}) {
  return runWithoutScrollJump(action, {
    frames: 10,
    delays: [0, 40, 120, 260, 520],
    ...overrides
  });
}

export const PlatformScrollManager = Object.freeze({
  capturePosition,
  restorePosition,
  freeze,
  unfreeze,
  isScrollFrozen,
  runWithoutScrollJump,
  isTouchScrollActive,
  preserveScroll,
  preserveActionScroll,
  preserveSavedRecordScroll,
  preserveSavedRecordMutation,
  preserveModuleSwitchScroll
});

const GLOBAL_SAVED_ACTION_SELECTOR = [
  '[data-line-select]',
  '[data-line-delete]',
  '[data-line-toggle]',
  '[data-saved-load]',
  '[data-saved-delete]',
  '[data-saved-toggle]',
  '[data-buffer-select]',
  '[data-buffer-dynamic]',
  '[data-rainwater-select]',
  '[data-rw-dynamic]',
  '[data-wrg-select]',
  '[data-wrg-dynamic]',
  '[data-hx-select]',
  '[data-hx-delete]',
  '[data-hx-dynamic]',
  '[data-line-card]',
  '[data-saved-record-card]',
  '.saved-record-card',
  '.line-section-card',
  '.tc-saved-record-panel',
  '[data-line-dynamic]',
  '[data-hc-dynamic]'
].join(',');

function scheduleStableRestore(snapshot, options = {}) {
  if (!snapshot) return;
  const frames = Math.max(0, Number(options.frames ?? 4));
  const delays = Array.isArray(options.delays) ? options.delays : [0, 16, 40, 100];
  const restore = () => restorePosition(snapshot, { behavior: 'auto' });
  delays.forEach(delay => setTimeout(restore, delay));
  let remaining = frames;
  const frame = () => {
    restore();
    remaining -= 1;
    if (remaining > 0) requestAnimationFrame?.(frame);
  };
  if (remaining > 0) requestAnimationFrame?.(frame);
}

export function initializeGlobalSavedRecordScrollStability(root = document) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const host = root || document;
  if (host.__tcGlobalSavedScrollStabilityBound) return;
  host.__tcGlobalSavedScrollStabilityBound = true;
  let snapshot = null;
  let point = null;
  const capture = event => {
    const target = event.target?.closest?.(GLOBAL_SAVED_ACTION_SELECTOR);
    if (!target) return;
    snapshot = capturePosition();
    const source = event.touches?.[0] || event.changedTouches?.[0] || event;
    point = { x: Number(source?.clientX || 0), y: Number(source?.clientY || 0) };
  };
  const cancelOnMove = event => {
    if (!snapshot || !point) return;
    const source = event.touches?.[0] || event.changedTouches?.[0] || event;
    const dx = Math.abs(Number(source?.clientX || 0) - point.x);
    const dy = Math.abs(Number(source?.clientY || 0) - point.y);
    if (dx > 10 || dy > 10) {
      snapshot = null;
      point = null;
    }
  };
  const restore = event => {
    if (!snapshot) return;
    const target = event.target?.closest?.(GLOBAL_SAVED_ACTION_SELECTOR);
    if (!target) return;
    const keep = snapshot;
    snapshot = null;
    point = null;
    scheduleStableRestore(keep);
  };
  host.addEventListener('pointerdown', capture, true);
  host.addEventListener('touchstart', capture, { capture: true, passive: true });
  host.addEventListener('pointermove', cancelOnMove, { capture: true, passive: true });
  host.addEventListener('touchmove', cancelOnMove, { capture: true, passive: true });
  host.addEventListener('click', restore, true);
  host.addEventListener('pointerup', restore, true);
}
