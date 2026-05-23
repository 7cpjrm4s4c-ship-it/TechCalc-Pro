import { bindCommonInputs } from './renderer.js';

export function mountModule(root, state, view, afterRender) {
  const mountToken = root?.dataset?.renderToken || '';

  const isCurrentMount = () => !mountToken || root?.dataset?.renderToken === mountToken;

  let didInitialRender = false;
  const render = () => {
    if (!isCurrentMount()) return;
    const shouldPreserveScroll = didInitialRender;
    const scrollX = window.scrollX || 0;
    const scrollY = window.scrollY || 0;
    const snapshot = state.get();
    root.innerHTML = view(snapshot);
    bindCommonInputs(root, state);
    if (afterRender) afterRender(root, snapshot, render);
    if (shouldPreserveScroll) {
      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    }
    didInitialRender = true;
  };

  const unsubscribe = state.subscribe(render);
  render();
  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}
