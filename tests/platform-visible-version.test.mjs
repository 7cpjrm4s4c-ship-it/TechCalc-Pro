import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const indexHtml = readFileSync('index.html', 'utf8');
const expectedVersion = packageJson.version;

const requiredVisibleVersionMarkers = [
  `data-app-version-current>${expectedVersion}</strong>`,
  `id="appVersion">${expectedVersion}</strong>`,
  `name="version" value="${expectedVersion}"`
];

for (const marker of requiredVisibleVersionMarkers) {
  assert.ok(
    indexHtml.includes(marker),
    `index.html must expose package.json version through settings and feedback marker: ${marker}`
  );
}

assert.ok(
  !indexHtml.includes('id="appVersion">1.4.0</strong>'),
  'legal/settings app version must not regress to stale 1.4.0 markup'
);

console.log(`settings visible app version guard ok (${expectedVersion})`);
