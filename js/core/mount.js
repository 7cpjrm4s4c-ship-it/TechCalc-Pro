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
    const previousMinHeight = root.style.minHeight;
    const previousOverflowAnchor = root.style.overflowAnchor;
    const previousHeight = root.getBoundingClientRect?.().height || 0;
    const snapshot = state.get();

    // During a module re-render the old DOM is removed before the new DOM is in place.
    // On mobile Safari/Chrome this short height collapse can clamp the document scroll
    // position and causes visible jumps when saved cards are selected/deselected.
    // Keeping the previous module height for the render transaction removes the cause
    // instead of correcting the scroll position only afterwards.
    if (shouldPreserveScroll && previousHeight > 0) {
      root.style.minHeight = `${Math.ceil(previousHeight)}px`;
      root.style.overflowAnchor = 'none';
      try { document.activeElement?.blur?.(); } catch { /* ignore */ }
    }

    root.innerHTML = view(snapshot);
    if (shouldPreserveScroll) restoreViewportStable(viewport, { frames: 2, delays: [] });
    bindCommonInputs(root, state);
    if (afterRender) afterRender(root, snapshot, render);
    if (shouldPreserveScroll) {
      restoreViewportStable(viewport, { frames: 18, delays: [0, 16, 40, 80, 140, 260, 420, 700] });
      setTimeout(() => {
        if (!isCurrentMount()) return;
        root.style.minHeight = previousMinHeight;
        root.style.overflowAnchor = previousOverflowAnchor;
        restoreViewportStable(viewport, { frames: 4, delays: [0, 80] });
      }, 720);
    }
    didInitialRender = true;
  };

  const unsubscribe = state.subscribe(render);
  render();
  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  };
}
