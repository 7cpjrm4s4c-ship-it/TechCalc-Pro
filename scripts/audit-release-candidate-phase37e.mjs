import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

function read(path) {
  return readFileSync(path, 'utf8');
}

const requiredFiles = [
  'js/core/app.js',
  'js/platform/shell/themeController.js',
  'js/platform/shell/settingsController.js',
  'js/platform/shell/releaseNotesController.js',
  'js/platform/shell/feedbackController.js',
  'js/platform/shell/serviceWorkerController.js',
  'js/platform/shell/performanceController.js',
  'docs/phases/phase-37.md',
  'docs/phases/phase37c-app-shell-decomposition.md',
  'docs/phases/phase37d-performance-observability-baseline.md'
];

const appSource = read('js/core/app.js');
const appLines = appSource.split(/\r?\n/).length;
const packageJson = JSON.parse(read('package.json'));
const releaseNotes = read('RELEASE_NOTES.md');
const serviceWorker = read('service-worker.js');

const shellControllers = requiredFiles
  .filter(file => file.startsWith('js/platform/shell/'))
  .map(file => ({ file, exists: existsSync(file), precached: serviceWorker.includes(file) }));

const debugNeedles = [
  'DW_REFRESH',
  'DW_REFRESH_SOURCE',
  'DW_DYNAMIC]',
  'DW_SCROLL',
  'WINDOW_SCROLL',
  'TOUCH_MOVE',
  '__tcDwGlobalDebug',
  '__tcDwScrollAudit'
];
const debugHits = execSync(`grep -R "${debugNeedles.join('\\|')}" -n js scripts tests || true`, { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter(line => !line.includes('audit-release-candidate-phase37e.mjs'));

const requiredScripts = [
  'test:phase37a-final',
  'test:phase37b4',
  'test:phase37c7',
  'test:phase37d',
  'test:module-smoke',
  'test:phase37e'
];
const missingScripts = requiredScripts.filter(name => !packageJson.scripts?.[name]);

const checks = [
  { id: 'required-files', pass: requiredFiles.every(existsSync), detail: requiredFiles.filter(file => !existsSync(file)) },
  { id: 'app-shell-size', pass: appLines <= 320, detail: { appLines, max: 320 } },
  { id: 'shell-controllers-precached', pass: shellControllers.every(item => item.exists && item.precached), detail: shellControllers },
  { id: 'debug-logs-removed', pass: debugHits.length === 0, detail: debugHits.slice(0, 20) },
  { id: 'phase-scripts-present', pass: missingScripts.length === 0, detail: missingScripts },
  { id: 'release-notes-phase37e', pass: releaseNotes.includes('Phase 37E'), detail: 'RELEASE_NOTES.md contains Phase 37E closure entry' }
];

const report = {
  phase: '37E',
  title: 'Release Candidate Closure Audit',
  status: checks.every(check => check.pass) ? 'pass' : 'fail',
  checkedAt: new Date().toISOString(),
  checks
};

mkdirSync('docs/audits/json', { recursive: true });
writeFileSync('docs/audits/json/release-candidate-phase37e.json', JSON.stringify(report, null, 2));

if (report.status !== 'pass') {
  console.error('Phase 37E release candidate audit failed.');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Phase 37E release candidate audit passed.');
