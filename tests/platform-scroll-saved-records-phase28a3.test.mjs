import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'platform-scroll-saved-records-phase28a3.json');
assert.equal(existsSync(reportPath), true, '28A.3 report must exist');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '28A.3');
assert.ok(report.overallScore >= 4.5, 'Saved-record scroll integration score should be A-level');
assert.equal(report.acceptance.savedRecordMutationContractAvailable, true, 'Saved-record mutation contract must be exported by PlatformScrollManager');
assert.equal(report.acceptance.savedRecordListUsesPlatformScrollManager, true, 'Saved-record list must use PlatformScrollManager instead of renderer preserveViewport');
assert.equal(report.acceptance.savedRecordToggleProtected, true, 'Saved-record expand/collapse must be scroll-protected');
assert.equal(report.acceptance.savedRecordLoadProtected, true, 'Saved-record load must be scroll-protected');
assert.equal(report.acceptance.savedRecordClearProtected, true, 'Saved-record clear/abwahl must be scroll-protected');
assert.equal(report.executiveSummary.p0.length, 0, 'No P0 findings expected');
assert.equal(report.executiveSummary.p1.length, 0, 'No P1 findings expected');

console.log('Phase 28A.3 Saved Records Scroll Integration test passed.');
