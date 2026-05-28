export function createPlatformLifecycle(root, name) {
  if (!root) return { bindOnce() {}, has() { return false; } };
  const key = `__tcLifecycle_${name}`;
  if (!root[key]) root[key] = new Set();
  return {
    has(id) { return root[key].has(id); },
    bindOnce(id, bind) {
      if (root[key].has(id)) return false;
      root[key].add(id);
      bind?.();
      return true;
    }
  };
}
