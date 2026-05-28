const DEFAULT_INTERACTIVE_SELECTOR = '[data-field], input, select, textarea, button, a, summary, [role="button"], [data-line-card], [data-saved-record-card], .saved-record-card, .segmented';

function fieldPatch(el) {
  if (!el?.dataset?.field) return null;
  return { [el.dataset.field]: el.value };
}

export function commitElementField(state, el, meta = {}) {
  const patch = fieldPatch(el);
  if (!patch || !state?.set) return false;
  state.set(patch, { action: meta.action || 'field:commit', notify: meta.notify });
  return true;
}

export function commitAllFields(root, state, meta = {}) {
  if (!root || !state?.set) return false;
  const patch = {};
  root.querySelectorAll('[data-field]').forEach(el => {
    patch[el.dataset.field] = el.value;
  });
  state.set(patch, { action: meta.action || 'fields:commit', notify: meta.notify });
  return true;
}

export function bindCentralEventPipeline(root, state, options = {}) {
  if (!root || !state?.set || root.__tcCentralEventPipelineBound) return () => {};
  root.__tcCentralEventPipelineBound = true;
  const cleanup = [];
  let hasDeferredInput = false;
  let pendingRaf = 0;

  const renderDeferred = (force = false) => {
    if (!hasDeferredInput && !force) return;
    hasDeferredInput = false;
    state.set({}, { action: 'input:confirm', notify: true });
  };

  const scheduleDeferredRender = ({ force = false } = {}) => {
    if (pendingRaf) cancelAnimationFrame(pendingRaf);
    pendingRaf = requestAnimationFrame(() => {
      pendingRaf = 0;
      const active = document.activeElement;
      const committedActionAt = Number(root?.dataset?.tcCommittedActionAt || 0);
      if (!force && committedActionAt && Date.now() - committedActionAt < 500) return;
      if (!force && active && root.contains(active) && active.matches('[data-field]')) return;
      renderDeferred(force);
    });
  };

  const onInput = event => {
    const el = event.target?.closest?.('input[data-field], textarea[data-field]');
    if (!el || !root.contains(el)) return;
    commitElementField(state, el, { action: 'field:input', notify: false });
    hasDeferredInput = true;
  };

  const onChange = event => {
    const el = event.target?.closest?.('[data-field]');
    if (!el || !root.contains(el)) return;
    const immediate = el.matches('select') || el.dataset.commit === 'immediate';
    commitElementField(state, el, { action: immediate ? 'field:change:immediate' : 'field:change', notify: immediate ? true : false });
    hasDeferredInput = !immediate;
    if (!immediate) scheduleDeferredRender();
  };

  const onBlur = event => {
    const el = event.target?.closest?.('input[data-field], textarea[data-field]');
    if (!el || !root.contains(el)) return;
    commitElementField(state, el, { action: 'field:blur', notify: false });
    hasDeferredInput = true;
    scheduleDeferredRender({ force: options.renderOnBlur !== false });
  };

  const onKeydown = event => {
    const el = event.target?.closest?.('input[data-field], textarea[data-field]');
    if (!el || !root.contains(el) || event.key !== 'Enter') return;
    event.preventDefault();
    commitElementField(state, el, { action: 'field:enter', notify: false });
    hasDeferredInput = true;
    renderDeferred(true);
  };

  const onClick = event => {
    const segment = event.target?.closest?.('[data-segment]');
    if (!segment || !root.contains(segment)) return;
    event.preventDefault();
    state.set({ [segment.dataset.segment]: segment.dataset.value }, { action: 'segment:select' });
  };

  const confirmSurface = event => {
    if (!event?.target || event.target.closest?.(options.interactiveSelector || DEFAULT_INTERACTIVE_SELECTOR)) return;
    commitAllFields(root, state, { action: 'surface:confirm', notify: false });
    hasDeferredInput = true;
    scheduleDeferredRender({ force: true });
  };

  const add = (target, name, fn, opts) => {
    target.addEventListener(name, fn, opts);
    cleanup.push(() => target.removeEventListener(name, fn, opts));
  };

  add(root, 'input', onInput, true);
  add(root, 'change', onChange, true);
  add(root, 'blur', onBlur, true);
  add(root, 'keydown', onKeydown, true);
  add(root, 'click', onClick, true);
  add(root, 'pointerdown', confirmSurface, true);
  add(root, 'touchstart', confirmSurface, { capture: true, passive: true });
  add(root, 'click', confirmSurface, true);

  return () => {
    if (pendingRaf) cancelAnimationFrame(pendingRaf);
    while (cleanup.length) cleanup.pop()();
    root.__tcCentralEventPipelineBound = false;
  };
}
