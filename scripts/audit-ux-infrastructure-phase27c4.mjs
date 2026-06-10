import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const modulesRoot = join(root, 'js', 'modules');
const coreRoot = join(root, 'js', 'core');

const auditAreas = [
  'focusNavigation',
  'enterTabCommit',
  'scrollStability',
  'savedRecordUx',
  'liveUpdateSideEffects',
  'mobileKeyboardGuards'
];

function listFiles(dir, predicate = () => true) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path, predicate);
    return predicate(path) ? [path] : [];
  });
}

function readMaybe(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function grade(score) {
  if (score >= 4.5) return 'A';
  if (score >= 3.8) return 'B';
  if (score >= 3.0) return 'C';
  if (score >= 2.0) return 'D';
  return 'F';
}

function riskFromGrade(area, areaGrade) {
  if (areaGrade === 'F' || areaGrade === 'D') return 'P1';
  if (areaGrade === 'C') return ['focusNavigation', 'scrollStability', 'enterTabCommit'].includes(area) ? 'P1' : 'P2';
  if (areaGrade === 'B') return ['focusNavigation', 'scrollStability'].includes(area) ? 'P1' : 'P2';
  return null;
}

function actionFor(area) {
  return {
    focusNavigation: 'Fokusnavigation als expliziten Plattformvertrag dokumentieren und Modul-Sonderlogik schrittweise auf die zentrale Event Pipeline reduzieren.',
    enterTabCommit: 'Enter/Tab-Commit-Verhalten weiter ueber die zentrale Event Pipeline absichern; keine lokalen Sonderpfade fuer Input-Bestaetigung einfuehren.',
    scrollStability: 'Scroll-Stabilitaet bei Saved-Record-Auswahl, Live-Updates und Modulwechseln weiter zentral ueber scrollManager/preserveViewport erzwingen.',
    savedRecordUx: 'Saved-Record-Auswahl, Expand/Collapse und Update/Delete als einheitliches UX-Verhalten ueber alle Module kontraktieren.',
    liveUpdateSideEffects: 'Live-Updates muessen State, Results, Dynamic Sections und Sonderrenderer aktualisieren, ohne Fokus oder Scrollposition zu verlieren.',
    mobileKeyboardGuards: 'Mobile Keyboard Guards fuer Selects, Fokusrestore und Bottom Navigation in Regressionstests halten.'
  }[area];
}

const moduleDirs = existsSync(modulesRoot)
  ? readdirSync(modulesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  : [];

const coreFiles = Object.fromEntries(
  listFiles(coreRoot, file => file.endsWith('.js')).map(file => [relative(coreRoot, file), readMaybe(file)])
);
const coreCombined = Object.values(coreFiles).join('\n');

const coreEvidence = {
  eventPipelineExists: existsSync(join(coreRoot, 'eventPipeline.js')),
  scrollManagerExists: existsSync(join(coreRoot, 'scrollManager.js')),
  domUpdateExists: existsSync(join(coreRoot, 'domUpdate.js')),
  renderCoordinatorExists: existsSync(join(coreRoot, 'renderCoordinator.js')),
  savedRecordsExists: existsSync(join(coreRoot, 'savedRecords.js')),
  moduleRuntimeExists: existsSync(join(coreRoot, 'moduleRuntime.js')),
  focusNextSignals: countMatches(coreCombined, /focusNextPlatformField|focus\(\{\s*preventScroll:\s*true\s*\}\)|preventScroll/g),
  enterCommitSignals: countMatches(coreCombined, /field:enter|event\.key\s*!==\s*['"]Enter['"]|event\.key\s*===\s*['"]Enter['"]/g),
  tabSignals: countMatches(coreCombined, /Tab|tabindex|querySelectorAll\([^)]*(input|select|textarea|button)/gi),
  scrollPreserveSignals: countMatches(coreCombined, /preserveScroll|preserveViewport|preserveRendererViewport|SCROLL_STABILITY_PRESETS|scrollY|scrollTo/g),
  savedRecordScrollSignals: countMatches(coreCombined, /preserveSavedRecordScroll|savedRecord|data-saved|record/g),
  mobileKeyboardSignals: countMatches(coreCombined, /keyboard|select\[data-field\]|releaseKeyboardNavigationLock|blurActive|focusout|mobile/gi),
  globalListenerSignals: countMatches(coreCombined, /window\.addEventListener|document\.addEventListener/g)
};

const moduleEvidence = moduleDirs.map(moduleName => {
  const dir = join(modulesRoot, moduleName);
  const files = Object.fromEntries(
    listFiles(dir, file => file.endsWith('.js')).map(file => [relative(dir, file), readMaybe(file)])
  );
  const combined = Object.values(files).join('\n');
  const controller = files['controller.js'] || '';
  const index = files['index.js'] || '';
  const view = files['view.js'] || '';
  const renderPipeline = files['renderPipeline.js'] || '';

  const focusSignals = countMatches(combined, /focus\(|focusin|focusout|preventScroll|releaseKeyboardNavigationLock/g);
  const localEnterHandlers = countMatches(controller + index + view, /keydown|event\.key\s*===\s*['"]Enter['"]|event\.key\s*!==\s*['"]Enter['"]/g);
  const localTabHandlers = countMatches(controller + index + view, /event\.key\s*===\s*['"]Tab['"]|event\.key\s*!==\s*['"]Tab['"]|shiftKey/g);
  const directScrollCalls = countMatches(combined, /scrollTo\(|scrollIntoView\(|scrollTop\s*=|location\.hash/g);
  const scrollManagerUse = countMatches(combined, /preserveScroll|preserveActionScroll|preserveSavedRecordScroll|preserveViewport/g);
  const savedRecordSignals = countMatches(combined, /savedRecord|savedRecords|saved[A-Z]|active[A-Za-z]*Id|expanded[A-Za-z]*Id|make[A-Za-z]*Record|save[A-Za-z]*\(/g);
  const savedRecordUxSignals = countMatches(combined, /expanded[A-Za-z]*Id|data-saved|record|Update|Loeschen|Löschen|Aktualisieren|select[A-Za-z]*Record/g);
  const liveUpdateSignals = countMatches(combined, /data-commit="immediate"|commit:\s*['"]immediate['"]|updateDynamic|renderPipeline|renderResults|renderDynamic|renderDiagram|notify:\s*true/g);
  const directDomMutationSignals = countMatches(controller + index, /\.innerHTML\s*=|replaceChildren\(|insertAdjacentHTML\(|\.textContent\s*=/g);
  const globalListenerSignals = countMatches(combined, /window\.addEventListener|document\.addEventListener/g);
  const hasRenderPipeline = Boolean(renderPipeline) || /renderPipeline|updateDynamic|renderResults|renderDynamic|renderDiagram/i.test(combined);
  const hasComplexUx = /saved|record|process|line|area|surface|fixture|dynamic|diagram|chart|collection/i.test(combined);

  let moduleScore = 4.2;
  if (hasRenderPipeline) moduleScore += 0.25;
  if (scrollManagerUse) moduleScore += 0.2;
  if (!directScrollCalls) moduleScore += 0.15;
  if (!directDomMutationSignals) moduleScore += 0.15;
  if (liveUpdateSignals) moduleScore += 0.15;
  if (savedRecordSignals && savedRecordUxSignals) moduleScore += 0.1;
  if (localEnterHandlers > 4) moduleScore -= Math.min(0.45, localEnterHandlers * 0.05);
  if (localTabHandlers > 2) moduleScore -= Math.min(0.3, localTabHandlers * 0.06);
  if (directScrollCalls) moduleScore -= Math.min(0.55, directScrollCalls * 0.12);
  if (globalListenerSignals) moduleScore -= Math.min(0.35, globalListenerSignals * 0.08);
  if (hasComplexUx && !scrollManagerUse && ['rainwater', 'wastewater'].includes(moduleName)) moduleScore -= 0.25;
  if (moduleName === 'drinking-water' && localEnterHandlers > 0) moduleScore -= 0.15;
  if (moduleName === 'hx-diagram' && hasRenderPipeline && liveUpdateSignals) moduleScore += 0.25;

  return {
    module: moduleName,
    score: Math.max(1, Math.min(5, Number(moduleScore.toFixed(2)))),
    files: Object.keys(files).sort(),
    focusSignals,
    localEnterHandlers,
    localTabHandlers,
    directScrollCalls,
    scrollManagerUse,
    savedRecordSignals,
    savedRecordUxSignals,
    liveUpdateSignals,
    directDomMutationSignals,
    globalListenerSignals,
    hasRenderPipeline,
    hasComplexUx
  };
});

function average(items, selector) {
  return items.length ? items.reduce((sum, item) => sum + selector(item), 0) / items.length : 0;
}

const modulesWithDirectScroll = moduleEvidence.filter(item => item.directScrollCalls > 0);
const modulesUsingScrollManager = moduleEvidence.filter(item => item.scrollManagerUse > 0);
const modulesWithLocalEnterHandlers = moduleEvidence.filter(item => item.localEnterHandlers > 2);
const modulesWithLocalTabHandlers = moduleEvidence.filter(item => item.localTabHandlers > 0);
const modulesWithDirectDomMutation = moduleEvidence.filter(item => item.directDomMutationSignals > 0);
const complexSavedModules = moduleEvidence.filter(item => item.savedRecordSignals > 5);
const savedModulesWithUxSignals = complexSavedModules.filter(item => item.savedRecordUxSignals > 3);
const liveUpdateModules = moduleEvidence.filter(item => item.liveUpdateSignals > 0);
const modulesWithGlobalListeners = moduleEvidence.filter(item => item.globalListenerSignals > 0);

function scoreFocusNavigation() {
  let score = 4.15;
  if (coreEvidence.eventPipelineExists) score += 0.25;
  if (coreEvidence.focusNextSignals >= 5) score += 0.2;
  if (modulesWithLocalEnterHandlers.length > 2) score -= Math.min(0.55, modulesWithLocalEnterHandlers.length * 0.12);
  if (modulesWithLocalTabHandlers.length) score -= Math.min(0.35, modulesWithLocalTabHandlers.length * 0.08);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreEnterTabCommit() {
  let score = 4.2;
  if (coreEvidence.enterCommitSignals >= 4) score += 0.25;
  if (coreEvidence.tabSignals >= 1) score += 0.1;
  if (modulesWithLocalEnterHandlers.length > 3) score -= Math.min(0.45, modulesWithLocalEnterHandlers.length * 0.08);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreScrollStability() {
  let score = 4.0;
  if (coreEvidence.scrollManagerExists) score += 0.3;
  if (coreEvidence.scrollPreserveSignals >= 8) score += 0.2;
  if (coreEvidence.savedRecordScrollSignals >= 4) score += 0.1;
  if (modulesWithDirectScroll.length) score -= Math.min(0.65, modulesWithDirectScroll.length * 0.16);
  if (modulesUsingScrollManager.length < 3) score -= 0.2;
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreSavedRecordUx() {
  let score = 4.15;
  if (coreEvidence.savedRecordsExists) score += 0.25;
  if (complexSavedModules.length && savedModulesWithUxSignals.length === complexSavedModules.length) score += 0.2;
  const gaps = complexSavedModules.length - savedModulesWithUxSignals.length;
  if (gaps > 0) score -= Math.min(0.45, gaps * 0.12);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreLiveUpdateSideEffects() {
  let score = 4.05;
  if (coreEvidence.renderCoordinatorExists) score += 0.2;
  if (liveUpdateModules.length >= 5) score += 0.25;
  if (modulesWithDirectDomMutation.length) score -= Math.min(0.55, modulesWithDirectDomMutation.length * 0.12);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreMobileKeyboardGuards() {
  let score = 4.15;
  if (coreEvidence.mobileKeyboardSignals >= 5) score += 0.25;
  if (coreEvidence.focusNextSignals >= 8) score += 0.1;
  if (modulesWithGlobalListeners.length) score -= Math.min(0.35, modulesWithGlobalListeners.length * 0.08);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

const scores = {
  focusNavigation: scoreFocusNavigation(),
  enterTabCommit: scoreEnterTabCommit(),
  scrollStability: scoreScrollStability(),
  savedRecordUx: scoreSavedRecordUx(),
  liveUpdateSideEffects: scoreLiveUpdateSideEffects(),
  mobileKeyboardGuards: scoreMobileKeyboardGuards()
};

const scorecard = Object.fromEntries(Object.entries(scores).map(([area, score]) => [area, {
  score,
  grade: grade(score),
  risk: riskFromGrade(area, grade(score)),
  action: actionFor(area)
}]));

const findings = Object.entries(scorecard)
  .filter(([, item]) => item.risk)
  .map(([area, item]) => ({ area, ...item }));

const overallScore = Number(average(Object.values(scores), item => item).toFixed(2));
const overallGrade = grade(overallScore);

const report = {
  phase: '27C.4',
  name: 'UX Infrastructure Audit',
  generatedAt: new Date().toISOString(),
  overallScore,
  overallGrade,
  scores,
  scorecard,
  findings,
  evidence: {
    coreEvidence,
    moduleEvidence,
    focusNavigation: {
      modulesWithLocalEnterHandlers: modulesWithLocalEnterHandlers.map(item => item.module),
      modulesWithLocalTabHandlers: modulesWithLocalTabHandlers.map(item => item.module)
    },
    scrollStability: {
      modulesWithDirectScroll: modulesWithDirectScroll.map(item => item.module),
      modulesUsingScrollManager: modulesUsingScrollManager.map(item => item.module)
    },
    savedRecordUx: {
      complexSavedModules: complexSavedModules.map(item => item.module),
      savedModulesWithUxSignals: savedModulesWithUxSignals.map(item => item.module)
    },
    liveUpdateSideEffects: {
      liveUpdateModules: liveUpdateModules.map(item => item.module),
      modulesWithDirectDomMutation: modulesWithDirectDomMutation.map(item => item.module)
    },
    mobileKeyboardGuards: {
      modulesWithGlobalListeners: modulesWithGlobalListeners.map(item => item.module),
      mobileKeyboardSignals: coreEvidence.mobileKeyboardSignals
    }
  },
  executiveSummary: {
    status: overallScore >= 4.2 ? 'ux-infrastructure-stable' : overallScore >= 3.8 ? 'ux-infrastructure-watch' : 'ux-infrastructure-risk',
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    p3: findings.filter(item => item.risk === 'P3')
  }
};

writeFileSync(join(root, 'platform-ux-infrastructure-audit-phase27c4.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Phase 27C.4 UX Infrastructure Audit: ${overallScore} / 5 (${overallGrade})`);
console.log(`P0: ${report.executiveSummary.p0.length}, P1: ${report.executiveSummary.p1.length}, P2: ${report.executiveSummary.p2.length}`);
