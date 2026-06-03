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
  const handlers = root?.__tcCommitHandlers;
  if (handlers && typeof handlers.forEach === 'function') {
    handlers.forEach(handler => {
      try { handler({ detail, root }); } catch { /* a module commit hook must not break the global pipeline */ }
    });
  }
  try {
    root?.dispatchEvent?.(new CustomEvent('tc:commit', { bubbles: true, detail }));
  } catch { /* CustomEvent can be unavailable in minimal test runtimes. */ }
}

export function registerPipelineCommitHandler(root, key, handler) {
  if (!root || !key || typeof handler !== 'function') return () => {};
  root.__tcCommitHandlers = root.__tcCommitHandlers || new Map();
  root.__tcCommitHandlers.set(String(key), handler);
  return () => {
    if (root.__tcCommitHandlers?.get(String(key)) === handler) root.__tcCommitHandlers.delete(String(key));
  };
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

function resolveActionHandler(root, action, options = {}) {
  const primary = (options.actions || root.__tcActionHandlers || {})[action];
  if (typeof primary === 'function') return primary;

  // Phase 17C.6: SavedRecord controls are structural platform controls. They
  // must not depend on a stale per-render action map or on legacy module-level
  // data-saved patches. Always resolve them from the current platform context
  // before treating the action as unknown.
  if (String(action || '').startsWith('saved:')) {
    const saved = root?.__tcPlatformSavedRecordContext?.handlers?.[action];
    if (typeof saved === 'function') return saved;
  }
  return null;
}

function dispatchAction(root, state, actionEl, event, options = {}) {
  if (!actionEl || !root?.contains?.(actionEl)) return false;
  const action = actionEl.dataset.tcAction || actionEl.dataset.action;
  if (!action) return false;

  // Platform SavedRecord rows are structural controls. Handle load/toggle/delete
  // through the current platform bridge before generic action dispatch so nested
  // buttons cannot be swallowed by the article-level saved:load action. This
  // mirrors the stable Heizung/Kälte contract while keeping the implementation
  // central and module-agnostic.
  if (String(action).startsWith('saved:')) {
    const bridge = root?.__tcPlatformSavedRecordBridge;
    if (bridge?.handle?.({ action, element: actionEl, event, state, root })) {
      emitPipelineCommit(root, { type: 'action', action });
      return true;
    }
  }

  const handler = resolveActionHandler(root, action, options);
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

function markPointerAction(root, action) {
  if (!root?.dataset || !action) return;
  root.dataset.tcPointerAction = String(action);
  root.dataset.tcPointerActionAt = String(Date.now());
}

function wasPointerActionHandled(root, action) {
  if (!root?.dataset || !action) return false;
  return root.dataset.tcPointerAction === String(action) && Date.now() - Number(root.dataset.tcPointerActionAt || 0) < 650;
}

function touchPoint(event) {
  const touch = event?.changedTouches?.[0] || event?.touches?.[0];
  if (!touch) return null;
  return { x: Number(touch.clientX || 0), y: Number(touch.clientY || 0) };
}

function beginTouchGesture(root, event) {
  if (!root?.dataset) return;
  const point = touchPoint(event);
  if (!point) return;
  root.__tcTouchGesture = { x: point.x, y: point.y, moved: false };
  delete root.dataset.tcSuppressTouchClickAt;
}

function updateTouchGesture(root, event) {
  const gesture = root?.__tcTouchGesture;
  const point = touchPoint(event);
  if (!gesture || !point) return;
  const dx = Math.abs(point.x - gesture.x);
  const dy = Math.abs(point.y - gesture.y);
  if (dx > 8 || dy > 8) gesture.moved = true;
}

function markScrollGesture(root) {
  if (!root?.dataset) return;
  const now = String(Date.now());
  root.dataset.tcSuppressTouchClickAt = now;
  root.dataset.tcSuppressPointerActionAt = now;
}

function shouldSuppressTouchAction(root, event) {
  if (event?.type !== 'touchend') return false;
  const gesture = root?.__tcTouchGesture;
  const point = touchPoint(event);
  if (!gesture || !point) return false;
  const dx = Math.abs(point.x - gesture.x);
  const dy = Math.abs(point.y - gesture.y);
  const moved = gesture.moved || dx > 8 || dy > 8;
  if (moved) markScrollGesture(root);
  root.__tcTouchGesture = null;
  return moved;
}

function pointerPoint(event) {
  if (!event) return null;
  return { x: Number(event.clientX || 0), y: Number(event.clientY || 0), pointerType: event.pointerType || 'mouse' };
}

function beginPointerGesture(root, event) {
  if (!root || event?.pointerType === 'mouse') return;
  const point = pointerPoint(event);
  if (!point) return;
  root.__tcPointerGesture = { x: point.x, y: point.y, pointerId: event.pointerId, moved: false };
}

function updatePointerGesture(root, event) {
  const gesture = root?.__tcPointerGesture;
  const point = pointerPoint(event);
  if (!gesture || !point) return;
  if (gesture.pointerId !== undefined && event.pointerId !== undefined && gesture.pointerId !== event.pointerId) return;
  const dx = Math.abs(point.x - gesture.x);
  const dy = Math.abs(point.y - gesture.y);
  if (dx > 8 || dy > 8) gesture.moved = true;
}

function shouldSuppressPointerAction(root, event) {
  if (event?.type !== 'pointerup' || event?.pointerType === 'mouse') return false;
  const gesture = root?.__tcPointerGesture;
  if (!gesture) return false;
  updatePointerGesture(root, event);
  const moved = Boolean(gesture.moved);
  root.__tcPointerGesture = null;
  if (moved) markScrollGesture(root);
  return moved;
}

function wasTouchClickSuppressed(root) {
  if (!root?.dataset?.tcSuppressTouchClickAt) return false;
  return Date.now() - Number(root.dataset.tcSuppressTouchClickAt || 0) < 700;
}

function wasPointerActionSuppressed(root) {
  if (!root?.dataset?.tcSuppressPointerActionAt) return false;
  return Date.now() - Number(root.dataset.tcSuppressPointerActionAt || 0) < 700;
}

export function bindCentralEventPipeline(root, state, options = {}) {
  if (!root || !state?.set) return () => {};
  if (root.__tcCentralEventPipelineBound) {
    if (root.__tcCentralEventPipelineState === state) {
      return root.__tcCentralEventPipelineCleanup || (() => {});
    }
    try { root.__tcCentralEventPipelineCleanup?.(); } catch { /* allow safe rebind on route/module changes */ }
  }
  root.__tcCentralEventPipelineBound = true;
  root.__tcCentralEventPipelineState = state;
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
    const el = event.target?.closest?.('input[data-field], textarea[data-field], select[data-field]');
    if (!el || !root.contains(el)) return;
    if (el.matches('select')) {
      const deferRender = el.dataset.render === 'defer';
      commitElementField(state, el, { action: 'field:input:select', notify: !deferRender, root });
      hasDeferredInput = false;
      notifyCommit({ action: 'field:input:select', element: el });
      return;
    }
    commitElementField(state, el, { action: 'field:input', notify: false, root });
    hasDeferredInput = true;
    notifyCommit({ action: 'field:input', element: el });
  };

  const onChange = event => {
    const el = event.target?.closest?.('[data-field]');
    if (!el || !root.contains(el)) return;
    const deferRender = el.dataset.commit === 'defer' || el.dataset.render === 'defer';
    const immediateCommit = el.matches('select') || el.dataset.commit === 'immediate' || el.dataset.lookup === 'true';
    const shouldNotify = immediateCommit && !deferRender;
    commitElementField(state, el, { action: immediateCommit ? 'field:change:immediate' : 'field:change', notify: shouldNotify, root });
    if (el.matches('select')) {
      try { el.blur(); } catch { /* native select may not allow blur in all runtimes */ }
    }
    hasDeferredInput = !immediateCommit;
    notifyCommit({ action: immediateCommit ? 'field:change:immediate' : 'field:change', element: el });
    if (!immediateCommit) scheduleDeferredRender();
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

    // Optimistic visual feedback: mobile Safari can delay click/change work until
    // after a subsequent surface tap. The active state is therefore updated before
    // the store notification and render scheduler run.
    root.querySelectorAll(`[data-segment="${field}"]`).forEach(button => {
      button.classList.toggle('is-active', String(button.dataset.value) === String(value));
      button.setAttribute('aria-selected', String(String(button.dataset.value) === String(value)));
    });

    if (String(state.get?.()[field] ?? '') !== String(value ?? '')) {
      state.set({ [field]: value }, { action: 'segment:select' });
      emitPipelineCommit(root, { type: 'segment', action: 'segment:select', field });
      notifyCommit({ action: 'segment:select', element: segment });
    }
    return true;
  };

  const segmentActionKey = segment => {
    if (!segment) return '';
    return `segment:${segment.dataset.segment || ''}:${segment.dataset.value || ''}`;
  };

  const handleSegment = (segment, event) => {
    if (!segment || !root.contains(segment)) return false;
    const handlers = options.actions || root.__tcActionHandlers || {};
    if (typeof handlers.segment === 'function') {
      return dispatchAction(root, state, segment, event, options);
    }
    return commitSegment(segment, event);
  };

  const onClick = event => {
    const actionEl = event.target?.closest?.('[data-tc-action], [data-action]');
    const action = actionEl?.dataset?.tcAction || actionEl?.dataset?.action;
    if (actionEl && (wasTouchClickSuppressed(root) || wasPointerActionSuppressed(root))) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      return;
    }
    if (wasPointerActionHandled(root, action)) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      return;
    }
    if (dispatchAction(root, state, actionEl, event, options)) return;

    const segment = event.target?.closest?.('[data-segment]');
    if (segment) {
      const key = segmentActionKey(segment);
      if (wasPointerActionHandled(root, key)) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        event?.stopImmediatePropagation?.();
        return;
      }
      handleSegment(segment, event);
    }
  };

  const onPointerAction = event => {
    const actionEl = event.target?.closest?.('[data-tc-action], [data-action]');
    const action = actionEl?.dataset?.tcAction || actionEl?.dataset?.action;
    if (!actionEl || action === 'segment') return false;
    if (shouldSuppressTouchAction(root, event) || shouldSuppressPointerAction(root, event)) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      return true;
    }
    if (wasPointerActionHandled(root, action)) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      return true;
    }
    if (dispatchAction(root, state, actionEl, event, options)) {
      markPointerAction(root, action);
      return true;
    }
    return false;
  };

  const onPointerSegment = event => {
    if (onPointerAction(event)) return;
    const segment = event.target?.closest?.('[data-segment]');
    if (!segment) return;
    if (shouldSuppressTouchAction(root, event) || shouldSuppressPointerAction(root, event)) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      return;
    }
    const key = segmentActionKey(segment);
    if (wasPointerActionHandled(root, key)) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      return;
    }
    if (handleSegment(segment, event)) markPointerAction(root, key);
  };

  const confirmSurface = event => {
    if (!event?.target) return;
    if (event.target.closest?.(options.interactiveSelector || DEFAULT_INTERACTIVE_SELECTOR)) return;
    commitAllFields(root, state, { action: 'surface:confirm', notify: true });
    hasDeferredInput = false;
    notifyCommit({ action: 'surface:confirm', element: null });
  };

  const keyboardFieldSelector = 'input[data-field], textarea[data-field], select[data-field]';
  const setKeyboardOpen = value => {
    if (!document?.body) return;
    document.body.classList.toggle('tc-keyboard-open', Boolean(value));
  };
  const onFocusIn = event => {
    if (event.target?.closest?.(keyboardFieldSelector) && root.contains(event.target)) setKeyboardOpen(true);
  };
  const onFocusOut = event => {
    if (!event.target?.closest?.(keyboardFieldSelector)) return;
    setTimeout(() => {
      const active = document.activeElement;
      if (!active || !root.contains(active) || !active.matches?.(keyboardFieldSelector)) setKeyboardOpen(false);
    }, 80);
  };

  const add = (target, name, fn, opts) => {
    target.addEventListener(name, fn, opts);
    cleanup.push(() => target.removeEventListener(name, fn, opts));
  };

  add(root, 'focusin', onFocusIn, true);
  add(root, 'focusout', onFocusOut, true);
  add(root, 'input', onInput, true);
  add(root, 'change', onChange, true);
  add(root, 'blur', onBlur, true);
  add(root, 'keydown', onKeydown, true);
  add(root, 'pointerup', onPointerSegment, true);
  add(root, 'touchstart', event => { beginTouchGesture(root, event); confirmSurface(event); }, { capture: true, passive: true });
  add(root, 'touchmove', event => updateTouchGesture(root, event), { capture: true, passive: true });
  add(root, 'touchend', onPointerSegment, { capture: true, passive: false });
  add(root, 'click', onClick, true);
  add(root, 'pointerdown', event => { beginPointerGesture(root, event); confirmSurface(event); }, true);
  add(root, 'pointermove', event => updatePointerGesture(root, event), { capture: true, passive: true });
  add(root, 'click', confirmSurface, true);

  const unbind = () => {
    if (pendingRaf) cancelAnimationFrame(pendingRaf);
    while (cleanup.length) cleanup.pop()();
    root.__tcCentralEventPipelineBound = false;
    root.__tcCentralEventPipelineState = null;
    setKeyboardOpen(false);
    root.__tcCentralEventPipelineCleanup = null;
  };
  root.__tcCentralEventPipelineCleanup = unbind;
  return unbind;
}
