import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'platform-tab-navigation-phase28b3.json');
assert.equal(existsSync(reportPath), true, '28B.3 report must exist');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '28B.3');
assert.ok(report.overallScore >= 4.5, 'Tab navigation score should be A-level');
assert.equal(report.acceptance.tabNavigationApiExists, true, 'Tab navigation API must exist in PlatformFocusManager');
assert.equal(report.acceptance.unifiedFieldNavigationExists, true, 'Unified field navigation API must exist');
assert.equal(report.acceptance.platformObjectExportsTabApi, true, 'PlatformFocusManager object must export Tab APIs');
assert.equal(report.acceptance.centralPipelineDelegatesTabNavigation, true, 'Central event pipeline must delegate Tab navigation to FocusManager');
assert.equal(report.acceptance.tabCommitPreserved, true, 'Tab must keep field commit semantics');
assert.equal(report.acceptance.fallbackBindingDelegatesTabNavigation, true, 'Legacy state binding fallback must delegate Tab navigation');
assert.equal(report.acceptance.shiftTabPreviousSupported, true, 'Shift+Tab should navigate to the previous platform field');
assert.equal(report.acceptance.preventScrollFocusPreserved, true, 'Tab focus movement must keep preventScroll protection');
assert.equal(report.executiveSummary.p0.length, 0, 'No P0 findings expected');
assert.equal(report.executiveSummary.p1.length, 0, 'No P1 findings expected');

console.log('Phase 28B.3 Platform Tab Navigation test passed.');
