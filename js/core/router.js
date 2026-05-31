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
  const targetHash = `${HASH_PREFIX}${id}`;
  if (window.location.hash === targetHash) {
    renderCallback(id);
    return;
  }
  window.location.hash = `/${id}`;
  // Navigation must not depend on hashchange timing. Highly interactive modules
  // such as Heizung/Kälte and Lüftung can leave pointer/touch reconciliation work
  // pending; rendering the route immediately keeps Wechsel zu Regenwasser and the
  // other platform modules deterministic. The render callback is token guarded and
  // therefore safe when the subsequent hashchange fires as well.
  renderCallback(id);
  window.setTimeout(() => {
    if (currentRoute() === id) renderCallback(id);
  }, 0);
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
