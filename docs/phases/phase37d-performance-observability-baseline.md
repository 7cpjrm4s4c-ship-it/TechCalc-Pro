# Phase 37D – Performance Observability Baseline

## Ziel

Phase 37D führt eine erste Browser-seitige Performance-Baseline ein, ohne Fachlogik, Rendering-Ergebnisse oder UX-Flows zu verändern.

## Ergänzt

- `js/platform/shell/performanceController.js`
- `scripts/audit-performance-observability-phase37d.mjs`
- `tests/platform-performance-observability-phase37d.test.mjs`
- `docs/audits/json/performance-observability-phase37d.json`

## Messpunkte

- `app:init`
- `module:lazy-load`
- `module:switch`
- `module:mount`
- `dynamic-render`
- `render:commit`
- `saved-record:interaction`
- `service-worker:register`
- `service-worker:cache-updated`

## Runtime-Verhalten

Die Messung nutzt `performance.mark()` / `performance.measure()` wenn verfügbar und hält zusätzlich einen kleinen In-Memory-Ringbuffer unter `window.__tcPerformance` bereit.

Es gibt keine automatische Telemetrie, keinen Netzwerkversand und keine Änderung an Berechnungs- oder Modulverhalten.

## Validierung

- `npm run build`
- `npm run test:phase37d`
- `npm run test:phase37c7`
- `npm run test:phase37c6`
- `npm run test:module-smoke`
