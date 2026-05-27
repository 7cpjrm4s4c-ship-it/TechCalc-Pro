export function fieldSelector(key) {
  const safe = String(key || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `[data-field="${safe}"]`;
}

export function readFieldValue(root, key, fallback = '') {
  const el = root?.querySelector?.(fieldSelector(key));
  return el ? el.value : fallback;
}

export function commitFields(root, state, keys = [], { notify = false } = {}) {
  if (!root || !state || typeof state.set !== 'function') return {};
  const patch = {};
  keys.forEach(key => {
    const el = root.querySelector(fieldSelector(key));
    if (el) patch[key] = el.value;
  });
  if (Object.keys(patch).length) state.set(patch, { notify });
  return patch;
}

export function bindActionWithCommittedFields(root, selector, state, keys, handler) {
  const el = root?.querySelector?.(selector);
  if (!el) return;
  el.addEventListener('click', event => {
    const patch = commitFields(root, state, keys, { notify: false });
    handler?.(event, patch);
  });
}
