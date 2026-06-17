import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/audit-ui-ux-bugfix-batch2-phase29d.mjs'], { stdio: 'inherit' });
const report = JSON.parse(fs.readFileSync('platform-ui-ux-bugfix-batch2-phase29d.json', 'utf8'));

assert.equal(report.phase, '29D');
assert.equal(report.summary.p0, 0);
assert.equal(report.summary.p1Open, 0);
assert.equal(report.summary.p2Reviewed, 22);
assert.equal(report.summary.p2Open, 0);
assert.equal(report.summary.p2Closed, report.summary.p2Reviewed);
assert.ok(report.score >= 5);
assert.ok(report.checks.every(check => check.pass));
assert.equal(report.nextPhase.id, '29E');

const focusManager = fs.readFileSync('js/core/focusManager.js', 'utf8');
const scrollManager = fs.readFileSync('js/core/scrollManager.js', 'utf8');
const moduleRuntime = fs.readFileSync('js/platform/moduleRuntime/index.js', 'utf8');

assert.match(focusManager, /handlePlatformFieldNavigation/);
assert.match(focusManager, /preserveFocusDuring/);
assert.match(scrollManager, /preserveSavedRecordMutation/);
assert.match(scrollManager, /preserveModuleSwitchScroll/);
assert.match(moduleRuntime, /preservePlatformUx/);

console.log('Phase 29D UI/UX Bugfix Batch 2 Test bestanden.');
