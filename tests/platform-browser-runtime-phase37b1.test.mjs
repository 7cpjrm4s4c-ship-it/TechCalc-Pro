import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

execFileSync('node', ['scripts/phase37b1-runtime-preflight.mjs'], { stdio: 'inherit' });

const reportPath = 'docs/audits/json/browser-runtime-execution-phase37b1.json';
const docPath = 'docs/phases/phase37b1-browser-runtime-execution.md';
const serverPath = 'scripts/serve-static.mjs';
const configPath = 'playwright.config.mjs';
const specPath = 'tests/e2e/phase37b-runtime-smoke.spec.mjs';

for (const path of [reportPath, docPath, serverPath, configPath, specPath]) {
  assert.equal(existsSync(path), true, `${path} must exist`);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
assert.equal(report.phase, '37B.1');
assert.match(report.status, /ready|blocked-by-environment/);
assert.equal(report.findings.some(item => item.id === 'static-server' && item.status === 'passed'), true);

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(packageJson.scripts['serve:static'], 'node scripts/serve-static.mjs');
assert.equal(packageJson.scripts['test:phase37b1'], 'node tests/platform-browser-runtime-phase37b1.test.mjs');
assert.equal(packageJson.scripts['test:e2e:phase37b1'], 'playwright test tests/e2e/phase37b-runtime-smoke.spec.mjs');

const config = readFileSync(configPath, 'utf8');
assert.match(config, /node scripts\/serve-static\.mjs/, 'Playwright must use the zero-dependency static server');
assert.doesNotMatch(config, /http-server/, 'Playwright config must not depend on npx http-server');

console.log('phase37b1 browser runtime execution test ok');
