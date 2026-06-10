import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'platform-scroll-service-phase28a2.json');
assert.equal(existsSync(reportPath), true, '28A.2 report must exist');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '28A.2');
assert.ok(report.overallScore >= 4.5, 'Scroll Service score should be A-level');
assert.equal(report.acceptance.explicitServiceContract, true, 'PlatformScrollManager API contract must be complete');
assert.equal(report.acceptance.moduleScrollWritesEncapsulated, true, 'Module-level direct scroll writes must be encapsulated');
assert.equal(report.acceptance.savedRecordCompatibilityPreserved, true, 'Saved-record scroll preset must remain available');
assert.equal(report.acceptance.moduleSwitchStrategyAvailable, true, 'Module switch scroll strategy must exist');
assert.equal(report.executiveSummary.p0.length, 0, 'No P0 findings expected');
assert.equal(report.executiveSummary.p1.length, 0, 'No P1 findings expected after module encapsulation');

console.log('Phase 28A.2 Platform Scroll Service test passed.');
