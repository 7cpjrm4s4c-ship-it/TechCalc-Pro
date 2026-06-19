import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/audit-platform-convergence-phase37a.mjs'], { stdio: 'inherit' });

const report = JSON.parse(readFileSync('docs/audits/json/platform-convergence-audit-phase37a.json', 'utf8'));

assert.equal(report.phase, '37A');
assert.equal(report.modulesAudited, 11, 'Phase 37A closure must keep all 11 active modules in scope');
assert.equal(report.riskCounts.P0 || 0, 0, 'Phase 37A closure must have no P0 findings');
assert.equal(report.riskCounts.P1 || 0, 0, 'Phase 37A closure must have no P1 findings');
assert.equal(report.riskCounts.P2 || 0, 6, 'Phase 37A closure intentionally carries exactly 6 P2 backlog items');

const areas = new Set(report.riskRegister.map(item => item.area));
assert.deepEqual([...areas].sort(), ['css-specialization', 'event-density'], 'Remaining findings must be limited to accepted P2 cleanup areas');

for (const module of report.modules) {
  assert.equal(module.metrics.nonControllerAddEventListeners, 0, `${module.module} must not have event listeners outside controller.js`);
  assert.equal(module.metrics.directDomMutationsOutsideRenderer, 0, `${module.module} must not mutate DOM HTML outside renderer boundaries`);
  assert.equal(module.metrics.migrationStatusEntries, 0, `${module.module} must not expose migrationStatus runtime metadata`);
  assert.ok(module.score >= 86, `${module.module} must remain at or above 86 convergence score`);
}

const cssComponents = report.cssDebt.find(item => item.file === 'css/components.css');
const cssLayout = report.cssDebt.find(item => item.file === 'css/layout.css');
const cssModules = report.cssDebt.find(item => item.file === 'css/modules.css');
assert.equal(cssComponents.important, 0, 'components.css must remain !important-free');
assert.equal(cssLayout.important, 0, 'layout.css must remain !important-free');
assert.equal(cssModules.important, 0, 'modules.css must remain !important-free');

assert.equal(existsSync('docs/phases/phase-37.md'), true, 'Phase 37A closure document must exist');
const closure = readFileSync('docs/phases/phase-37.md', 'utf8');
assert.match(closure, /Phase 37A abgeschlossen/);
assert.match(closure, /P1-Findings: 0/);
assert.match(closure, /P2-Restpunkte: 6/);

console.log('phase37a final closure test ok');
