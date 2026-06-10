import { preserveViewport as preserveRendererViewport } from './renderer.js';

export const SCROLL_STABILITY_PRESETS = Object.freeze({
  default: Object.freeze({ frames: 6, blurActive: false, delays: [0, 40, 120] }),
  action: Object.freeze({ frames: 6, blurActive: false, delays: [0, 40, 100, 220] }),
  savedRecord: Object.freeze({ frames: 8, blurActive: false, delays: [0, 40, 100, 220] })
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
    frames: 8,
    delays: [0, 40, 100, 220, 420],
    ...overrides
  });
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

export function capturePosition(scope = window) {
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
  const snapshot = options.snapshot || capturePosition(options.scope || window);
  const restore = () => restorePosition(snapshot, options);
  const scheduleRestore = () => {
    restore();
    const delays = Array.isArray(options.delays) ? options.delays : [];
    delays.forEach(delay => setTimeout(restore, delay));
    if (options.frames) {
      let remaining = Math.max(0, Number(options.frames) || 0);
      const frame = () => {
        restore();
        remaining -= 1;
        if (remaining > 0) requestAnimationFrame(frame);
      };
      if (remaining > 0) requestAnimationFrame(frame);
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
  preserveScroll,
  preserveActionScroll,
  preserveSavedRecordScroll,
  preserveSavedRecordMutation,
  preserveModuleSwitchScroll
});
