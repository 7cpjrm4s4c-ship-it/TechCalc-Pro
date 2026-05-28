function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function isEqualValue(a, b) {
  if (Object.is(a, b)) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  }
  return false;
}

function shallowEqual(a = {}, b = {}) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(key => isEqualValue(a[key], b[key]));
}

export function createStore(initialState = {}, options = {}) {
  let state = clone(initialState);
  const listeners = new Set();
  const moduleId = options.moduleId || 'module';
  let revision = 0;

  const emit = meta => {
    const snapshot = clone(state);
    listeners.forEach(listener => listener(snapshot, { moduleId, revision, ...meta }));
  };

  return {
    get: () => clone(state),
    getRevision: () => revision,
    set(patch = {}, meta = {}) {
      const next = { ...state, ...clone(patch) };
      if (shallowEqual(state, next)) {
        if (meta.notify === true) emit({ action: meta.action || 'noop', changed: [] });
        return;
      }
      const changed = Object.keys(next).filter(key => !isEqualValue(state[key], next[key]));
      state = next;
      revision += 1;
      if (meta.notify !== false) emit({ action: meta.action || 'patch', changed });
    },
    update(updater, meta = {}) {
      const patch = typeof updater === 'function' ? updater(clone(state)) : updater;
      this.set(patch || {}, { action: meta.action || 'update', notify: meta.notify });
    },
    replace(next = {}, meta = {}) {
      state = { ...clone(initialState), ...clone(next) };
      revision += 1;
      if (meta.notify !== false) emit({ action: meta.action || 'replace', changed: Object.keys(state) });
    },
    reset(meta = {}) {
      state = clone(initialState);
      revision += 1;
      if (meta.notify !== false) emit({ action: meta.action || 'reset', changed: Object.keys(state) });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const modules = new Map();

export function registerModuleStore(moduleId, store) {
  if (!moduleId || !store) return store;
  modules.set(moduleId, store);
  return store;
}

export function getModuleStore(moduleId) {
  return modules.get(moduleId) || null;
}

export function getAppStateSnapshot() {
  return Object.fromEntries([...modules.entries()].map(([id, store]) => [id, store.get()]));
}
