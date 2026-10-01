import { modules } from '../runtime/registry.js';
import { loadPreferences } from '../ux/preferences.js';

const FALLBACK_ROUTE = 'heating-cooling';
const HASH_PREFIX = '#/';
let renderCallback = () => Promise.resolve(false);
let activeRouteId = '';
let requestedRouteId = '';
let navigationVersion = 0;

function appRoot() {
  return typeof document !== 'undefined' ? document.getElementById('app') : null;
}
export function preferredStartRoute() {
  const prefs = loadPreferences();
  const preferred = prefs.moduleOrder.length ? prefs.moduleOrder : prefs.mobileQuickAccess;
  return preferred.find(id => modules.get(id))
    || (modules.get(FALLBACK_ROUTE) ? FALLBACK_ROUTE : modules.all()[0]?.id);
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

  // A fresh app start and a browser reload always use the first valid module
  // from the persisted module settings. A historical hash is normalized to
  // that preference; hash navigation remains available after boot.
  const initialRoute = preferredStartRoute();
  activeRouteId = '';
  requestedRouteId = initialRoute;
  replaceHash(initialRoute);
}

export async function navigate(id, options = {}) {
  if (!modules.get(id)) return false;

  const targetHash = `${HASH_PREFIX}${id}`;
  const currentHash = window.location.hash || '';
  const mounted = isMountedRoute(id);
  const pending = isPendingRoute(id);

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

  if (currentHash !== targetHash) {
    const path = `${window.location.pathname}${window.location.search}${targetHash}`;
    window.history.pushState({ moduleId: id, version: navigationVersion }, '', path);
  } else if (options.force) {
    window.history.replaceState({ moduleId: id, version: navigationVersion }, '', `${window.location.pathname}${window.location.search}${targetHash}`);
  }

  const rendered = await Promise.resolve(renderCallback(id));
  if (rendered) {
    activeRouteId = id;
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

  return Promise.resolve(renderCallback(routeId)).then(rendered => {
    if (rendered) {
      activeRouteId = routeId;
    }
    return rendered;
  });
}

function replaceHash(routeId) {
  const path = `${window.location.pathname}${window.location.search}${HASH_PREFIX}${routeId}`;
  window.history.replaceState({ moduleId: routeId, version: navigationVersion }, '', path);
  requestedRouteId = routeId;
  if (isMountedRoute(routeId) || isPendingRoute(routeId)) return Promise.resolve(true);
  return Promise.resolve(renderCallback(routeId)).then(rendered => {
    if (rendered) {
      activeRouteId = routeId;
    }
    return rendered;
  });
}
