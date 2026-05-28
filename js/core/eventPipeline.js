const DEFAULT_INTERACTIVE_SELECTOR = '[data-field], input, select, textarea, button, a, summary, [role="button"], [data-line-card], [data-saved-record-card], .saved-record-card, .segmented, [data-tc-action]';

function readElementValue(el) {
  if (!el) return undefined;
  if (el.type === 'checkbox') return Boolean(el.checked);
  if (el.type === 'radio') return el.checked ? el.value : undefined;
  return el.value;
}

function fieldPatch(el) {
  if (!el?.dataset?.field) return null;
  const value = readElementValue(el);
  if (value === undefined) return null;
  return { [el.dataset.field]: value };
}

function emitPipelineCommit(root, detail = {}) {
  try {
    root?.dispatchEvent?.(new CustomEvent('tc:commit', { bubbles: true, detail }));
  } catch { /* CustomEvent can be unavailable in minimal test runtimes. */ }
}

export function commitElementField(state, el, meta = {}) {
  const patch = fieldPatch(el);
  if (!patch || !state?.set) return false;
  state.set(patch, { action: meta.action || 'field:commit', notify: meta.notify });
  emitPipelineCommit(meta.root || el?.closest?.('[data-module], .module-view, main, #app'), {
    type: 'field',
    field: el.dataset.field,
    action: meta.action || 'field:commit',
    notify: meta.notify !== false
  });
  return true;
}

export function commitAllFields(root, state, meta = {}) {
  if (!root || !state?.set) return false;
  const patch = {};
  root.querySelectorAll('[data-field]').forEach(el => {
    const value = readElementValue(el);
    if (value !== undefined) patch[el.dataset.field] = value;
  });
  state.set(patch, { action: meta.action || 'fields:commit', notify: meta.notify });
  emitPipelineCommit(root, { type: 'fields', action: meta.action || 'fields:commit', notify: meta.notify !== false });
  return true;
}

function dispatchAction(root, state, actionEl, event, options = {}) {
  if (!actionEl || !root?.contains?.(actionEl)) return false;
  const action = actionEl.dataset.tcAction || actionEl.dataset.action;
  if (!action) return false;
  const handlers = options.actions || root.__tcActionHandlers || {};
  const handler = handlers[action];
  if (typeof handler !== 'function') return false;
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();
  handler({ action, element: actionEl, event, state, root });
  emitPipelineCommit(root, { type: 'action', action });
  return true;
}

export function registerCentralActions(root, actions = {}) {
  if (!root) return actions;
  root.__tcActionHandlers = { ...(root.__tcActionHandlers || {}), ...(actions || {}) };
  return root.__tcActionHandlers;
}

export function bindCentralEventPipeline(root, state, options = {}) {
  if (!root || !state?.set || root.__tcCentralEventPipelineBound) return () => {};
  root.__tcCentralEventPipelineBound = true;
  const cleanup = [];
  let hasDeferredInput = false;
  let pendingRaf = 0;

  const notifyCommit = payload => {
    if (typeof options.onCommit === 'function') options.onCommit(payload);
  };

  const renderDeferred = (force = false) => {
    if (!hasDeferredInput && !force) return;
    hasDeferredInput = false;
    state.set({}, { action: 'input:confirm', notify: true });
    notifyCommit({ action: 'input:confirm', force });
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
    commitElementField(state, el, { action: 'field:input', notify: false, root });
    hasDeferredInput = true;
    notifyCommit({ action: 'field:input', element: el });
  };

  const onChange = event => {
    const el = event.target?.closest?.('[data-field]');
    if (!el || !root.contains(el)) return;
    const immediate = el.matches('select') || el.dataset.commit === 'immediate' || el.dataset.lookup === 'true';
    commitElementField(state, el, { action: immediate ? 'field:change:immediate' : 'field:change', notify: immediate ? true : false, root });
    hasDeferredInput = !immediate;
    notifyCommit({ action: immediate ? 'field:change:immediate' : 'field:change', element: el });
    if (!immediate) scheduleDeferredRender();
  };

  const onBlur = event => {
    const el = event.target?.closest?.('input[data-field], textarea[data-field]');
    if (!el || !root.contains(el)) return;
    commitElementField(state, el, { action: 'field:blur', notify: true, root });
    hasDeferredInput = false;
    notifyCommit({ action: 'field:blur', element: el });
  };

  const onKeydown = event => {
    const actionEl = event.target?.closest?.('[data-tc-action], [data-action]');
    if (actionEl && root.contains(actionEl) && (event.key === 'Enter' || event.key === ' ')) {
      if (dispatchAction(root, state, actionEl, event, options)) return;
    }

    const el = event.target?.closest?.('input[data-field], textarea[data-field], select[data-field]');
    if (!el || !root.contains(el) || event.key !== 'Enter') return;
    event.preventDefault();
    commitElementField(state, el, { action: 'field:enter', notify: true, root });
    hasDeferredInput = false;
    notifyCommit({ action: 'field:enter', element: el });
  };

  const commitSegment = (segment, event) => {
    if (!segment || !root.contains(segment)) return false;
    const field = segment.dataset.segment;
    const value = segment.dataset.value;
    if (!field) return false;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    if (String(state.get?.()[field] ?? '') !== String(value ?? '')) {
      state.set({ [field]: value }, { action: 'segment:select' });
      emitPipelineCommit(root, { type: 'segment', action: 'segment:select', field });
      notifyCommit({ action: 'segment:select', element: segment });
    }
    return true;
  };

  const onClick = event => {
    const actionEl = event.target?.closest?.('[data-tc-action], [data-action]');
    if (dispatchAction(root, state, actionEl, event, options)) return;

    const segment = event.target?.closest?.('[data-segment]');
    commitSegment(segment, event);
  };

  const onPointerSegment = event => {
    const segment = event.target?.closest?.('[data-segment]');
    commitSegment(segment, event);
  };

  const confirmSurface = event => {
    if (!event?.target || event.target.closest?.(options.interactiveSelector || DEFAULT_INTERACTIVE_SELECTOR)) return;
    commitAllFields(root, state, { action: 'surface:confirm', notify: true });
    hasDeferredInput = false;
    notifyCommit({ action: 'surface:confirm', element: null });
  };

  const add = (target, name, fn, opts) => {
    target.addEventListener(name, fn, opts);
    cleanup.push(() => target.removeEventListener(name, fn, opts));
  };

  add(root, 'input', onInput, true);
  add(root, 'change', onChange, true);
  add(root, 'blur', onBlur, true);
  add(root, 'keydown', onKeydown, true);
  add(root, 'pointerup', onPointerSegment, true);
  add(root, 'touchend', onPointerSegment, { capture: true, passive: false });
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
