import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reportPath = join(root, 'platform-ux-infrastructure-audit-phase27c4.json');

execFileSync(process.execPath, ['scripts/audit-ux-infrastructure-phase27c4.mjs'], { cwd: root, stdio: 'inherit' });

assert.equal(existsSync(reportPath), true, '27C.4 UX infrastructure audit report must be generated');

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '27C.4');
assert.equal(report.name, 'UX Infrastructure Audit');
assert.ok(report.overallScore >= 3.8, `expected stable UX infrastructure score, got ${report.overallScore}`);
assert.equal(report.executiveSummary.p0.length, 0, '27C.4 must not report P0 blockers');
assert.ok(report.scores.focusNavigation >= 4.2, 'central focus navigation must remain stable');
assert.ok(report.scores.enterTabCommit >= 4.2, 'Enter/Tab commit infrastructure must remain stable');
assert.ok(report.scores.scrollStability >= 4.0, 'scroll stability must remain above release threshold');
assert.equal(report.evidence.coreEvidence.eventPipelineExists, true, 'central event pipeline must exist');
assert.equal(report.evidence.coreEvidence.scrollManagerExists, true, 'central scroll manager must exist');
assert.ok(Array.isArray(report.evidence.moduleEvidence), 'module UX evidence must be present');
assert.ok(Array.isArray(report.evidence.scrollStability.modulesUsingScrollManager));

console.log(`Phase 27C.4 UX infrastructure audit test passed: ${report.overallScore} (${report.overallGrade})`);
