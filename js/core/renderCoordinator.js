import { safeReplaceContent } from './domUpdate.js';
import { createRenderScheduler } from './renderScheduler.js';
import { snapshotViewport, restoreViewportStable, isMobileViewport } from './renderer.js';

const FIELD_ACTION_RE = /^(field:input|field:change|field:blur|field:enter|input:confirm|surface:confirm|segment:select|binding:)/;
const STRUCTURAL_ACTION_RE = /^(saved:|line:|record:|delete|reset|replace|module:)/;


function clampViewportToDocumentEnd() {
  const doc = document.scrollingElement || document.documentElement;
  if (!doc || typeof window === 'undefined') return;
  const viewportHeight = window.visualViewport?.height || window.innerHeight || 0;
  const maxY = Math.max(0, (doc.scrollHeight || 0) - viewportHeight);
  const currentY = window.scrollY || doc.scrollTop || 0;
  if (currentY > maxY + 1) window.scrollTo(window.scrollX || doc.scrollLeft || 0, maxY);
}

function clampViewportStable() {
  requestAnimationFrame(clampViewportToDocumentEnd);
  setTimeout(clampViewportToDocumentEnd, 80);
  setTimeout(clampViewportToDocumentEnd, 220);
}

function actionFrom(meta = {}) {
  return String(meta?.action || 'render');
}

function shouldPreserveScroll(meta = {}) {
  const action = actionFrom(meta);
  if (!action || action === 'initial') return false;
  if (STRUCTURAL_ACTION_RE.test(action)) return true;
  // Field and segment commits should keep focus stable but must not fight the
  // browser's own input/keyboard scrolling, especially on mobile browsers.
  if (FIELD_ACTION_RE.test(action)) return false;
  return true;
}

function renderKeyFor(stateSnapshot, html) {
  // html is already the concrete view output. Keeping the key simple avoids
  // expensive JSON snapshots while still suppressing equal DOM writes.
  return String(html ?? '');
}

export function createRenderCoordinator(root, options = {}) {
  if (!root) throw new Error('createRenderCoordinator requires a root element');
  const view = options.view;
  const afterRender = options.afterRender;
  const state = options.state;
  if (typeof view !== 'function') throw new Error('createRenderCoordinator requires a view function');
  if (!state?.get) throw new Error('createRenderCoordinator requires a module state');

  let didInitialRender = false;
  let lastRenderKey = '';
  let lastSnapshot = null;
  let currentMeta = { action: 'initial' };
  let render;

  const isCurrent = () => !options.isCurrent || options.isCurrent();

  const run = ({ reason } = {}) => {
    if (!isCurrent()) return;
    const snapshot = state.get();
    const meta = currentMeta || { action: reason || 'render' };
    currentMeta = { action: 'render' };
    const html = view(snapshot);
    const renderKey = renderKeyFor(snapshot, html);
    const preserve = didInitialRender && shouldPreserveScroll(meta);
    const viewport = preserve ? snapshotViewport({ anchor: document.activeElement }) : null;
    const previousMinHeight = root.style.minHeight;
    const previousOverflowAnchor = root.style.overflowAnchor;
    const previousHeight = root.getBoundingClientRect?.().height || 0;

    if (preserve && previousHeight > 0) {
      root.style.minHeight = `${Math.ceil(previousHeight)}px`;
      root.style.overflowAnchor = 'none';
    }

    const changed = renderKey !== lastRenderKey && safeReplaceContent(root, html, {
      restoreFocus: options.restoreFocus !== false
    });
    if (changed) lastRenderKey = renderKey;
    lastSnapshot = snapshot;

    if (changed || !didInitialRender || options.afterEveryRender === true) {
      afterRender?.(root, snapshot, render, { changed, meta });
    }

    if (preserve) {
      restoreViewportStable(viewport, isMobileViewport()
        ? { frames: 4, delays: [16, 64, 180] }
        : { frames: 2, delays: [32] });
      requestAnimationFrame(() => {
        if (!isCurrent()) return;
        root.style.minHeight = previousMinHeight;
        root.style.overflowAnchor = previousOverflowAnchor;
        clampViewportStable();
      });
    } else {
      clampViewportStable();
    }
    didInitialRender = true;
  };

  const scheduler = createRenderScheduler(root, run);
  render = (meta = {}) => {
    currentMeta = typeof meta === 'string' ? { action: meta } : { ...(meta || {}) };
    scheduler.schedule(currentMeta.action || 'module-state');
  };

  return {
    render,
    flush(meta = { action: 'initial' }) {
      currentMeta = typeof meta === 'string' ? { action: meta } : { ...(meta || {}) };
      scheduler.flushNow(currentMeta.action || 'sync');
    },
    dispose() { scheduler.dispose(); },
    getLastSnapshot() { return lastSnapshot; },
    shouldPreserveScroll
  };
}

export { shouldPreserveScroll as shouldPreserveScrollForRender };
