import { modules } from './registry.js';

const DEFAULT_ROUTE = 'heating-cooling';
const HASH_PREFIX = '#/';
let renderCallback = () => {};
let activeRouteId = '';
let navigationVersion = 0;

export function initRouter(onRoute) {
  renderCallback = typeof onRoute === 'function' ? onRoute : () => {};
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

export function navigate(id) {
  if (!modules.get(id)) return;
  const targetHash = `${HASH_PREFIX}${id}`;
  const currentHash = window.location.hash || '';
  navigationVersion += 1;
  activeRouteId = id;

  // Use history.pushState for app-internal navigation. Changing location.hash can
  // enqueue an additional hashchange event on mobile browsers. During a module
  // switch from the fully pipeline-driven reference modules this produced a race:
  // navigation was highlighted, but the content render could be cancelled by a
  // later duplicate render token. pushState gives us exactly one synchronous
  // render path for touch, mouse and programmatic navigation.
  if (currentHash !== targetHash) {
    const path = `${window.location.pathname}${window.location.search}${targetHash}`;
    window.history.pushState({ moduleId: id, version: navigationVersion }, '', path);
  }

  renderCallback(id);
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

  renderCallback(routeId);
}

function replaceHash(routeId) {
  const path = `${window.location.pathname}${window.location.search}${HASH_PREFIX}${routeId}`;
  window.history.replaceState({ moduleId: routeId, version: navigationVersion }, '', path);
  activeRouteId = routeId;
  renderCallback(routeId);
}
