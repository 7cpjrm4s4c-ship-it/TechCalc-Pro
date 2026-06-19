import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const specPath = 'tests/e2e/phase37b-runtime-smoke.spec.mjs';
const spec = read(specPath);
const packageJson = JSON.parse(read('package.json'));

const moduleIds = [
  'heating-cooling',
  'ventilation',
  'pressure-holding',
  'buffer-storage',
  'heat-recovery',
  'hx-diagram',
  'pipe-sizing',
  'unit-converter',
  'drinking-water',
  'wastewater',
  'rainwater'
];

const checks = [];
function check(id, passed, detail) {
  checks.push({ id, status: passed ? 'passed' : 'failed', detail });
}

for (const moduleId of moduleIds) {
  check(`route:${moduleId}`, spec.includes(`'${moduleId}'`), `E2E route smoke includes ${moduleId}`);
}

check('console-filter:external-only', /function isKnownExternalNoise\(message\)/.test(spec) && /cdn\\\.segment\\\.com/.test(spec), 'known non-app browser noise is explicitly filtered');
check('console-guard:pageerror', /page\.on\('pageerror'/.test(spec), 'uncaught page errors are collected');
check('console-guard:error-console', /message\.type\(\) === 'error'/.test(spec), 'console errors are collected');
check('saved-record-smoke', /SAVED_RECORD_MODULE_IDS/.test(spec) && /Speichern/i.test(spec), 'saved-record capable modules are covered');
check('dynamic-renderer-smoke', /DYNAMIC_RENDERER_MODULE_IDS/.test(spec) && /commitFirstEditableField/.test(spec), 'dynamic renderer field commit smoke is covered');
check('keyboard-navigation-smoke', /Enter/.test(spec) && /Tab/.test(spec) && /hx-diagram/.test(spec), 'Enter/Tab navigation smoke is covered');
check('mobile-nav-smoke', /mobile nav swipe/.test(spec) && /setViewportSize/.test(spec), 'mobile nav gesture smoke is covered');
check('scroll-lock-smoke', /settings panel locks and restores scroll/.test(spec), 'settings scroll lock smoke is covered');
check('offline-sw-smoke', /service worker registers/.test(spec) && /setOffline\(true\)/.test(spec), 'service worker offline reload smoke is covered');
check('package-script:phase37b2', packageJson.scripts?.['test:phase37b2'] === 'node tests/platform-browser-runtime-phase37b2.test.mjs', 'package exposes phase37b2 guard');
check('package-script:e2e-phase37b2', packageJson.scripts?.['test:e2e:phase37b2'] === 'playwright test tests/e2e/phase37b-runtime-smoke.spec.mjs', 'package exposes phase37b2 Playwright command');

const report = {
  phase: '37B.2',
  name: 'Browser Runtime Smoke Coverage Expansion',
  status: checks.every(item => item.status === 'passed') ? 'passed' : 'failed',
  generatedAt: new Date().toISOString(),
  coverage: {
    modules: moduleIds.length,
    scenarios: [
      'module-route-mount',
      'saved-record-controls',
      'dynamic-renderer-field-commit',
      'enter-tab-navigation',
      'mobile-nav-swipe-guard',
      'settings-scroll-lock',
      'service-worker-offline-reload'
    ]
  },
  checks
};

fs.mkdirSync(path.join(root, 'docs/audits/json'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/audits/json/browser-runtime-smoke-coverage-phase37b2.json'), `${JSON.stringify(report, null, 2)}\n`);

if (report.status !== 'passed') {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('phase37b2 browser runtime smoke coverage audit ok');
