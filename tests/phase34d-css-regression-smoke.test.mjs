import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/audit-css-regression-smoke-phase34d.mjs'], { stdio: 'inherit' });

const report = JSON.parse(readFileSync('docs/audits/css/phase34d-css-regression-smoke.json', 'utf8'));

assert.equal(report.status, 'pass', 'Phase 34D CSS regression smoke audit passes');
assert.equal(report.moduleCount, 11, 'all 11 modules remain present');
assert.deepEqual(report.cssLinks, report.expectedCssOrder, 'CSS files load in token/layout/component/module order');
assert.ok(report.componentsLineCount < 1000, 'components.css remains compact after rebuild');
assert.ok(report.modulesLineCount < 300, 'modules.css remains an exception layer');
assert.equal(report.rebuiltLayerImportantCount, 0, 'rebuilt component/module layers have no !important overrides');

for (const [name, value] of Object.entries(report.checks)) {
  assert.equal(value, true, `check ${name} passes`);
}

console.log('Phase 34D CSS regression smoke test passed');
