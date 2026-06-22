import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts ?? {};
const names = Object.keys(scripts).sort();

assert.deepEqual(names, [
  'audit:imports',
  'build',
  'precache',
  'serve:static',
  'test',
  'test:e2e',
  'test:integration'
].sort(), 'package.json must expose only the consolidated RC script surface');

assert.equal(scripts.test, 'node scripts/test-fast.mjs', 'npm test must be the fast local gate');
assert.equal(scripts['test:integration'], 'node scripts/test-integration.mjs', 'integration gate must be explicit');
assert.equal(scripts['test:e2e'], 'playwright test', 'e2e gate must remain Playwright-only');

for (const name of names) {
  assert(!/^test:phase\d+/u.test(name), `historical phase test script must not remain in standard npm surface: ${name}`);
  assert(!/^audit:phase\d+/u.test(name), `historical phase audit script must not remain in standard npm surface: ${name}`);
}

const fastGate = fs.readFileSync('scripts/test-fast.mjs', 'utf8');
assert(fastGate.includes('tests/number-service.test.mjs'), 'fast gate must include numeric unit coverage');
assert(fastGate.includes('scripts/check-js-imports.mjs'), 'fast gate must include import validation');
assert(!fastGate.includes('playwright'), 'fast gate must not invoke browser e2e tests');

const integrationGate = fs.readFileSync('scripts/test-integration.mjs', 'utf8');
assert(integrationGate.includes('scripts/generate-precache-manifest.mjs'), 'integration gate must validate generated precache manifest');
assert(integrationGate.includes('platform-release-candidate-phase37e.test.mjs'), 'integration gate must retain RC regression coverage');
assert(!integrationGate.includes('playwright test'), 'integration gate must not hide e2e under npm run test:integration');

console.log('Phase 38B test script consolidation ok');
