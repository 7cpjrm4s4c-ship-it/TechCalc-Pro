const registry = new Set();

function normalizeOptions(options) {
  if (options === true) return { capture: true };
  if (!options) return {};
  return { ...options };
}

export function on(target, eventName, handler, options) {
  if (!target || !eventName || typeof handler !== 'function') return () => {};
  const opts = options;
  target.addEventListener(eventName, handler, opts);
  const entry = { target, eventName, handler, options: opts, meta: normalizeOptions(opts) };
  registry.add(entry);
  let active = true;
  return function off() {
    if (!active) return;
    active = false;
    registry.delete(entry);
    target.removeEventListener(eventName, handler, opts);
  };
}

export function once(target, eventName, handler, options = {}) {
  return on(target, eventName, handler, { ...normalizeOptions(options), once: true });
}

export function createEventScope(name = 'platform-event-scope') {
  const cleanups = [];
  return Object.freeze({
    name,
    on(target, eventName, handler, options) {
      const cleanup = on(target, eventName, handler, options);
      cleanups.push(cleanup);
      return cleanup;
    },
    add(cleanup) {
      if (typeof cleanup === 'function') cleanups.push(cleanup);
      else if (typeof cleanup?.dispose === 'function') cleanups.push(() => cleanup.dispose());
      else if (typeof cleanup?.destroy === 'function') cleanups.push(() => cleanup.destroy());
      return cleanup;
    },
    dispose() {
      while (cleanups.length) {
        try { cleanups.pop()?.(); } catch (error) {
          console.warn(`Event-Scope ${name} konnte nicht vollständig bereinigt werden.`, error);
        }
      }
    },
    get size() { return cleanups.length; }
  });
}

export function trackGlobalEventListener(target, eventName, handler, options) {
  return on(target, eventName, handler, options);
}

export function getActiveEventListenerCount() {
  return registry.size;
}

export function snapshotEventListeners() {
  return Array.from(registry).map(entry => ({
    eventName: entry.eventName,
    capture: Boolean(entry.meta.capture),
    passive: Boolean(entry.meta.passive),
    once: Boolean(entry.meta.once)
  }));
}
