import { bindCommonInputs, bindNoClickScroll } from './renderer.js';
import { createRenderCoordinator } from './renderCoordinator.js';
import { bindModuleStateBinding } from './stateBinding.js';

export function mountModule(root, state, view, afterRender) {
  const mountToken = root?.dataset?.renderToken || '';
  const isCurrentMount = () => !mountToken || root?.dataset?.renderToken === mountToken;

  bindNoClickScroll(root);

  const coordinator = createRenderCoordinator(root, {
    state,
    view,
    isCurrent: isCurrentMount,
    afterRender(rootEl, snapshot, render, meta) {
      bindCommonInputs(rootEl, state);
      bindModuleStateBinding(rootEl, state);
      afterRender?.(rootEl, snapshot, render, meta);
    }
  });

  const unsubscribe = state.subscribe((_, meta) => coordinator.render(meta));
  coordinator.flush({ action: 'initial' });
  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
    coordinator.dispose();
  };
}
