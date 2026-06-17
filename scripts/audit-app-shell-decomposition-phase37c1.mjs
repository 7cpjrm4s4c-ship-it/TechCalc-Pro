import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'js/core/app.js');
const outPath = path.join(root, 'docs/audits/json/app-shell-decomposition-phase37c1.json');
const source = fs.readFileSync(appPath, 'utf8');
const lines = source.split(/\r?\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const responsibilities = [
  {
    id: 'module-manifest-lazy-loader',
    title: 'Module manifest, registration and lazy preload',
    lines: [1, 91],
    target: 'js/core/moduleRegistryBootstrap.js',
    extractionPhase: '37C.2',
    risk: 'medium',
    notes: 'Contains config imports, dynamic import paths, module cache, preloading and modules.register wiring. Extract first because it has clear inputs and few DOM dependencies.'
  },
  {
    id: 'session-persistence-hooks',
    title: 'Session persistence lifecycle hooks',
    lines: [93, 114],
    target: 'js/core/sessionPersistenceController.js',
    extractionPhase: '37C.2',
    risk: 'low',
    notes: 'Pure page lifecycle and external-link persistence hooks around projectStorage.'
  },
  {
    id: 'global-navigation-gesture-controller',
    title: 'Global module navigation gesture guard',
    lines: [117, 211],
    target: 'js/core/navigationGestureController.js',
    extractionPhase: '37C.3',
    risk: 'medium',
    notes: 'Pointer/click boundary must preserve the 37B mobile swipe guard and single click route-change semantics.'
  },
  {
    id: 'module-runtime-bootstrap',
    title: 'Module runtime bootstrap and route render bridge',
    lines: [214, 235],
    target: 'js/core/appRuntimeBootstrap.js',
    extractionPhase: '37C.2',
    risk: 'medium',
    notes: 'Creates ModuleRuntime, initializes router, renders quick access settings and project-loaded remount bridge.'
  },
  {
    id: 'pdf-export-bootstrap',
    title: 'Lazy PDF export bootstrap',
    lines: [237, 248],
    target: 'js/core/pdfExportController.js',
    extractionPhase: '37C.4',
    risk: 'low',
    notes: 'Already lazy loaded; extraction should preserve one-shot promise semantics.'
  },
  {
    id: 'responsive-navigation-refresh',
    title: 'Resize-driven navigation refresh',
    lines: [250, 257],
    target: 'js/core/responsiveNavigationController.js',
    extractionPhase: '37C.3',
    risk: 'low',
    notes: 'RAF throttled resize hook. Safe to extract once navigation gestures are isolated.'
  },
  {
    id: 'theme-and-storage-helpers',
    title: 'Theme mode and UI storage helpers',
    lines: [259, 308],
    target: 'js/core/themeController.js',
    extractionPhase: '37C.4',
    risk: 'medium',
    notes: 'Theme state currently shares settings-panel DOM constants and storage helpers; extract with explicit initThemeController().' 
  },
  {
    id: 'feedback-form-controller',
    title: 'Feedback form submission controller',
    lines: [310, 365],
    target: 'js/core/feedbackController.js',
    extractionPhase: '37C.4',
    risk: 'low',
    notes: 'Hardcoded endpoint remains known tech debt; extraction should parameterize endpoint/version/currentRoute without changing behavior.'
  },
  {
    id: 'release-notes-controller',
    title: 'Release notes loader and renderer',
    lines: [367, 432],
    target: 'js/core/releaseNotesController.js',
    extractionPhase: '37C.4',
    risk: 'low',
    notes: 'Self-contained parser/render path. Needs escapeHtml local to the module.'
  },
  {
    id: 'pdf-idle-preinit',
    title: 'Idle pre-initialization for PDF export',
    lines: [434, 440],
    target: 'js/core/pdfExportController.js',
    extractionPhase: '37C.4',
    risk: 'low',
    notes: 'Move together with PDF bootstrap to preserve early menu readiness.'
  },
  {
    id: 'settings-panel-controller',
    title: 'Settings drawer, scroll lock and submenu state',
    lines: [442, 594],
    target: 'js/core/settingsPanelController.js',
    extractionPhase: '37C.5',
    risk: 'high',
    notes: 'Highest-risk extraction because it owns iOS scroll lock, focus restore, submenu persistence and touchmove prevention. Requires 37B smoke coverage after extraction.'
  },
  {
    id: 'header-scroll-controller',
    title: 'Header transparency on scroll',
    lines: [596, 602],
    target: 'js/core/headerScrollController.js',
    extractionPhase: '37C.3',
    risk: 'low',
    notes: 'Small passive scroll controller; safe extraction.'
  },
  {
    id: 'service-worker-controller',
    title: 'Service worker registration and cache update message',
    lines: [604, 616],
    target: 'js/core/serviceWorkerController.js',
    extractionPhase: '37C.6',
    risk: 'medium',
    notes: 'Preserve no-forced-reload behavior and APP_VERSION cache busting.'
  }
];

const totals = responsibilities.reduce((acc, item) => {
  const [start, end] = item.lines;
  const count = end - start + 1;
  acc.mappedLines += count;
  acc.byRisk[item.risk] = (acc.byRisk[item.risk] || 0) + 1;
  acc.byPhase[item.extractionPhase] = (acc.byPhase[item.extractionPhase] || 0) + 1;
  return acc;
}, { totalLines: lines.length, mappedLines: 0, byRisk: {}, byPhase: {} });

totals.appJsLineCount = lines.length;
totals.targetAppJsLineCountAfter37C = '80-130';
totals.runtimeChanged = false;

const findings = [
  {
    id: 'F-37C1-01',
    severity: 'P1',
    title: 'app.js still owns 13 responsibilities',
    detail: 'The file remains an app-shell monolith. The immediate risk is not runtime correctness but high coupling before further platform work.'
  },
  {
    id: 'F-37C1-02',
    severity: 'P1',
    title: 'Settings panel extraction is the highest-risk refactor',
    detail: 'Settings owns scroll lock, focus restore and Safari touchmove prevention. It must be extracted after lower-risk controllers and guarded by 37B browser smokes.'
  },
  {
    id: 'F-37C1-03',
    severity: 'P2',
    title: 'Feedback endpoint remains hardcoded',
    detail: 'Keep behavior unchanged in 37C; after extraction the endpoint should become an injected controller option in a later security/config phase.'
  }
];

const extractionOrder = [
  {
    phase: '37C.2',
    name: 'Bootstrap boundaries',
    move: ['module-manifest-lazy-loader', 'session-persistence-hooks', 'module-runtime-bootstrap'],
    guard: ['build', 'test:module-smoke', 'test:phase37b3']
  },
  {
    phase: '37C.3',
    name: 'Navigation and small UI controllers',
    move: ['global-navigation-gesture-controller', 'responsive-navigation-refresh', 'header-scroll-controller'],
    guard: ['test:phase37b2', 'test:phase37b1b']
  },
  {
    phase: '37C.4',
    name: 'Settings-adjacent low-risk controllers',
    move: ['pdf-export-bootstrap', 'pdf-idle-preinit', 'theme-and-storage-helpers', 'feedback-form-controller', 'release-notes-controller'],
    guard: ['test:phase37b2', 'test:phase37b3']
  },
  {
    phase: '37C.5',
    name: 'Settings panel controller',
    move: ['settings-panel-controller'],
    guard: ['test:phase37b2', 'manual mobile settings scroll-lock check']
  },
  {
    phase: '37C.6',
    name: 'Service worker shell controller and closure',
    move: ['service-worker-controller'],
    guard: ['test:phase37b3', 'offline reload manual check']
  }
];

const appJsDependencies = {
  imports: (source.match(/^import\s+.*$/gm) || []).map(line => line.trim()),
  directDomQueries: (source.match(/document\.(getElementById|querySelector|querySelectorAll)\([^\n]+/g) || []).length,
  globalListeners: (source.match(/trackGlobalEventListener\(/g) || []).length,
  nativeListeners: (source.match(/\.addEventListener\(/g) || []).length,
  dynamicImports: (source.match(/import\(/g) || []).length,
  localStorageReferences: (source.match(/localStorage/g) || []).length,
  sessionStorageReferences: (source.match(/sessionStorage/g) || []).length
};

const report = {
  phase: '37C.1',
  title: 'App Shell Decomposition Responsibility Map',
  generatedAt: new Date().toISOString(),
  source: 'js/core/app.js',
  totals,
  responsibilities,
  extractionOrder,
  findings,
  appJsDependencies,
  policy: {
    runtimeCodeChanged: false,
    nextPhaseCanModifyRuntime: '37C.2',
    stopCondition: 'Any new browser console error, module smoke regression or settings scroll-lock regression stops the refactor.'
  }
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 37C.1 app-shell decomposition audit complete: ${responsibilities.length} responsibilities mapped from ${lines.length} app.js lines.`);
