import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = {
  app: readFileSync('js/core/app.js', 'utf8'),
  runtime: readFileSync('js/platform/moduleRuntime/index.js', 'utf8'),
  renderCoordinator: readFileSync('js/core/renderCoordinator.js', 'utf8'),
  serviceWorkerController: readFileSync('js/platform/shell/serviceWorkerController.js', 'utf8'),
  performanceController: readFileSync('js/platform/shell/performanceController.js', 'utf8'),
  serviceWorker: readFileSync('service-worker.js', 'utf8')
};

assert.match(files.performanceController, /export function initializePerformanceController/);
assert.match(files.performanceController, /export function markPerformance/);
assert.match(files.performanceController, /export function measurePerformance/);
assert.match(files.performanceController, /export function startPerformanceSpan/);
assert.match(files.performanceController, /__tcPerformance/);

assert.match(files.app, /initializePerformanceController/);
assert.match(files.app, /app:init:start/);
assert.match(files.app, /app:init:end/);
assert.match(files.app, /measurePerformance\('app:init'/);
assert.match(files.app, /startPerformanceSpan\('module:switch'/);
assert.match(files.app, /startPerformanceSpan\('module:lazy-load'/);

assert.match(files.runtime, /startPerformanceSpan\('module:mount'/);
assert.match(files.runtime, /startPerformanceSpan\('dynamic-render'/);
assert.match(files.runtime, /startPerformanceSpan\('saved-record:interaction'/);
assert.match(files.renderCoordinator, /startPerformanceSpan\('render:commit'/);

assert.match(files.serviceWorkerController, /service-worker:register/);
assert.match(files.serviceWorkerController, /service-worker:cache-updated/);
assert.match(files.serviceWorker, /performanceController\.js/);

console.log('Phase 37D performance observability baseline verified.');
