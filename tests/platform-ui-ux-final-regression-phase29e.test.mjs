import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/audit-ui-ux-final-regression-phase29e.mjs'], { stdio: 'inherit' });
const report = JSON.parse(fs.readFileSync('platform-ui-ux-final-regression-phase29e.json', 'utf8'));

assert.equal(report.phase, '29E');
assert.equal(report.summary.modules, 11);
assert.equal(report.summary.axes, 10);
assert.equal(report.summary.plannedChecks, 110);
assert.equal(report.summary.originalFindings.p0, 0);
assert.equal(report.summary.originalFindings.p1, 9);
assert.equal(report.summary.originalFindings.p2, 22);
assert.equal(report.summary.closedFindings.p1, 9);
assert.equal(report.summary.closedFindings.p2, 22);
assert.equal(report.summary.p0Open, 0);
assert.equal(report.summary.p1Open, 0);
assert.equal(report.summary.p2Open, 0);
assert.equal(report.summary.failed, 0);
assert.ok(report.score >= 5);
assert.ok(report.regressionMatrix.every(check => check.pass));
assert.equal(report.nextPhase.id, '30A');

const focusManager = fs.readFileSync('js/core/focusManager.js', 'utf8');
const scrollManager = fs.readFileSync('js/core/scrollManager.js', 'utf8');
const moduleRuntime = fs.readFileSync('js/platform/moduleRuntime/index.js', 'utf8');

assert.match(focusManager, /handlePlatformFieldNavigation/);
assert.match(focusManager, /preserveFocusDuring/);
assert.match(scrollManager, /preserveSavedRecordMutation/);
assert.match(scrollManager, /preserveModuleSwitchScroll/);
assert.match(moduleRuntime, /preservePlatformUx/);

console.log('Phase 29E Final UI/UX Regression Test bestanden.');
