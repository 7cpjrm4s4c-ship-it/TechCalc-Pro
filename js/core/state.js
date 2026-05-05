export function createModuleState(initial = {}) {
  let state = structuredClone(initial);
  const listeners = new Set();
  return {
    get: () => structuredClone(state),
    set: patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn(structuredClone(state))); },
    reset: () => { state = structuredClone(initial); listeners.forEach(fn => fn(structuredClone(state))); },
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }
  };
}
