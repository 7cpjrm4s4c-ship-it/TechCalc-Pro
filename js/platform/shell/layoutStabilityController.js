/* TechCalc Pro 1.3.2-dev.30 — viewport/safe-area stabilization. */

function setViewportVars() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const root = document.documentElement;
  const visualHeight = window.visualViewport?.height;
  const height = Math.max(0, Math.round(visualHeight || window.innerHeight || 0));
  const width = Math.max(0, Math.round(window.visualViewport?.width || window.innerWidth || 0));
  if (height) root.style.setProperty('--tc-viewport-height', `${height}px`);
  if (width) root.style.setProperty('--tc-viewport-width', `${width}px`);
  root.classList.add('tc-layout-ready');
}

function scheduleViewportSync() {
  setViewportVars();
  requestAnimationFrame?.(() => {
    setViewportVars();
    requestAnimationFrame?.(setViewportVars);
  });
  setTimeout(setViewportVars, 80);
  setTimeout(setViewportVars, 260);
}

export function initializeLayoutStabilityController() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (document.documentElement.__tcLayoutStabilityBound) return;
  document.documentElement.__tcLayoutStabilityBound = true;

  scheduleViewportSync();
  window.addEventListener('DOMContentLoaded', scheduleViewportSync, { once: true });
  window.addEventListener('load', scheduleViewportSync, { once: true });
  window.addEventListener('pageshow', scheduleViewportSync, { passive: true });
  window.addEventListener('resize', scheduleViewportSync, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(scheduleViewportSync, 120), { passive: true });
  window.visualViewport?.addEventListener?.('resize', scheduleViewportSync, { passive: true });
  window.visualViewport?.addEventListener?.('scroll', scheduleViewportSync, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleViewportSync();
  });
}
