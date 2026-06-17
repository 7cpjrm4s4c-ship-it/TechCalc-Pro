import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reportPath = join(root, 'platform-scroll-audit-phase28a1.json');

execFileSync(process.execPath, ['scripts/audit-scroll-infrastructure-phase28a1.mjs'], { cwd: root, stdio: 'inherit' });

assert.equal(existsSync(reportPath), true, '28A.1 scroll audit report must be generated');

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '28A.1');
assert.equal(report.name, 'Scroll Audit & Scroll Manager Design');
assert.ok(report.overallScore >= 3.8, `expected release-grade scroll audit score, got ${report.overallScore}`);
assert.equal(report.executiveSummary.p0.length, 0, '28A.1 must not report P0 blockers');
assert.equal(report.coreEvidence.scrollManagerExists, true, 'central scroll manager must exist before 28A.2');
assert.equal(report.coreEvidence.scrollManagerExportsPreserveScroll, true, 'scroll manager must expose preserveScroll');
assert.equal(report.coreEvidence.scrollManagerExportsSavedRecordPreset, true, 'scroll manager must expose saved-record preset');
assert.ok(Array.isArray(report.moduleEvidence), 'module scroll evidence must be present');
assert.ok(Array.isArray(report.fileEvidence), 'file-level scroll evidence must be present');
assert.ok(report.designContract.phase28A2Api.includes('freeze(reason)'), '28A.2 design contract must include freeze API');
assert.ok(report.designContract.phase28A2Api.includes('restorePosition(snapshot, options)'), '28A.2 design contract must include restore API');

console.log(`Phase 28A.1 scroll audit test passed: ${report.overallScore} (${report.overallGrade})`);
