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

export function markCommittedAction(root) {
  if (!root?.dataset) return;
  root.dataset.tcCommittedActionAt = String(Date.now());
}

export function prepareCommittedAction(root, state, keys = []) {
  markCommittedAction(root);
  return commitFields(root, state, keys, { notify: false });
}

export function bindActionWithCommittedFields(root, selector, state, keys, handler) {
  const el = root?.querySelector?.(selector);
  if (!el) return;
  const prepare = () => prepareCommittedAction(root, state, keys);
  el.addEventListener('pointerdown', prepare, { capture: true });
  el.addEventListener('mousedown', prepare, { capture: true });
  el.addEventListener('click', event => {
    const patch = prepareCommittedAction(root, state, keys);
    handler?.(event, patch);
  });
}


export function bindDelegatedActionWithCommittedFields(root, selector, state, keys, handler) {
  if (!root) return;
  const prepare = event => {
    const trigger = event.target.closest(selector);
    if (!trigger) return;
    prepareCommittedAction(root, state, keys);
  };
  root.addEventListener('pointerdown', prepare, { capture: true });
  root.addEventListener('mousedown', prepare, { capture: true });
  root.addEventListener('click', event => {
    const trigger = event.target.closest(selector);
    if (!trigger) return;
    const patch = prepareCommittedAction(root, state, keys);
    handler?.(event, patch, trigger);
  });
}

export function normalizeQuantityInput(value, fallback = 0) {
  const normalized = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : fallback;
}

export function bindLiveCollectionInput(root, selector, { state, getItems, setItems, matchId, readValue, notifyOnInput = false }) {
  if (!root || !state || typeof state.set !== 'function') return;
  const commit = (input, notify = true) => {
    if (!input) return;
    const current = state.get();
    const items = typeof getItems === 'function' ? getItems(current) : [];
    const next = (items || []).map(item => matchId(item, input) ? { ...item, ...readValue(input, item, current) } : item);
    state.set(setItems(next, current), { notify });
  };
  root.addEventListener('input', event => {
    const input = event.target.closest(selector);
    if (!input) return;
    event.stopPropagation();
    commit(input, notifyOnInput);
  });
  root.addEventListener('blur', event => {
    const input = event.target.closest(selector);
    if (!input) return;
    event.stopPropagation();
    commit(input, true);
  }, true);
  root.addEventListener('keydown', event => {
    const input = event.target.closest(selector);
    if (!input || event.key !== 'Enter') return;
    event.preventDefault();
    commit(input, true);
  });
}
