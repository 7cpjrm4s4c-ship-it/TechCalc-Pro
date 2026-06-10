import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/audit-ui-ux-bugfix-batch1-phase29c.mjs'], { stdio: 'inherit' });
const report = JSON.parse(fs.readFileSync('platform-ui-ux-bugfix-batch1-phase29c.json', 'utf8'));

assert.equal(report.phase, '29C');
assert.equal(report.summary.p0, 0);
assert.equal(report.summary.p1Open, 0);
assert.ok(report.score >= 5);
assert.ok(report.checks.every(check => check.pass));

const runtime = fs.readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
const lineController = fs.readFileSync('js/platform/lineSectionController/index.js', 'utf8');
assert.match(runtime, /preservePlatformUx/);
assert.match(runtime, /preserveSavedRecordMutation/);
assert.match(lineController, /preserveSavedRecordMutation/);
assert.match(lineController, /PlatformFocusManager/);
