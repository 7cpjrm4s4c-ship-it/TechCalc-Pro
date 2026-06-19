import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const result = spawnSync(process.execPath, ['scripts/audit-service-worker-offline-phase37b3.mjs'], {
  cwd: root,
  encoding: 'utf8'
});

assert.equal(result.status, 0, result.stderr || result.stdout);

const report = JSON.parse(read('docs/audits/json/service-worker-offline-phase37b3.json'));
assert.equal(report.phase, '37B.3');
assert.equal(report.status, 'passed');
assert.equal(report.assets.missing, 0);
assert.equal(report.assets.stale, 0);
assert.ok(report.assets.jsModules >= 150, 'expected full JS module runtime surface in service-worker precache');
assert.equal(report.checks.every(item => item.status === 'passed'), true);

const serviceWorker = read('service-worker.js');
assert.match(serviceWorker, /'\.\/js\/core\/centralStore\.js'/);
assert.match(serviceWorker, /'\.\/js\/core\/eventPipeline\.js'/);
assert.match(serviceWorker, /'\.\/js\/platform\/dynamicRenderer\/index\.js'/);
assert.match(serviceWorker, /'\.\/js\/modules\/drinking-water\/controller\.js'/);
assert.match(serviceWorker, /'\.\/js\/modules\/rainwater\/controller\.js'/);
assert.match(serviceWorker, /'\.\/js\/modules\/hx-diagram\/diagramRenderer\.js'/);

const e2eSpec = read('tests/e2e/phase37b-runtime-smoke.spec.mjs');
assert.match(e2eSpec, /offline reload keeps every module route available/);
assert.match(e2eSpec, /await context\.setOffline\(true\)/);
assert.match(e2eSpec, /await context\.setOffline\(false\)/);

console.log('phase37b3 service worker offline guard ok');
