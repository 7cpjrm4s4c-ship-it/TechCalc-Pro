import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/audit-platform-convergence-phase37a.mjs'], { stdio: 'inherit' });

const jsonPath = 'docs/audits/json/platform-convergence-audit-phase37a.json';
const mdPath = 'docs/phases/phase-37.md';
assert.equal(existsSync(jsonPath), true, 'phase37a JSON audit report must be generated');
assert.equal(existsSync(mdPath), true, 'phase37a markdown report must be generated');

const report = JSON.parse(readFileSync(jsonPath, 'utf8'));
assert.equal(report.phase, '37A');
assert.equal(report.name, 'Platform Convergence Audit');
assert.equal(report.modulesAudited, 11);
assert.deepEqual(report.referenceModules, ['heating-cooling', 'ventilation', 'pressure-holding', 'buffer-storage']);
assert.equal(Object.keys(report.moduleScores).length, 11);

for (const name of report.referenceModules) {
  const module = report.modules.find(item => item.module === name);
  assert.ok(module, `${name} must be audited`);
  assert.equal(module.reference, true, `${name} must be marked as reference module`);
  assert.ok(module.score >= 80, `${name} must stay platform-conformant`);
}

const rainwater = report.modules.find(item => item.module === 'rainwater');
assert.ok(rainwater, 'rainwater must be audited');
assert.equal(rainwater.metrics.nonControllerAddEventListeners, 0, 'rainwater precommit listener must stay inside controller boundary after 37A.1');

const unitConverter = report.modules.find(item => item.module === 'unit-converter');
assert.ok(unitConverter, 'unit-converter must be audited');
assert.equal(unitConverter.files.includes('controller.js'), true, 'unit-converter must expose controller.js after 37A.1');

const cssComponents = report.cssDebt.find(item => item.file === 'css/components.css');
const cssLayout = report.cssDebt.find(item => item.file === 'css/layout.css');
const cssModules = report.cssDebt.find(item => item.file === 'css/modules.css');
assert.equal(cssComponents.important, 0, 'components.css must remain !important-free');
assert.equal(cssLayout.important, 0, 'layout.css must remain !important-free');
assert.equal(cssModules.important, 0, 'modules.css must remain !important-free');

assert.ok(Array.isArray(report.riskRegister), 'risk register must be present');
assert.ok(report.riskRegister.length > 0, 'phase37a must produce a cleanup backlog');
assert.ok(Array.isArray(report.unusedUtilityExports), 'utility export review must be present');
console.log('phase37a platform convergence test ok');
