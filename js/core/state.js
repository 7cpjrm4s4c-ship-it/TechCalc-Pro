function cloneState(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function createModuleState(initial = {}) {
  let state = cloneState(initial);
  const listeners = new Set();
  const notify = () => listeners.forEach(fn => fn(cloneState(state)));
  return {
    get: () => cloneState(state),
    set: (patch, options = {}) => {
      state = { ...state, ...patch };
      if (options.notify !== false) notify();
    },
    reset: () => { state = cloneState(initial); notify(); },
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }
  };
}
