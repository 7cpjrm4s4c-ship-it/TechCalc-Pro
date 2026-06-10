import { commitAllFields, commitElementField } from './eventPipeline.js';

function closest(root, target, selector) {
  const node = target?.closest?.(selector);
  return node && root?.contains?.(node) ? node : null;
}

export function bindModuleStateBinding(root, state, options = {}) {
  // Phase 11D: the central event pipeline is the single write path.
  // This fallback binder remains for legacy/manual mounts that do not call bindCommonInputs.
  if (!root || !state?.set || root.__tcModuleStateBindingBound || root.__tcCentralEventPipelineBound) return () => {};
  root.__tcModuleStateBindingBound = true;
  const cleanup = [];
  const onAnyCommit = options.onCommit;

  const commitField = (el, action, notify = true) => {
    const ok = commitElementField(state, el, { action, notify });
    if (ok && typeof onAnyCommit === 'function') onAnyCommit({ action, element: el });
    return ok;
  };

  const commitSurface = action => {
    const ok = commitAllFields(root, state, { action, notify: true });
    if (ok && typeof onAnyCommit === 'function') onAnyCommit({ action, element: null });
    return ok;
  };

  const onChange = event => {
    const field = closest(root, event.target, '[data-field]');
    if (!field) return;
    commitField(field, field.matches('select') ? 'binding:select' : 'binding:change', true);
  };

  const onBlur = event => {
    const field = closest(root, event.target, 'input[data-field], textarea[data-field]');
    if (!field) return;
    commitField(field, 'binding:blur', true);
  };

  const onKeydown = event => {
    if (event.key !== 'Enter') return;
    const field = closest(root, event.target, 'input[data-field], textarea[data-field], select[data-field]');
    if (!field) return;
    event.preventDefault();
    commitField(field, 'binding:enter', true);
  };

  const onClick = event => {
    const segment = closest(root, event.target, '[data-segment]');
    if (segment) {
      event.preventDefault();
      state.set({ [segment.dataset.segment]: segment.dataset.value }, { action: 'binding:segment' });
      if (typeof onAnyCommit === 'function') onAnyCommit({ action: 'binding:segment', element: segment });
      return;
    }
    if (event.target?.closest?.('[data-field], button, a, summary, [role="button"], [data-line-select], [data-saved-record-card], .saved-record-card')) return;
    commitSurface('binding:surface');
  };

  const add = (target, name, handler, opts) => {
    target.addEventListener(name, handler, opts);
    cleanup.push(() => target.removeEventListener(name, handler, opts));
  };

  add(root, 'change', onChange, true);
  add(root, 'blur', onBlur, true);
  add(root, 'keydown', onKeydown, true);
  add(root, 'click', onClick, true);

  return () => {
    while (cleanup.length) cleanup.pop()();
    root.__tcModuleStateBindingBound = false;
  };
}
