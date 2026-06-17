import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const result = spawnSync(process.execPath, ['scripts/audit-browser-runtime-phase37b2.mjs'], {
  cwd: root,
  encoding: 'utf8'
});

assert.equal(result.status, 0, result.stderr || result.stdout);

const reportPath = path.join(root, 'docs/audits/json/browser-runtime-smoke-coverage-phase37b2.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '37B.2');
assert.equal(report.status, 'passed');
assert.equal(report.coverage.modules, 11);
assert.deepEqual(report.coverage.scenarios, [
  'module-route-mount',
  'saved-record-controls',
  'dynamic-renderer-field-commit',
  'enter-tab-navigation',
  'mobile-nav-swipe-guard',
  'settings-scroll-lock',
  'service-worker-offline-reload'
]);
assert.equal(report.checks.every(item => item.status === 'passed'), true);

const spec = read('tests/e2e/phase37b-runtime-smoke.spec.mjs');
assert.match(spec, /collectRuntimeErrors\(page\)/);
assert.match(spec, /isKnownExternalNoise\(message\)/);
assert.match(spec, /DYNAMIC_RENDERER_MODULE_IDS/);
assert.match(spec, /SAVED_RECORD_MODULE_IDS/);
assert.doesNotMatch(spec, /expect\(errors\)\.toEqual\(\[\]\);\s*\}\);\s*\n\s*test\('boots shell/s, 'runtime error assertion must stay inside each smoke scenario, not only the first one');

console.log('phase37b2 browser runtime smoke expansion guard ok');
