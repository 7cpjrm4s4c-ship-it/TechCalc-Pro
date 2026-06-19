import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'docs/audits/json/app-shell-decomposition-phase37c1.json');
const appPath = path.join(root, 'js/core/app.js');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const appSource = fs.readFileSync(appPath, 'utf8');

assert.equal(report.phase, '37C.1');
assert.equal(report.policy.runtimeCodeChanged, false);
assert.ok(report.totals.appJsLineCount >= 580, '37C.1 decomposition map must remain valid after initial shell extraction.');
assert.ok(report.responsibilities.length >= 10, 'app.js responsibility map must identify the shell boundaries.');
assert.ok(report.extractionOrder.length >= 5, '37C.1 must define an incremental extraction sequence.');
assert.ok(report.findings.some(item => item.severity === 'P1'), '37C.1 must retain P1 tracking for monolith risk.');

const ids = new Set(report.responsibilities.map(item => item.id));
for (const required of [
  'module-manifest-lazy-loader',
  'global-navigation-gesture-controller',
  'settings-panel-controller',
  'service-worker-controller',
  'release-notes-controller'
]) {
  assert.ok(ids.has(required), `Missing responsibility mapping for ${required}.`);
}

const highRisk = report.responsibilities.find(item => item.id === 'settings-panel-controller');
assert.equal(highRisk.risk, 'high', 'settings panel must remain the explicitly highest-risk extraction.');
assert.match(appSource, /const lazyModules = \[/, '37C.1 must still cover module bootstrap responsibilities.');
assert.match(appSource, /function setSettingsOpen\(/, '37C.1 must not move settings runtime code yet.');
assert.match(appSource, /navigator\.serviceWorker\.register/, '37C.1 must not move service worker runtime code yet.');

console.log('Phase 37C.1 app-shell decomposition map verified.');
