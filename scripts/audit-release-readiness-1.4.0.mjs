import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const indexHtml = read('index.html');
const releaseNotes = read('docs/releases/1.4.0.md');

const currentVersion = packageJson.version;
const allowedPreRelease = /^1\.4\.0-(?:dev\.\d+|rc\.\d+)$/;
assert.ok(currentVersion === '1.4.0' || allowedPreRelease.test(currentVersion),
  `package version must target 1.4.0, got ${currentVersion}`);
assert.equal(packageLock.version, currentVersion,
  'package-lock.json top-level version must match package.json');
assert.equal(packageLock.packages?.['']?.version, currentVersion,
  'package-lock.json root package version must match package.json');

const escapedVersion = currentVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const visibleVersionMatches = indexHtml.match(new RegExp(escapedVersion, 'g')) || [];
assert.ok(visibleVersionMatches.length >= 3,
  `index.html must expose the package version in release notes, feedback metadata and app info; found ${visibleVersionMatches.length}`);

assert.match(releaseNotes, /^# TechCalc Pro 1\.4\.0$/m,
  'release notes must target TechCalc Pro 1.4.0');
assert.doesNotMatch(releaseNotes, /Phase\s+\d+/i,
  'public release notes must not contain internal phase labels');
assert.doesNotMatch(releaseNotes, /dev\.\d+/i,
  'public release notes must not contain development build labels');
for (const heading of ['## Neu', '## Verbesserungen', '## Behoben', '## Kompatibilität']) {
  assert.ok(releaseNotes.includes(heading), `release notes missing ${heading}`);
}

const requiredScripts = [
  'lint',
  'test',
  'test:flooding',
  'test:integration',
  'build',
  'test:e2e:desktop-tablet',
  'test:e2e:module-layout',
  'test:visual:flooding'
];
for (const script of requiredScripts) {
  assert.ok(packageJson.scripts?.[script], `package.json missing release gate script ${script}`);
}

console.log(`TechCalc Pro ${currentVersion} release-readiness metadata audit passed.`);
