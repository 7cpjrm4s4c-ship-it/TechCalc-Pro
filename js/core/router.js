import { modules } from './registry.js';

const DEFAULT_ROUTE = 'heating-cooling';
const HASH_PREFIX = '#/';
let renderCallback = () => Promise.resolve(false);
let activeRouteId = '';
let navigationVersion = 0;

export function initRouter(onRoute) {
  renderCallback = typeof onRoute === 'function' ? onRoute : () => Promise.resolve(false);
  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('popstate', handleRouteChange);

  const initialRoute = currentRoute();
  activeRouteId = initialRoute;

  if (!window.location.hash) {
    replaceHash(initialRoute);
    return;
  }

  normalizeHashAndRender(initialRoute);
}

export async function navigate(id, options = {}) {
  if (!modules.get(id)) return false;
  const targetHash = `${HASH_PREFIX}${id}`;
  const currentHash = window.location.hash || '';
  navigationVersion += 1;
  activeRouteId = id;

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

  return Promise.resolve(renderCallback(id));
}

export function currentRoute() {
  const id = getRouteFromHash() || activeRouteId;
  if (modules.get(id)) return id;
  return modules.get(DEFAULT_ROUTE) ? DEFAULT_ROUTE : modules.all()[0]?.id;
}

export function getRouteFromHash() {
  return window.location.hash
    .replace(/^#\/?/, '')
    .replace(/^\//, '')
    .trim();
}

function handleRouteChange() {
  const routeId = currentRoute();
  activeRouteId = routeId;
  normalizeHashAndRender(routeId);
}

function normalizeHashAndRender(routeId) {
  const normalizedHash = `${HASH_PREFIX}${routeId}`;

  if (window.location.hash !== normalizedHash) {
    replaceHash(routeId);
    return;
  }

  Promise.resolve(renderCallback(routeId));
}

function replaceHash(routeId) {
  const path = `${window.location.pathname}${window.location.search}${HASH_PREFIX}${routeId}`;
  window.history.replaceState({ moduleId: routeId, version: navigationVersion }, '', path);
  activeRouteId = routeId;
  Promise.resolve(renderCallback(routeId));
}
