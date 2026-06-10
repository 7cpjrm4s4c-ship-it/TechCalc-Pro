import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reportPath = join(root, 'platform-rendering-audit-phase27c3.json');

execFileSync(process.execPath, ['scripts/audit-rendering-phase27c3.mjs'], { cwd: root, stdio: 'inherit' });

assert.equal(existsSync(reportPath), true, '27C.3 rendering audit report must be generated');

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '27C.3');
assert.equal(report.name, 'Rendering Audit');
assert.equal(report.executiveSummary.p0.length, 0, '27C.3 must not report P0 blockers');
assert.ok(report.modulesAudited >= 10, `expected at least 10 modules, got ${report.modulesAudited}`);
assert.ok(report.overallScore >= 3.8, `expected stable rendering score, got ${report.overallScore}`);
assert.ok(report.scores.resultRenderer >= 4.0, 'result renderer coverage should be stable');
assert.ok(report.evidence.coreRendering.renderCoordinatorExists, 'core render coordinator must exist');
assert.ok(report.evidence.coreRendering.renderSchedulerExists, 'core render scheduler must exist');
assert.ok(report.evidence.moduleRendering.modulesWithRenderPipeline.includes('hx-diagram'), 'h,x must expose the 26C single render pipeline');
assert.equal(report.evidence.moduleRendering.modulesWithDiagramInView.includes('hx-diagram'), false, 'h,x diagram SVG logic must remain outside view/index');

console.log(`Phase 27C.3 rendering audit test passed: ${report.overallScore} (${report.overallGrade})`);
