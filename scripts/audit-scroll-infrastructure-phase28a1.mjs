import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const jsRoot = join(root, 'js');
const coreRoot = join(jsRoot, 'core');
const modulesRoot = join(jsRoot, 'modules');

function listFiles(dir, predicate = () => true) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path, predicate);
    return predicate(path) ? [path] : [];
  });
}

function read(path) { return readFileSync(path, 'utf8'); }
function count(text, regex) { return [...text.matchAll(regex)].length; }
function grade(score) {
  if (score >= 4.5) return 'A';
  if (score >= 3.8) return 'B';
  if (score >= 3.0) return 'C';
  if (score >= 2.0) return 'D';
  return 'F';
}

const scrollPatterns = [
  { key: 'windowScrollTo', regex: /\bwindow\.scrollTo\s*\(/g, risk: 'controlled-scroll' },
  { key: 'elementScrollTo', regex: /\.scrollTo\s*\(/g, risk: 'controlled-scroll' },
  { key: 'scrollIntoView', regex: /\.scrollIntoView\s*\(/g, risk: 'jump-risk' },
  { key: 'scrollTopWrite', regex: /\.scrollTop\s*=/g, risk: 'jump-risk' },
  { key: 'scrollYRead', regex: /\bwindow\.scrollY\b|documentElement\.scrollTop/g, risk: 'snapshot' },
  { key: 'hashNavigation', regex: /\blocation\.hash\b|\bwindow\.location\.hash\b/g, risk: 'navigation-scroll' }
];

const focusPatterns = [
  { key: 'focusCall', regex: /\.focus\s*\(/g },
  { key: 'preventScrollFocus', regex: /focus\s*\(\s*\{\s*preventScroll\s*:\s*true\s*\}/g },
  { key: 'activeElement', regex: /document\.activeElement/g }
];

const files = listFiles(jsRoot, file => file.endsWith('.js') || file.endsWith('.mjs'));
const fileEvidence = files.map(file => {
  const text = read(file);
  const relativePath = relative(root, file);
  const scroll = Object.fromEntries(scrollPatterns.map(pattern => [pattern.key, count(text, pattern.regex)]));
  const focus = Object.fromEntries(focusPatterns.map(pattern => [pattern.key, count(text, pattern.regex)]));
  const preserveSignals = count(text, /preserveScroll|preserveActionScroll|preserveSavedRecordScroll|preserveViewport|preserveRendererViewport|SCROLL_STABILITY_PRESETS/g);
  const scrollManagerSignals = count(text, /scrollManager|preserveScroll|preserveActionScroll|preserveSavedRecordScroll/g);
  const directScrollWrites = scroll.windowScrollTo + scroll.scrollIntoView + scroll.scrollTopWrite + Math.max(0, scroll.elementScrollTo - scroll.windowScrollTo);
  const focusWithoutPreventScroll = Math.max(0, focus.focusCall - focus.preventScrollFocus);
  const layer = relativePath.startsWith('js/core/') ? 'core' : relativePath.startsWith('js/modules/') ? 'module' : 'other';
  const module = relativePath.startsWith('js/modules/') ? relativePath.split('/')[2] : null;
  return {
    path: relativePath,
    layer,
    module,
    scroll,
    focus,
    preserveSignals,
    scrollManagerSignals,
    directScrollWrites,
    focusWithoutPreventScroll,
    needs28A2Review: directScrollWrites > 0 || focusWithoutPreventScroll > 0
  };
}).filter(item => item.directScrollWrites || item.focus.focusCall || item.scroll.scrollYRead || item.preserveSignals || item.scroll.hashNavigation);

const byModule = {};
for (const item of fileEvidence.filter(item => item.module)) {
  byModule[item.module] ||= {
    module: item.module,
    files: 0,
    directScrollWrites: 0,
    focusCalls: 0,
    preventScrollFocus: 0,
    focusWithoutPreventScroll: 0,
    preserveSignals: 0,
    scrollManagerSignals: 0,
    hashNavigation: 0
  };
  const bucket = byModule[item.module];
  bucket.files += 1;
  bucket.directScrollWrites += item.directScrollWrites;
  bucket.focusCalls += item.focus.focusCall;
  bucket.preventScrollFocus += item.focus.preventScrollFocus;
  bucket.focusWithoutPreventScroll += item.focusWithoutPreventScroll;
  bucket.preserveSignals += item.preserveSignals;
  bucket.scrollManagerSignals += item.scrollManagerSignals;
  bucket.hashNavigation += item.scroll.hashNavigation;
}

const moduleEvidence = Object.values(byModule).sort((a, b) => a.module.localeCompare(b.module));
const directScrollFiles = fileEvidence.filter(item => item.directScrollWrites > 0);
const focusRiskFiles = fileEvidence.filter(item => item.focusWithoutPreventScroll > 0);
const hashNavigationFiles = fileEvidence.filter(item => item.scroll.hashNavigation > 0);
const modulesWithDirectScroll = moduleEvidence.filter(item => item.directScrollWrites > 0);
const modulesWithoutScrollManagerUse = moduleEvidence.filter(item => item.directScrollWrites > 0 && item.scrollManagerSignals === 0);

const coreScrollManagerPath = join(coreRoot, 'scrollManager.js');
const coreScrollManager = existsSync(coreScrollManagerPath) ? read(coreScrollManagerPath) : '';
const coreEvidence = {
  scrollManagerExists: existsSync(coreScrollManagerPath),
  rendererPreserveViewportExists: existsSync(join(coreRoot, 'renderer.js')) && /preserveViewport/.test(read(join(coreRoot, 'renderer.js'))),
  scrollManagerExportsPreserveScroll: /export function preserveScroll/.test(coreScrollManager),
  scrollManagerExportsActionPreset: /export function preserveActionScroll/.test(coreScrollManager),
  scrollManagerExportsSavedRecordPreset: /export function preserveSavedRecordScroll/.test(coreScrollManager),
  scrollPresets: count(coreScrollManager, /SCROLL_STABILITY_PRESETS/g),
  directCoreScrollFiles: directScrollFiles.filter(item => item.layer === 'core').map(item => item.path),
  directModuleScrollFiles: directScrollFiles.filter(item => item.layer === 'module').map(item => item.path)
};

let score = 4.2;
if (coreEvidence.scrollManagerExists) score += 0.25;
if (coreEvidence.scrollManagerExportsPreserveScroll) score += 0.15;
if (coreEvidence.scrollManagerExportsSavedRecordPreset) score += 0.15;
if (coreEvidence.rendererPreserveViewportExists) score += 0.1;
if (modulesWithDirectScroll.length) score -= Math.min(0.45, modulesWithDirectScroll.length * 0.12);
if (modulesWithoutScrollManagerUse.length) score -= Math.min(0.35, modulesWithoutScrollManagerUse.length * 0.1);
if (directScrollFiles.length > 8) score -= 0.15;
score = Math.max(1, Math.min(5, Number(score.toFixed(2))));

const findings = [];
if (modulesWithDirectScroll.length) {
  findings.push({
    area: 'moduleDirectScrollCalls',
    risk: 'P1',
    score: 3.9,
    grade: 'B',
    action: 'Direkte Modul-Scrollschreibzugriffe in 28A.2 ueber den PlatformScrollManager kapseln.',
    evidence: modulesWithDirectScroll.map(item => ({ module: item.module, directScrollWrites: item.directScrollWrites, scrollManagerSignals: item.scrollManagerSignals }))
  });
}
if (focusRiskFiles.length) {
  findings.push({
    area: 'focusWithoutPreventScroll',
    risk: 'P2',
    score: 4.1,
    grade: 'B',
    action: 'Fokusaufrufe ohne preventScroll in 28B ueber den Focus Service standardisieren; scrollrelevante Faelle in 28A.2 pruefen.',
    evidence: focusRiskFiles.map(item => item.path)
  });
}
if (hashNavigationFiles.length) {
  findings.push({
    area: 'hashNavigationScrollRisk',
    risk: 'P2',
    score: 4.2,
    grade: 'B',
    action: 'Hash- und Deep-Link-Navigation gegen unbeabsichtigte Scrollspruenge absichern.',
    evidence: hashNavigationFiles.map(item => item.path)
  });
}

const designContract = {
  serviceName: 'PlatformScrollManager',
  targetFile: 'js/core/scrollManager.js',
  phase28A2Api: [
    'capturePosition(scope = window)',
    'restorePosition(snapshot, options)',
    'freeze(reason)',
    'unfreeze(token)',
    'runWithoutScrollJump(action, options)',
    'preserveSavedRecordScroll(action, options)',
    'preserveModuleSwitchScroll(action, options)'
  ],
  nonGoalsFor28A1: [
    'Keine Runtime-Logik aendern',
    'Keine Modul-Controller umbauen',
    'Keine bestehenden Scroll-Workarounds entfernen'
  ],
  acceptanceFor28A2: [
    'Record-Auswahl verursacht keinen Scrollsprung',
    'Record-Abwahl verursacht keinen Scrollsprung',
    'Live-Render bleibt scrollstabil',
    'Modulwechsel kann definierte Scrollstrategie anwenden',
    'Direkte Scrollschreibzugriffe in Modulen sind inventarisiert oder gekapselt'
  ]
};

const report = {
  phase: '28A.1',
  name: 'Scroll Audit & Scroll Manager Design',
  generatedAt: new Date().toISOString(),
  overallScore: score,
  overallGrade: grade(score),
  executiveSummary: {
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    p3: [],
    conclusion: 'Die bestehende Scroll-Infrastruktur ist vorhanden, aber direkte Scroll-Schreibzugriffe muessen in 28A.2 konsequent ueber einen expliziten PlatformScrollManager-Vertrag gefuehrt werden.'
  },
  totals: {
    scannedFiles: files.length,
    relevantFiles: fileEvidence.length,
    directScrollFiles: directScrollFiles.length,
    focusRiskFiles: focusRiskFiles.length,
    hashNavigationFiles: hashNavigationFiles.length,
    modulesWithDirectScroll: modulesWithDirectScroll.length,
    modulesWithoutScrollManagerUse: modulesWithoutScrollManagerUse.length
  },
  coreEvidence,
  moduleEvidence,
  fileEvidence,
  findings,
  designContract
};

writeFileSync(join(root, 'platform-scroll-audit-phase28a1.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 28A.1 scroll audit completed: ${report.overallScore} (${report.overallGrade})`);
console.log(`Direct scroll files: ${directScrollFiles.length}; modules with direct scroll: ${modulesWithDirectScroll.length}`);
