import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'js/core/app.js');
const controllerPath = path.join(root, 'js/platform/shell/themeController.js');
const serviceWorkerPath = path.join(root, 'service-worker.js');
const outPath = path.join(root, 'docs/audits/json/app-shell-theme-controller-phase37c2.json');

const appSource = fs.readFileSync(appPath, 'utf8');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const serviceWorkerSource = fs.readFileSync(serviceWorkerPath, 'utf8');
const appLineCount = appSource.split(/\r?\n/).length;
const controllerLineCount = controllerSource.split(/\r?\n/).length;

const checks = [
  {
    id: 'theme-controller-file',
    passed: fs.existsSync(controllerPath),
    detail: 'Theme shell controller exists under js/platform/shell.'
  },
  {
    id: 'app-imports-theme-controller',
    passed: /import \{ initializeThemeController \} from '..\/platform\/shell\/themeController\.js';/.test(appSource),
    detail: 'app.js imports the extracted controller through an explicit relative ESM import.'
  },
  {
    id: 'app-initializes-theme-controller',
    passed: /initializeThemeController\(\{ root: settingsPanel \|\| document \}\);/.test(appSource),
    detail: 'Theme initialization remains in the app shell composition root.'
  },
  {
    id: 'theme-implementation-removed-from-app',
    passed: !/function getStoredThemeMode\(|function applyThemeMode\(|const THEME_STORAGE_KEY/.test(appSource),
    detail: 'Theme storage and DOM mutation implementation moved out of app.js.'
  },
  {
    id: 'theme-public-api',
    passed: [
      'initializeThemeController',
      'applyTheme',
      'toggleTheme',
      'getCurrentTheme'
    ].every(name => new RegExp(`export function ${name}\\b`).test(controllerSource)),
    detail: 'Theme controller exposes the agreed public API.'
  },
  {
    id: 'theme-safe-storage',
    passed: /try \{[\s\S]*getItem/.test(controllerSource) && /try \{[\s\S]*setItem/.test(controllerSource),
    detail: 'Theme storage access remains guarded for private-mode/browser restrictions.'
  },
  {
    id: 'service-worker-precache',
    passed: serviceWorkerSource.includes("'./js/platform/shell/themeController.js'"),
    detail: 'New runtime module is included in the offline precache surface.'
  },
  {
    id: 'app-line-count-reduced',
    passed: appLineCount < 616,
    detail: `app.js line count reduced from 616 to ${appLineCount}.`
  }
];

const report = {
  phase: '37C.2',
  title: 'Theme Controller Extraction',
  policy: {
    runtimeBehaviorChanged: false,
    appShellCompositionChanged: true,
    moduleCodeChanged: false
  },
  totals: {
    appJsLineCount: appLineCount,
    themeControllerLineCount: controllerLineCount,
    checks: checks.length,
    passed: checks.filter(item => item.passed).length,
    failed: checks.filter(item => !item.passed).length
  },
  extracted: {
    source: 'js/core/app.js',
    target: 'js/platform/shell/themeController.js',
    responsibilities: [
      'theme initialization',
      'theme persistence',
      'dark/light/system mode application',
      'theme switch option active-state updates',
      'theme button event binding'
    ]
  },
  checks,
  next: '37C.3 settings-controller preparation or next low-risk shell extraction after browser smoke confirmation.'
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

if (report.totals.failed > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`Phase 37C.2 theme controller extraction verified (${report.totals.passed}/${report.totals.checks}).`);
