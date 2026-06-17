import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reportPath = join(root, 'platform-state-storage-audit-phase27c2.json');

execFileSync(process.execPath, ['scripts/audit-state-storage-phase27c2.mjs'], { cwd: root, stdio: 'inherit' });

assert.equal(existsSync(reportPath), true, '27C.2 state/storage audit report must be generated');

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '27C.2');
assert.equal(report.name, 'State and Storage Audit');
assert.ok(report.overallScore >= 3.8, `expected stable state/storage score, got ${report.overallScore}`);
assert.equal(report.executiveSummary.p0.length, 0, '27C.2 must not report P0 blockers');
assert.ok(Array.isArray(report.evidence.storageBoundary.directStorageFiles));
assert.ok(Array.isArray(report.evidence.savedRecordStateModel.modules));
assert.equal(report.evidence.moduleStorageIsolation.modulesWithDirectStorage.length, 0, 'modules must not access browser storage directly');
assert.ok(report.scores.moduleStorageIsolation >= 4.5, 'module storage isolation should be platform-conform');

console.log(`Phase 27C.2 state/storage audit test passed: ${report.overallScore} (${report.overallGrade})`);
