import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'platform-focus-service-phase28b1.json');
assert.equal(existsSync(reportPath), true, '28B.1 report must exist');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '28B.1');
assert.ok(report.overallScore >= 4.5, 'Focus Service score should be A-level');
assert.equal(report.acceptance.explicitServiceContract, true, 'PlatformFocusManager API contract must be complete');
assert.equal(report.acceptance.coreRestoreFocusEncapsulated, true, 'Core restore focus paths must use FocusManager');
assert.equal(report.acceptance.enterFieldFocusDelegatesToService, true, 'Enter next-field focus must delegate to FocusManager');
assert.equal(report.acceptance.moduleDirectFocusCallsEncapsulated, true, 'Module-level direct focus calls must be absent');
assert.equal(report.acceptance.enterTabImplementationDeferred, true, '28B.1 must not overtake 28B.2/28B.3 semantics');
assert.equal(report.executiveSummary.p0.length, 0, 'No P0 findings expected');

console.log('Phase 28B.1 Platform Focus Service test passed.');
