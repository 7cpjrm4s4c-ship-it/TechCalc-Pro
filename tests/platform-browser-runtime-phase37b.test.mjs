import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/audit-browser-runtime-phase37b.mjs'], { stdio: 'inherit' });

const reportPath = 'docs/audits/json/browser-runtime-smoke-phase37b.json';
const docPath = 'docs/phases/phase37b-browser-runtime-smoke.md';
const specPath = 'tests/e2e/phase37b-runtime-smoke.spec.mjs';
const configPath = 'playwright.config.mjs';

assert.equal(existsSync(reportPath), true, 'Phase 37B JSON report must exist');
assert.equal(existsSync(docPath), true, 'Phase 37B markdown document must exist');
assert.equal(existsSync(specPath), true, 'Phase 37B Playwright spec must exist');
assert.equal(existsSync(configPath), true, 'Playwright config must exist');

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '37B');
assert.equal(report.name, 'Browser Runtime Smoke Baseline');
assert.equal(report.status, 'ready');
assert.equal(report.modulesInScope, 11);
assert.deepEqual(report.browserProjects, ['chromium-desktop', 'webkit-mobile']);
assert.equal(report.specCount, 5);
assert.equal(report.importCheck, 'passed');
assert.equal(report.fileChecks.every(item => item.exists), true, 'all Phase 37B harness files must exist');
assert.equal(report.scriptChecks.every(item => item.exists), true, 'all Phase 37B npm scripts must exist');

const spec = readFileSync(specPath, 'utf8');
for (const moduleId of ['heating-cooling', 'ventilation', 'pressure-holding', 'buffer-storage', 'heat-recovery', 'hx-diagram', 'pipe-sizing', 'unit-converter', 'drinking-water', 'wastewater', 'rainwater']) {
  assert.match(spec, new RegExp(`['"]${moduleId}['"]`), `${moduleId} must be covered by browser route smoke`);
}
assert.match(spec, /serviceWorker/, 'service-worker smoke must be present');
assert.match(spec, /setOffline\(true\)/, 'offline reload smoke must be present');
assert.match(spec, /settingsPanel/, 'settings scroll-lock smoke must be present');
assert.match(spec, /module-nav/, 'mobile nav gesture smoke must be present');

const config = readFileSync(configPath, 'utf8');
assert.match(config, /chromium-desktop/, 'desktop chromium project must be configured');
assert.match(config, /webkit-mobile/, 'mobile webkit project must be configured');
assert.match(config, /serve-static|http-server/, 'static server must be configured for PWA smoke tests');

console.log('phase37b browser runtime harness test ok');
