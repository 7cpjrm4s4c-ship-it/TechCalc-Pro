import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const json = file => JSON.parse(read(file));

function listJsFiles(dir = 'js') {
  const out = [];
  function walk(abs) {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const full = path.join(abs, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) out.push(path.relative(root, full).replaceAll('\\', '/'));
    }
  }
  walk(path.join(root, dir));
  return out;
}

const scrollSource = exists('js/core/scrollManager.js') ? read('js/core/scrollManager.js') : '';
const focusSource = exists('js/core/focusManager.js') ? read('js/core/focusManager.js') : '';
const eventSource = exists('js/core/eventManager.js') ? read('js/core/eventManager.js') : '';
const runtimeSource = exists('js/core/moduleRuntime.js') ? read('js/core/moduleRuntime.js') : '';
const appSource = exists('js/core/app.js') ? read('js/core/app.js') : '';

const prerequisiteReports = [
  'platform-scroll-audit-phase28a1.json',
  'platform-scroll-service-phase28a2.json',
  'platform-scroll-saved-records-phase28a3.json',
  'platform-scroll-module-switch-phase28a4.json',
  'platform-focus-service-phase28b1.json',
  'platform-enter-navigation-phase28b2.json',
  'platform-tab-navigation-phase28b3.json',
  'platform-dynamic-input-focus-phase28b4.json',
  'platform-event-system-cleanup-phase28c.json'
];

const loadedReports = prerequisiteReports.filter(exists).map(file => ({ file, data: json(file) }));
const missingReports = prerequisiteReports.filter(file => !exists(file));
const p0 = [];
const p1 = [];
const p2 = [];

if (missingReports.length) p0.push(`Fehlende Phase-28-Vorberichte: ${missingReports.join(', ')}`);
if (!exists('js/core/scrollManager.js')) p0.push('PlatformScrollManager fehlt.');
if (!exists('js/core/focusManager.js')) p0.push('PlatformFocusManager fehlt.');
if (!exists('js/core/eventManager.js')) p0.push('Platform Event Manager fehlt.');

const capabilities = {
  scroll: {
    manager: /PlatformScrollManager/.test(scrollSource),
    capturePosition: /export function capturePosition/.test(scrollSource),
    restorePosition: /export function restorePosition/.test(scrollSource),
    runWithoutScrollJump: /export function runWithoutScrollJump/.test(scrollSource),
    savedRecordGuard: /preserveSavedRecordMutation/.test(scrollSource),
    moduleSwitchGuard: /preserveModuleSwitchScroll/.test(scrollSource),
    runtimeIntegrated: /preserveModuleSwitchScroll/.test(runtimeSource) || /preserveModuleSwitchScroll/.test(appSource)
  },
  focus: {
    manager: /PlatformFocusManager/.test(focusSource),
    safeFocus: /export function safeFocus/.test(focusSource),
    enterNavigation: /handleEnterNavigation/.test(focusSource),
    tabNavigation: /handleTabNavigation/.test(focusSource),
    platformFieldNavigation: /handlePlatformFieldNavigation/.test(focusSource),
    dynamicFocusRestore: /preserveFocusDuring/.test(focusSource) && /captureActiveField/.test(focusSource),
    preventScrollDefault: /preventScroll:\s*true/.test(focusSource)
  },
  events: {
    manager: /export function on/.test(eventSource),
    scopes: /createEventScope/.test(eventSource),
    globalTracking: /trackGlobalEventListener/.test(eventSource),
    snapshot: /snapshotEventListeners/.test(eventSource),
    appIntegrated: /trackGlobalEventListener/.test(appSource),
    delegationIntegrated: exists('js/core/eventDelegation.js') && /createEventScope/.test(read('js/core/eventDelegation.js'))
  }
};

for (const [area, checks] of Object.entries(capabilities)) {
  for (const [name, ok] of Object.entries(checks)) {
    if (!ok) p1.push(`${area}.${name} nicht nachweisbar.`);
  }
}

const jsFiles = listJsFiles();
const directWindowScroll = [];
const directFocus = [];
const directGlobalListeners = [];
for (const file of jsFiles) {
  const src = read(file);
  src.split(/\r?\n/).forEach((line, idx) => {
    const text = line.trim();
    if (/\bwindow\.scrollTo\(|\.scrollIntoView\(/.test(text) && !file.endsWith('scrollManager.js') && !file.endsWith('renderer.js')) {
      directWindowScroll.push({ file, line: idx + 1, text });
    }
    if (/\.focus\(/.test(text) && !file.endsWith('focusManager.js')) {
      directFocus.push({ file, line: idx + 1, text });
    }
    if (/\b(window|document)\.addEventListener\(/.test(text) && !file.endsWith('eventManager.js')) {
      directGlobalListeners.push({ file, line: idx + 1, text });
    }
  });
}

if (directWindowScroll.length) p2.push('Direkte Scroll-Aufrufe ausserhalb des ScrollManagers/Renderers bleiben zu beobachten.');
if (directFocus.length > 10) p2.push('Direkte Fokusaufrufe ausserhalb des FocusManagers sollten in spaeteren Cleanup-Schritten weiter reduziert werden.');
if (directGlobalListeners.length > 6) p2.push('Direkte globale Listener bestehen weiter, sind aber ueber 28C inventarisiert.');

const reportScores = loadedReports.map(({ data }) => Number(data.score || data.summary?.score || 0)).filter(Boolean);
const capabilityChecks = Object.values(capabilities).flatMap(group => Object.values(group));
const capabilityScore = capabilityChecks.length ? capabilityChecks.filter(Boolean).length / capabilityChecks.length : 0;
const avgReportScore = reportScores.length ? reportScores.reduce((a, b) => a + b, 0) / reportScores.length : 0;
let score = Math.min(5, (avgReportScore * 0.55) + (capabilityScore * 5 * 0.45));
if (p0.length) score = Math.min(score, 3.2);
else if (p1.length) score = Math.min(score, 4.25);
score = Number(score.toFixed(2));

const report = {
  phase: '28D',
  title: 'Platform Verification',
  score,
  grade: score >= 4.5 ? 'A' : score >= 4.0 ? 'B' : 'C',
  p0,
  p1,
  p2,
  summary: {
    verifiedReports: loadedReports.length,
    missingReports,
    capabilityScore: Number((capabilityScore * 5).toFixed(2)),
    averagePrerequisiteScore: Number(avgReportScore.toFixed(2)),
    directScrollCalls: directWindowScroll.length,
    directFocusCalls: directFocus.length,
    directGlobalListeners: directGlobalListeners.length
  },
  capabilities,
  findings: [
    {
      id: 'VER-28D-001',
      priority: p0.length ? 'P0' : 'closed',
      area: 'Phase 28 Integrity',
      finding: 'Alle Scroll-, Fokus- und Event-Artefakte aus Phase 28A bis 28C sind als Verifikationsgrundlage vorhanden.'
    },
    {
      id: 'VER-28D-002',
      priority: p1.length ? 'P1' : 'closed',
      area: 'Platform Hardening Services',
      finding: 'ScrollManager, FocusManager und EventManager bieten die benoetigten Plattformfaehigkeiten fuer UX-Stabilitaet.'
    },
    {
      id: 'VER-28D-003',
      priority: p2.length ? 'P2' : 'closed',
      area: 'Legacy Surface',
      finding: 'Verbleibende direkte Aufrufe sind nicht release-blockierend, sollten aber bei zukuenftigen Infrastruktur-Cleanups weiter reduziert werden.'
    }
  ],
  samples: {
    directScrollCalls: directWindowScroll.slice(0, 10),
    directFocusCalls: directFocus.slice(0, 10),
    directGlobalListeners: directGlobalListeners.slice(0, 10)
  }
};

fs.writeFileSync(path.join(root, 'platform-verification-phase28d.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
