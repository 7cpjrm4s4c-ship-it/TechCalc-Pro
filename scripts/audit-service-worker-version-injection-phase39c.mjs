import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const serviceWorker = read('service-worker.js');
const generator = read('scripts/generate-precache-manifest.mjs');
const integration = read('scripts/test-integration.mjs');

const expectedCacheName = `${pkg.name}-${pkg.version}`;
const expectedRevisionPrefix = `${pkg.version}-`;
const checks = [];
function check(id, passed, detail) {
  checks.push({ id, status: passed ? 'passed' : 'failed', detail });
}

check(
  'service-worker:cache-name-from-package-version',
  serviceWorker.includes(`const CACHE_NAME = '${expectedCacheName}';`),
  'service-worker cache name matches package.json name and version'
);

check(
  'generator:updates-cache-name',
  generator.includes('function packageCacheName(') && generator.includes("source.replace(/const CACHE_NAME = '[^']+';/"),
  'precache generator owns CACHE_NAME injection as well as ASSETS injection'
);


check(
  'service-worker:cache-revision-from-release-notes',
  serviceWorker.includes(`const CACHE_REVISION = '${expectedRevisionPrefix}`),
  'service-worker revision includes package version and current release-notes heading'
);

check(
  'generator:check-mode-validates-cache-name',
  /process\.argv\.includes\('--check'\)/.test(generator) && /source !== nextSource/.test(generator),
  'precache --check fails when service-worker cache name or manifest is stale'
);

check(
  'integration:version-guard-covered',
  integration.includes('scripts/audit-service-worker-version-injection-phase39c.mjs'),
  'phase39c service-worker version guard is part of the consolidated integration gate'
);

const report = {
  phase: '39C',
  name: 'Service Worker Version Injection',
  status: checks.every(item => item.status === 'passed') ? 'passed' : 'failed',
  expectedCacheName,
  expectedRevisionPrefix,
  checks
};

fs.mkdirSync(path.join(root, 'docs/audits/json'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/audits/json/service-worker-version-injection-phase39c.json'), `${JSON.stringify(report, null, 2)}\n`);

if (report.status !== 'passed') {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('phase39c service-worker version injection audit ok');
