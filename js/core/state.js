export function createModuleState(initial = {}) {
  let state = structuredClone(initial);
  const listeners = new Set();
  const notify = () => listeners.forEach(fn => fn(structuredClone(state)));
  return {
    get: () => structuredClone(state),
    set: (patch, options = {}) => {
      state = { ...state, ...patch };
      if (options.notify !== false) notify();
    },
    reset: () => { state = structuredClone(initial); notify(); },
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }
  };
}
