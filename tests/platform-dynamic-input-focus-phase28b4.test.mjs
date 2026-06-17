import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'platform-dynamic-input-focus-phase28b4.json');
assert.equal(existsSync(reportPath), true, '28B.4 report must exist');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '28B.4');
assert.ok(report.overallScore >= 4.5, 'Dynamic input focus score should be A-level');
assert.equal(report.acceptance.activeFieldSnapshotApiExists, true, 'FocusManager must expose active field snapshot API');
assert.equal(report.acceptance.stableKeyAndIndexFallbackExists, true, 'Focus restore needs stable key and index fallback');
assert.equal(report.acceptance.caretRestoreExists, true, 'Text input caret restoration must exist');
assert.equal(report.acceptance.preventScrollPreserved, true, 'Dynamic focus restore must preserve preventScroll');
assert.equal(report.acceptance.platformObjectExportsDynamicApi, true, 'PlatformFocusManager object must export dynamic focus APIs');
assert.equal(report.acceptance.hxDynamicRenderPreservesFocus, true, 'h,x dynamic render islands must preserve focus');
assert.equal(report.acceptance.heatRecoveryDynamicRenderPreservesFocus, true, 'WRG dynamic render islands must preserve focus');
assert.equal(report.acceptance.drinkingWaterDynamicRenderPreservesFocus, true, 'Trinkwasser dynamic render islands must preserve focus');
assert.equal(report.acceptance.selectReopenGuardPreserved, true, 'Select reopen guard must remain active');
assert.equal(report.executiveSummary.p0.length, 0, 'No P0 findings expected');
assert.equal(report.executiveSummary.p1.length, 0, 'No P1 findings expected');

console.log('Phase 28B.4 Dynamic Input Focus Hardening test passed.');
