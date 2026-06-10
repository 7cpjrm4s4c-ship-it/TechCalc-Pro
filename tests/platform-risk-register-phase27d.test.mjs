import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reportPath = join(root, 'platform-risk-register-phase27d.json');

execFileSync(process.execPath, ['scripts/audit-platform-risk-register-phase27d.mjs'], { cwd: root, stdio: 'inherit' });

assert.equal(existsSync(reportPath), true, '27D risk register report must be generated');

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '27D');
assert.equal(report.name, 'Platform Risk Register');
assert.ok(report.overallScore >= 4.0, `expected stable platform audit score, got ${report.overallScore}`);
assert.equal(report.riskCounts.P0, 0, '27D must not report P0 release blockers');
assert.ok(report.riskCounts.P1 >= 1, '27D must consolidate P1 hardening risks');
assert.ok(Array.isArray(report.risks), 'risks must be present');
assert.ok(report.risks.length >= 6, '27D must consolidate the 27C risk landscape');
assert.ok(Array.isArray(report.remediationBacklog), 'remediation backlog must be present');
assert.ok(report.remediationBacklog[0].risk === 'P1' || report.remediationBacklog[0].risk === 'P0', 'backlog must be priority sorted');
assert.equal(report.releaseReadiness, 'release-candidate-with-hardening-backlog');

const p1Areas = report.executiveSummary.p1.map(item => item.area);
assert.ok(p1Areas.includes('dependencyGraph'), 'dependency graph must remain a tracked P1 risk');
assert.ok(p1Areas.includes('eventSystem'), 'event system must remain a tracked P1 risk');
assert.ok(p1Areas.includes('savedRecordStateModel'), 'saved record state model must remain a tracked P1 risk');
assert.ok(p1Areas.includes('scrollStability'), 'scroll stability must remain a tracked P1 risk');

console.log(`Phase 27D risk register test passed: ${report.overallScore} (${report.overallGrade})`);
