import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/audit-core-platform-phase27c1.mjs'], { stdio: 'inherit' });

const reportPath = 'platform-core-audit-phase27c1.json';
assert.equal(existsSync(reportPath), true, 'phase27c1 report must be generated');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '27C.1');
assert.equal(report.name, 'Core Platform Audit');
assert.equal(report.auditAreas.length, 6);
assert.ok(report.overallScore >= 3.8, 'core platform score must remain release-stable');
assert.ok(['A', 'B'].includes(report.overallGrade), 'core platform grade must be A or B');

for (const area of ['platformKernel', 'moduleRegistry', 'lifecycle', 'eventSystem', 'navigation', 'dependencyGraph']) {
  assert.equal(typeof report.scores[area], 'number', `${area} score missing`);
  assert.ok(report.grades[area], `${area} grade missing`);
}

assert.equal(report.evidence.kernel.moduleDefinitionHasFactory, true, 'createPlatformModule factory must exist');
assert.equal(report.evidence.registry.allModulesUsePlatformMount, true, 'all modules must use createPlatformModule');
assert.equal(report.evidence.navigation.routerExists, true, 'router core must exist');
assert.equal(report.evidence.navigation.scrollManagerExists, true, 'scroll manager core must exist');
assert.equal(report.evidence.eventSystem.eventPipelineExists, true, 'event pipeline core must exist');
assert.ok(Array.isArray(report.evidence.dependencyGraph.dependencyViolations), 'dependency findings must be array');
assert.deepEqual(report.executiveSummary.p0, [], '27C.1 must not introduce P0 findings');

console.log('phase27c1 core platform audit test ok');
