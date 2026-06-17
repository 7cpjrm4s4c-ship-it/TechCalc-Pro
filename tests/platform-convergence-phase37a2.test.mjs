import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/audit-platform-convergence-phase37a.mjs'], { stdio: 'inherit' });

const report = JSON.parse(readFileSync('docs/audits/json/platform-convergence-audit-phase37a.json', 'utf8'));
const migrationFindings = report.riskRegister.filter(item => item.area === 'runtime-metadata');
assert.equal(migrationFindings.length, 0, 'Phase 37A.2 must remove all runtime migrationStatus breadcrumbs');

for (const module of report.modules) {
  assert.equal(module.metrics.migrationStatusEntries, 0, `${module.module} must not expose migrationStatus in runtime config`);
}

const configs = [
  'buffer-storage',
  'drinking-water',
  'heat-recovery',
  'heating-cooling',
  'hx-diagram',
  'pipe-sizing',
  'pressure-holding',
  'rainwater',
  'unit-converter',
  'ventilation',
  'wastewater'
];

for (const name of configs) {
  const source = readFileSync(`js/modules/${name}/config.js`, 'utf8');
  assert.doesNotMatch(source, /migrationStatus\s*:/, `${name} config must not contain migrationStatus`);
  assert.match(source, /defineModuleConfig\s*\(/, `${name} config must keep defineModuleConfig contract`);
}

assert.equal(report.riskCounts.P1 || 0, 0, 'P1 convergence findings must remain closed after 37A.2');
assert.equal(report.riskCounts.P2 || 0, 6, 'Phase 37A.2 should leave only CSS/event-density P2 findings');

console.log('phase37a2 runtime metadata cleanup test ok');
