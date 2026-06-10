import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reportPath = join(root, 'platform-performance-audit-phase27c5.json');

execFileSync(process.execPath, ['scripts/audit-performance-phase27c5.mjs'], { cwd: root, stdio: 'inherit' });

assert.equal(existsSync(reportPath), true, '27C.5 performance audit report must be generated');

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '27C.5');
assert.equal(report.name, 'Performance Audit');
assert.ok(report.overallScore >= 3.8, `expected stable performance audit score, got ${report.overallScore}`);
assert.equal(report.executiveSummary.p0.length, 0, '27C.5 must not report P0 blockers');
assert.ok(report.scores.initialRender >= 4.0, 'initial render baseline must remain above threshold');
assert.ok(report.scores.rerenderDiscipline >= 4.0, 'rerender discipline must remain above threshold');
assert.ok(report.scores.moduleSwitch >= 4.0, 'module switch baseline must remain above threshold');
assert.ok(report.scores.heavyRendererIsolation >= 4.0, 'heavy renderer isolation must remain above threshold');
assert.equal(report.evidence.coreEvidence.moduleRuntimeExists, true, 'module runtime must exist');
assert.equal(report.evidence.coreEvidence.registryExists, true, 'module registry must exist');
assert.ok(Array.isArray(report.evidence.moduleEvidence), 'module performance evidence must be present');
assert.ok(report.evidence.moduleEvidence.length >= 10, 'all platform modules must be audited');

console.log(`Phase 27C.5 performance audit test passed: ${report.overallScore} (${report.overallGrade})`);
