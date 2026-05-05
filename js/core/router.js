import { modules } from './registry.js';

const DEFAULT_ROUTE = 'heating-cooling';
const HASH_PREFIX = '#/';
let renderCallback = () => {};

export function initRouter(onRoute) {
  renderCallback = typeof onRoute === 'function' ? onRoute : () => {};
  window.addEventListener('hashchange', handleRouteChange);

  if (!window.location.hash) {
    replaceHash(DEFAULT_ROUTE);
    return;
  }

  handleRouteChange();
}

export function navigate(id) {
  if (!modules.get(id)) return;
  window.location.hash = `/${id}`;
}

export function currentRoute() {
  const id = getRouteFromHash();
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
  const normalizedHash = `${HASH_PREFIX}${routeId}`;

  if (window.location.hash !== normalizedHash) {
    replaceHash(routeId);
    return;
  }

  renderCallback(routeId);
}

function replaceHash(routeId) {
  const path = `${window.location.pathname}${window.location.search}${HASH_PREFIX}${routeId}`;
  window.history.replaceState(null, '', path);
  renderCallback(routeId);
}
