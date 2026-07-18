import { modules } from './registry.js';
import { loadPreferences } from './preferences.js';

const FALLBACK_ROUTE = 'heating-cooling';
const HASH_PREFIX = '#/';
let renderCallback = () => Promise.resolve(false);
let activeRouteId = '';
let requestedRouteId = '';
let navigationVersion = 0;

function appRoot() {
  return typeof document !== 'undefined' ? document.getElementById('app') : null;
}

function preferredStartRoute() {
  const preferred = loadPreferences().mobileQuickAccess || [];
  return preferred.find(id => modules.get(id))
    || (modules.get(FALLBACK_ROUTE) ? FALLBACK_ROUTE : modules.all()[0]?.id);
}

function resetViewportAfterModuleChange(previousRouteId, nextRouteId) {
  if (!nextRouteId || previousRouteId === nextRouteId || typeof window === 'undefined') return;
  const scroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(scroll);
  else scroll();
}

function isMountedRoute(id) {
  const root = appRoot();
  return Boolean(root && root.dataset?.activeModuleId === id && !root.hasAttribute('aria-busy'));
}

function isPendingRoute(id) {
  const root = appRoot();
  return Boolean(root && root.dataset?.pendingModuleId === id && root.hasAttribute('aria-busy'));
}

export function initRouter(onRoute) {
  renderCallback = typeof onRoute === 'function' ? onRoute : () => Promise.resolve(false);
  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('popstate', handleRouteChange);

  const initialRoute = currentRoute();
  activeRouteId = initialRoute;
  requestedRouteId = initialRoute;

  if (!window.location.hash) {
    replaceHash(initialRoute);
    return;
  }

  normalizeHashAndRender(initialRoute, { source: 'init' });
}

export async function navigate(id, options = {}) {
  if (!modules.get(id)) return false;

  const root = appRoot();
  const targetHash = `${HASH_PREFIX}${id}`;
  const currentHash = window.location.hash || '';
  const mounted = isMountedRoute(id);
  const pending = isPendingRoute(id);

  // Global same-module guard. A second tap/click on the active module must never
  // start a new mount or show the loading placeholder. Modules such as Heizung,
  // Lueftung and Trinkwasser already behaved like stable mounted views; this
  // rule makes that behavior the router default for every module.
  if (!options.forceRender && (mounted || pending)) {
    if (currentHash !== targetHash) {
      const path = `${window.location.pathname}${window.location.search}${targetHash}`;
      window.history.replaceState({ moduleId: id, version: navigationVersion }, '', path);
    }
    requestedRouteId = id;
    return true;
  }

  navigationVersion += 1;
  requestedRouteId = id;

  // App-internal navigation has exactly one content-render path. Touch, mouse,
  // overflow menu and programmatic navigation all call this function directly.
  // The content render is awaited so navigation state and module content cannot
  // diverge into the broken state "button active, old module still visible".
  if (currentHash !== targetHash) {
    const path = `${window.location.pathname}${window.location.search}${targetHash}`;
    window.history.pushState({ moduleId: id, version: navigationVersion }, '', path);
  } else if (options.force) {
    window.history.replaceState({ moduleId: id, version: navigationVersion }, '', `${window.location.pathname}${window.location.search}${targetHash}`);
  }

  const previousRouteId = activeRouteId;
  const rendered = await Promise.resolve(renderCallback(id));
  if (rendered) {
    activeRouteId = id;
    resetViewportAfterModuleChange(previousRouteId, id);
  }
  return rendered;
}

export function currentRoute() {
  const id = getRouteFromHash() || requestedRouteId || activeRouteId;
  if (modules.get(id)) return id;
  return preferredStartRoute();
}

export function getRouteFromHash() {
  return window.location.hash
    .replace(/^#\/?/, '')
    .replace(/^\//, '')
    .trim();
}

function handleRouteChange() {
  const routeId = currentRoute();
  requestedRouteId = routeId;
  normalizeHashAndRender(routeId, { source: 'history' });
}

function normalizeHashAndRender(routeId, options = {}) {
  const normalizedHash = `${HASH_PREFIX}${routeId}`;

  if (window.location.hash !== normalizedHash) {
    replaceHash(routeId);
    return;
  }

  if (isMountedRoute(routeId) || isPendingRoute(routeId)) return Promise.resolve(true);

  const previousRouteId = activeRouteId;
  return Promise.resolve(renderCallback(routeId)).then(rendered => {
    if (rendered) {
      activeRouteId = routeId;
      resetViewportAfterModuleChange(previousRouteId, routeId);
    }
    return rendered;
  });
}

function replaceHash(routeId) {
  const path = `${window.location.pathname}${window.location.search}${HASH_PREFIX}${routeId}`;
  window.history.replaceState({ moduleId: routeId, version: navigationVersion }, '', path);
  requestedRouteId = routeId;
  if (isMountedRoute(routeId) || isPendingRoute(routeId)) return Promise.resolve(true);
  const previousRouteId = activeRouteId;
  return Promise.resolve(renderCallback(routeId)).then(rendered => {
    if (rendered) {
      activeRouteId = routeId;
      resetViewportAfterModuleChange(previousRouteId, routeId);
    }
    return rendered;
  });
}
