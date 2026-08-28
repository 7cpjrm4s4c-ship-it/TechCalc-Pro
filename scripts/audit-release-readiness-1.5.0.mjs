import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const indexHtml = read('index.html');
const releaseNotes = read('docs/releases/1.5.0.md');
const serviceWorker = read('service-worker.js');
const appVersionSource = read('js/core/version.js');
const floodingReportAdapter = read('js/modules/flooding-verification/reportAdapter.js');

const currentVersion = packageJson.version;
assert.equal(currentVersion, '1.5.0', `package version must be 1.5.0, got ${currentVersion}`);
assert.equal(packageLock.version, currentVersion, 'package-lock top-level version must match package.json');
assert.equal(packageLock.packages?.['']?.version, currentVersion, 'package-lock root package version must match package.json');
assert.match(appVersionSource, /APP_VERSION\s*=\s*['"]1\.5\.0['"]/, 'central APP_VERSION must be 1.5.0');
assert.match(serviceWorker, /CACHE_NAME\s*=\s*['"]techcalc-pro-1\.5\.0['"]/, 'service-worker cache must target 1.5.0');
assert.match(serviceWorker, /CACHE_REVISION\s*=\s*['"]1\.5\.0-/, 'service-worker revision must target 1.5.0 release notes');
assert.match(floodingReportAdapter, /APP_VERSION/, 'flooding report must consume the central app version');

const escapedVersion = currentVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const visibleVersionMatches = indexHtml.match(new RegExp(escapedVersion, 'g')) || [];
assert.ok(visibleVersionMatches.length >= 3, `index.html must expose ${currentVersion} in release, feedback and app info`);
assert.match(releaseNotes, /^# TechCalc Pro 1\.5\.0$/m, 'release notes must target TechCalc Pro 1.5.0');
assert.doesNotMatch(releaseNotes, /Phase\s+\d+/i, 'public release notes must not contain internal phase labels');
assert.doesNotMatch(releaseNotes, /dev\.\d+/i, 'public release notes must not contain development build labels');

for (const script of ['lint', 'test', 'test:f-gases', 'test:flooding', 'test:integration', 'build', 'test:e2e:desktop-tablet', 'test:e2e:module-layout', 'test:visual:flooding']) {
  assert.ok(packageJson.scripts?.[script], `package.json missing release gate script ${script}`);
}
console.log(`TechCalc Pro ${currentVersion} release-readiness metadata audit passed.`);
