import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const playwrightConfig = readFileSync(new URL('../playwright.config.mjs', import.meta.url), 'utf8');
const regressionDoc = readFileSync(new URL('../docs/phases/phase-47d-regression.md', import.meta.url), 'utf8');
const gateScript = readFileSync(new URL('../scripts/test-phase47d-regression.mjs', import.meta.url), 'utf8');

assert.equal(packageJson.scripts['test:phase47d'], 'node scripts/test-phase47d-regression.mjs');
assert.equal(packageJson.scripts['build:verify:phase47d'], 'npm ci && npm run test:phase47d');

for (const project of [
  'chromium-desktop',
  'firefox-desktop',
  'chromium-tablet',
  'chromium-mobile',
  'webkit-tablet',
  'webkit-mobile'
]) {
  assert.match(playwrightConfig, new RegExp(`name: '${project}'`), `Playwright-Projekt ${project} fehlt.`);
}

for (const command of ['lint', 'test:flooding', 'test:integration', 'build', 'test:e2e']) {
  assert.match(gateScript, new RegExp(`'${command.replace(':', '\\:')}'`), `47D-Gate muss ${command} enthalten.`);
}
assert.match(gateScript, /\['test'\]/, '47D-Gate muss die bestehende Gesamtregression ausführen.');

for (const section of [
  'Fachberechnung',
  'Save/Edit/Load',
  'Projektimport und -export',
  'Migration älterer Projekte',
  'PDF und Mehrseitigkeit',
  'Light/Dark/System',
  'iOS/iPadOS/macOS/Windows',
  'Chrome, Edge, Firefox, Safari',
  'Offlinebetrieb und Cachewechsel',
  'Accessibility und Keyboard Navigation',
  'Bestehende Regression aller Module'
]) {
  assert.match(regressionDoc, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

assert.match(regressionDoc, /manuell offen/i, 'Nicht automatisierbare reale Plattformtests müssen ausdrücklich offen bleiben.');
assert.doesNotMatch(regressionDoc, /vollständig bestanden/i, 'Die Matrix darf vor Evidenz keine pauschale Freigabe behaupten.');

console.log('Phase 47D regression contract ok');
