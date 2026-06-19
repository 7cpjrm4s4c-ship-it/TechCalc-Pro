import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const targets = [
  ['app:init', 'js/core/app.js'],
  ['module:switch', 'js/core/app.js'],
  ['module:lazy-load', 'js/core/app.js'],
  ['module:mount', 'js/platform/moduleRuntime/index.js'],
  ['dynamic-render', 'js/platform/moduleRuntime/index.js'],
  ['saved-record:interaction', 'js/platform/moduleRuntime/index.js'],
  ['render:commit', 'js/core/renderCoordinator.js'],
  ['service-worker:register', 'js/platform/shell/serviceWorkerController.js'],
  ['service-worker:cache-updated', 'js/platform/shell/serviceWorkerController.js']
];

const findings = targets.map(([mark, file]) => {
  const source = readFileSync(file, 'utf8');
  return { mark, file, present: source.includes(mark) };
});
const missing = findings.filter(item => !item.present);
const report = {
  phase: '37D',
  title: 'Performance Observability Baseline',
  status: missing.length ? 'fail' : 'pass',
  checkedAt: new Date().toISOString(),
  findings
};
mkdirSync('docs/audits/json', { recursive: true });
writeFileSync('docs/audits/json/performance-observability-phase37d.json', JSON.stringify(report, null, 2));
if (missing.length) {
  console.error('Missing performance marks:', missing);
  process.exit(1);
}
console.log('Phase 37D performance observability audit passed.');
