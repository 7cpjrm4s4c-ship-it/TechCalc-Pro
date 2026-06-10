import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/audit-platform-module-comparison-phase27b.mjs'], { stdio: 'inherit' });

const reportPath = 'platform-module-comparison-phase27b.json';
assert.equal(existsSync(reportPath), true, 'phase27b report must be generated');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '27B');
assert.equal(report.modulesAudited, 11);
assert.deepEqual(report.missingModules, []);
assert.equal(report.dimensions.length, 13);
assert.equal(Object.keys(report.matrix).length, 11);
assert.ok(report.modules.every(module => typeof module.average === 'number'));
assert.ok(report.modules.every(module => module.evidence && module.evidence.files && module.evidence.lineCounts));

for (const referenceModule of ['heat-recovery', 'buffer-storage', 'hx-diagram']) {
  assert.ok(report.referenceModules.includes(referenceModule), `${referenceModule} must be a 27B reference module`);
  assert.ok(report.matrix[referenceModule], `${referenceModule} must be present in matrix`);
}

const hx = report.modules.find(module => module.module === 'hx-diagram');
assert.equal(hx.evidence.files['diagramRenderer.js'], true, 'hx-diagram must retain diagramRenderer boundary');
assert.ok(hx.scores.diagramRenderer >= 4, 'hx-diagram diagram renderer score must be platform-conformant');
assert.ok(hx.scores.renderPipeline >= 4, 'hx-diagram render pipeline score must be platform-conformant');

for (const dimension of report.dimensions) {
  assert.ok(report.byDimension[dimension], `dimension summary missing for ${dimension}`);
  assert.equal(typeof report.byDimension[dimension].average, 'number');
}

assert.ok(Array.isArray(report.backlog), 'backlog must be present');
console.log('phase27b module comparison test ok');
