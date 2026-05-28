import { bindCommonInputs, bindNoClickScroll, snapshotViewport, restoreViewportStable, isMobileViewport } from './renderer.js';
import { safeReplaceContent } from './domUpdate.js';
import { createRenderScheduler } from './renderScheduler.js';

export function mountModule(root, state, view, afterRender) {
  const mountToken = root?.dataset?.renderToken || '';
  const isCurrentMount = () => !mountToken || root?.dataset?.renderToken === mountToken;
  let didInitialRender = false;

  bindNoClickScroll(root);

  const renderNow = () => {
    if (!isCurrentMount()) return;
    const shouldPreserveScroll = didInitialRender;
    const viewport = shouldPreserveScroll ? snapshotViewport({ anchor: document.activeElement }) : null;
    const previousMinHeight = root.style.minHeight;
    const previousOverflowAnchor = root.style.overflowAnchor;
    const previousHeight = root.getBoundingClientRect?.().height || 0;
    const snapshot = state.get();

    if (shouldPreserveScroll && previousHeight > 0) {
      root.style.minHeight = `${Math.ceil(previousHeight)}px`;
      root.style.overflowAnchor = 'none';
    }

    const changed = safeReplaceContent(root, view(snapshot), { restoreFocus: true });
    if (changed || !didInitialRender) {
      bindCommonInputs(root, state);
      if (afterRender) afterRender(root, snapshot, render);
    }

    if (shouldPreserveScroll) {
      restoreViewportStable(viewport, isMobileViewport() ? { frames: 10, delays: [16, 48, 120, 260, 520] } : { frames: 4, delays: [32, 96] });
      requestAnimationFrame(() => {
        if (!isCurrentMount()) return;
        root.style.minHeight = previousMinHeight;
        root.style.overflowAnchor = previousOverflowAnchor;
      });
    }
    didInitialRender = true;
  };

  const scheduler = createRenderScheduler(root, renderNow);
  const render = () => scheduler.schedule('module-state');
  const unsubscribe = state.subscribe(render);
  scheduler.flushNow('initial');
  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
    scheduler.dispose();
  };
}
