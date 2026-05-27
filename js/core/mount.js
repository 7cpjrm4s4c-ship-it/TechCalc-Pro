import { bindCommonInputs, bindNoClickScroll, snapshotViewport, restoreViewportStable } from './renderer.js';

export function mountModule(root, state, view, afterRender) {
  const mountToken = root?.dataset?.renderToken || '';

  const isCurrentMount = () => !mountToken || root?.dataset?.renderToken === mountToken;

  let didInitialRender = false;
  bindNoClickScroll(root);

  const render = () => {
    if (!isCurrentMount()) return;
    const shouldPreserveScroll = didInitialRender;
    const viewport = snapshotViewport();
    const snapshot = state.get();
    root.innerHTML = view(snapshot);
    bindCommonInputs(root, state);
    if (afterRender) afterRender(root, snapshot, render);
    if (shouldPreserveScroll) {
      restoreViewportStable(viewport, { frames: 6, delays: [40, 120, 260] });
    }
    didInitialRender = true;
  };

  const unsubscribe = state.subscribe(render);
  render();
  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}
