export const appCoreAreas = Object.freeze({
  contracts: Object.freeze({
    path: 'js/core/contracts',
    responsibility: 'Module contracts, layout contracts and platform policies'
  }),
  data: Object.freeze({
    path: 'js/core/data',
    responsibility: 'Central shared datasets, catalog access and lookup services'
  }),
  events: Object.freeze({
    path: 'js/core/events',
    responsibility: 'Event delegation, event management and event pipeline coordination'
  }),
  pdf: Object.freeze({
    path: 'js/core/pdf',
    responsibility: 'Central PDF export, typed DTO mapping and report rendering'
  }),
  runtime: Object.freeze({
    path: 'js/core/runtime',
    responsibility: 'Module runtime, mounting, routing, navigation and lifecycle integration'
  }),
  state: Object.freeze({
    path: 'js/core/state',
    responsibility: 'Central state, state binding and project module state adapters'
  }),
  storage: Object.freeze({
    path: 'js/core/storage',
    responsibility: 'Project storage, saved records and unsaved work handling'
  }),
  styles: Object.freeze({
    path: 'js/core/styles',
    responsibility: 'Canonical stylesheet manifest for app-wide CSS concerns'
  }),
  ui: Object.freeze({
    path: 'js/core/ui',
    responsibility: 'UI system, schema rendering, result rendering and DOM rendering helpers'
  }),
  ux: Object.freeze({
    path: 'js/core/ux',
    responsibility: 'Focus, scroll, preferences and UI interaction policies'
  })
});

export function listAppCoreAreas() {
  return Object.freeze(Object.entries(appCoreAreas).map(([id, area]) => Object.freeze({ id, ...area })));
}
