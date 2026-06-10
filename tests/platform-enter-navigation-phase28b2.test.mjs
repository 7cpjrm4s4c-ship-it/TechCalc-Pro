import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'platform-enter-navigation-phase28b2.json');
assert.equal(existsSync(reportPath), true, '28B.2 report must exist');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '28B.2');
assert.ok(report.overallScore >= 4.5, 'Enter navigation score should be A-level');
assert.equal(report.acceptance.enterNavigationApiExists, true, 'Enter navigation API must exist in PlatformFocusManager');
assert.equal(report.acceptance.platformObjectExportsEnterApi, true, 'PlatformFocusManager object must export Enter APIs');
assert.equal(report.acceptance.centralPipelineDelegatesEnterNavigation, true, 'Central event pipeline must delegate Enter navigation to FocusManager');
assert.equal(report.acceptance.enterCommitPreserved, true, 'Enter must keep field commit semantics');
assert.equal(report.acceptance.fallbackBindingDelegatesEnterNavigation, true, 'Legacy state binding fallback must delegate Enter navigation');
assert.equal(report.acceptance.shiftEnterPreviousSupported, true, 'Shift+Enter should navigate to the previous platform field');
assert.equal(report.acceptance.preventScrollFocusPreserved, true, 'Enter focus movement must keep preventScroll protection');
assert.equal(report.executiveSummary.p0.length, 0, 'No P0 findings expected');
assert.equal(report.executiveSummary.p1.length, 0, 'No P1 findings expected');

console.log('Phase 28B.2 Platform Enter Navigation test passed.');
