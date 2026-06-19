import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const app = readFileSync('js/core/app.js', 'utf8');
const reportPath = 'docs/audits/json/app-shell-closure-phase37c7.json';

const requiredControllers = [
  'themeController.js',
  'settingsController.js',
  'releaseNotesController.js',
  'feedbackController.js',
  'serviceWorkerController.js'
];

assert.ok(existsSync(reportPath), 'Phase 37C.7 audit report must exist; run audit:phase37c7 first');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

assert.equal(report.phase, '37C.7');
assert.ok(report.appJs.lines <= 320, `app.js should remain <= 320 lines, got ${report.appJs.lines}`);
assert.equal(report.shell.requiredControllers.length, requiredControllers.length);

for (const controller of requiredControllers) {
  assert.ok(existsSync(`js/platform/shell/${controller}`), `${controller} must exist`);
  assert.ok(app.includes(`../platform/shell/${controller}`), `${controller} must be imported by app.js`);
  assert.ok(readFileSync('service-worker.js', 'utf8').includes(`./js/platform/shell/${controller}`), `${controller} must be precached`);
}

for (const forbidden of [
  /formspree\.io/i,
  /parseReleaseNotes|releaseNotesDynamic|releaseNotesFallback/,
  /serviceWorker\.register|TECHCALC_CACHE_UPDATED/,
  /techcalc-theme-mode|theme-switch__option/,
  /settings-panel__body|settings-submenu|techcalc-settings-ui/
]) {
  assert.equal(forbidden.test(app), false, `app.js still contains extracted shell responsibility: ${forbidden}`);
}

const phaseDocs = readdirSync('docs/phases').filter(file => file.endsWith('.md'));
assert.ok(phaseDocs.length <= 30, `phase documentation must stay consolidated, got ${phaseDocs.length} files`);

const phase37c = readFileSync('docs/phases/phase37c-app-shell-decomposition.md', 'utf8');
assert.match(phase37c, /37C\.7 – App-Shell Decomposition Closure/);
assert.match(phase37c, /Composition Root/);

console.log('phase37c7 app-shell closure regression ok');
