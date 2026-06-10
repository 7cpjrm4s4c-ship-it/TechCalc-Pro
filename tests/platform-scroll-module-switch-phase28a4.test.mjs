import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reportPath = join(root, 'platform-scroll-module-switch-phase28a4.json');
assert.equal(existsSync(reportPath), true, '28A.4 report must exist');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '28A.4');
assert.ok(report.overallScore >= 4.5, 'Module-switch scroll integration score should be A-level');
assert.equal(report.acceptance.moduleSwitchContractAvailable, true, 'Module-switch scroll contract must be exported by PlatformScrollManager');
assert.equal(report.acceptance.asyncModuleMountSupported, true, 'Scroll preservation must support async module mounts');
assert.equal(report.acceptance.moduleRuntimeUsesPlatformScrollManager, true, 'ModuleRuntime mount must be wrapped by PlatformScrollManager');
assert.equal(report.acceptance.moduleSwitchReasonTagged, true, 'Module-switch preservation must be explicitly tagged');
assert.equal(report.acceptance.navigationPathRemainsCentralized, true, 'Navigation must remain centralized through router/navigate');
assert.equal(report.executiveSummary.p0.length, 0, 'No P0 findings expected');
assert.equal(report.executiveSummary.p1.length, 0, 'No P1 findings expected');

console.log('Phase 28A.4 Module Switch Scroll Integration test passed.');
