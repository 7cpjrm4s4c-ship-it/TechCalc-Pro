import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const APP_PATH = 'js/core/app.js';
const SHELL_DIR = 'js/platform/shell';
const SW_PATH = 'service-worker.js';
const REPORT_PATH = 'docs/audits/json/app-shell-closure-phase37c7.json';

const requiredControllers = [
  'themeController.js',
  'settingsController.js',
  'releaseNotesController.js',
  'feedbackController.js',
  'serviceWorkerController.js'
];

function read(file) {
  return readFileSync(file, 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const app = read(APP_PATH);
const serviceWorker = read(SW_PATH);
const packageJson = JSON.parse(read('package.json'));
const shellFiles = readdirSync(SHELL_DIR).filter(name => name.endsWith('.js')).sort();

const controllerStatus = requiredControllers.map(file => {
  const filePath = path.join(SHELL_DIR, file);
  const exists = existsSync(filePath);
  const source = exists ? read(filePath) : '';
  const exportedInitializer = /export\s+function\s+initialize[A-Za-z0-9_]+Controller/.test(source);
  const importedByApp = app.includes(`../platform/shell/${file}`);
  const precached = serviceWorker.includes(`./js/platform/shell/${file}`);
  return { file, exists, exportedInitializer, importedByApp, precached };
});

const forbiddenAppPatterns = [
  { name: 'Formspree endpoint in app.js', pattern: /formspree\.io/i },
  { name: 'Release notes parser in app.js', pattern: /parseReleaseNotes|releaseNotesDynamic|releaseNotesFallback/ },
  { name: 'Direct service worker registration in app.js', pattern: /serviceWorker\.register|TECHCALC_CACHE_UPDATED/ },
  { name: 'Theme storage implementation in app.js', pattern: /techcalc-theme-mode|data-theme|theme-switch__option/ },
  { name: 'Settings drawer implementation in app.js', pattern: /settings-panel__body|settings-submenu|techcalc-settings-ui/ }
];

const forbiddenMatches = forbiddenAppPatterns
  .filter(item => item.pattern.test(app))
  .map(item => item.name);

const report = {
  phase: '37C.7',
  title: 'App-Shell Decomposition Closure',
  appJs: {
    path: APP_PATH,
    lines: lineCount(app),
    maxAllowedLines: 320,
    role: 'bootstrap, lazy-module registration, route composition, session persistence, global module navigation'
  },
  shell: {
    directory: SHELL_DIR,
    files: shellFiles,
    requiredControllers: controllerStatus
  },
  guards: {
    packageScripts: {
      phase37c2: Boolean(packageJson.scripts?.['test:phase37c2']),
      phase37c3: Boolean(packageJson.scripts?.['test:phase37c3']),
      phase37c4: Boolean(packageJson.scripts?.['test:phase37c4']),
      phase37c5: Boolean(packageJson.scripts?.['test:phase37c5']),
      phase37c6: Boolean(packageJson.scripts?.['test:phase37c6'])
    },
    forbiddenMatches
  }
};

for (const status of controllerStatus) {
  assert(status.exists, `missing shell controller: ${status.file}`);
  assert(status.exportedInitializer, `controller must export an initialize*Controller function: ${status.file}`);
  assert(status.importedByApp, `app.js must import shell controller: ${status.file}`);
  assert(status.precached, `service-worker precache must include shell controller: ${status.file}`);
}

assert(report.appJs.lines <= report.appJs.maxAllowedLines, `app.js must stay <= ${report.appJs.maxAllowedLines} lines, got ${report.appJs.lines}`);
assert(forbiddenMatches.length === 0, `app.js still contains extracted shell responsibilities: ${forbiddenMatches.join(', ')}`);
assert(report.guards.packageScripts.phase37c2, 'theme controller guard missing');
assert(report.guards.packageScripts.phase37c3, 'settings controller guard missing');
assert(report.guards.packageScripts.phase37c4, 'release notes controller guard missing');
assert(report.guards.packageScripts.phase37c5, 'feedback controller guard missing');
assert(report.guards.packageScripts.phase37c6, 'service worker controller guard missing');

mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

console.log('phase37c7 app-shell closure audit ok');
console.log(JSON.stringify({ appJsLines: report.appJs.lines, controllers: requiredControllers.length }, null, 2));
