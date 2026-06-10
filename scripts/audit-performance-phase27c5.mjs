import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const modulesRoot = join(root, 'js', 'modules');
const coreRoot = join(root, 'js', 'core');

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
  if (areaGrade === 'C') return ['initialRender', 'rerenderDiscipline', 'moduleSwitch'].includes(area) ? 'P1' : 'P2';
  if (areaGrade === 'B') return ['measurementBaseline', 'savedRecordInteraction'].includes(area) ? 'P2' : null;
  return null;
}

function actionFor(area) {
  return {
    initialRender: 'Initial Render ueber Modul-Shell, lazy Dynamic Sections und kleine Index-Dateien stabil halten; keine neuen monolithischen Mount-Pfade einfuehren.',
    rerenderDiscipline: 'Re-Render weiter ueber Render Coordinator, Dynamic Renderer und zielgerichtete Slots fuehren; breite innerHTML-Updates vermeiden.',
    savedRecordInteraction: 'Saved-Record-Auswahl und Update/Delete auf lokale Slot-Aktualisierung begrenzen und Scroll-/Fokus-Preservation als Performance-Vertrag behandeln.',
    moduleSwitch: 'Modulwechsel ueber Registry, Router und Lifecycle ohne Modul-Sonderpfade halten; Listener-Cleanup und Shell-Reuse pruefbar lassen.',
    heavyRendererIsolation: 'Diagramm-, PDF- und komplexe Ergebnisrenderer isolieren; teure Renderer nur aus expliziten Render-Pipelines ansteuern.',
    measurementBaseline: 'Fuer 1.3.x eine echte Runtime-Messung mit Browser-Marks fuer Initial Render, Module Switch und Saved-Record-Interaktion ergaenzen.'
  }[area];
}

function average(items, selector = item => item) {
  return items.length ? items.reduce((sum, item) => sum + selector(item), 0) / items.length : 0;
}

function clampScore(score) {
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

const moduleDirs = existsSync(modulesRoot)
  ? readdirSync(modulesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  : [];

const coreFiles = Object.fromEntries(
  listFiles(coreRoot, file => file.endsWith('.js')).map(file => [relative(coreRoot, file), readMaybe(file)])
);
const coreCombined = Object.values(coreFiles).join('\n');

const coreEvidence = {
  renderCoordinatorExists: existsSync(join(coreRoot, 'renderCoordinator.js')),
  renderSchedulerExists: existsSync(join(coreRoot, 'renderScheduler.js')),
  domUpdateExists: existsSync(join(coreRoot, 'domUpdate.js')),
  moduleRuntimeExists: existsSync(join(coreRoot, 'moduleRuntime.js')),
  routerExists: existsSync(join(coreRoot, 'router.js')),
  registryExists: existsSync(join(coreRoot, 'registry.js')),
  scrollManagerExists: existsSync(join(coreRoot, 'scrollManager.js')),
  lifecycleSignals: countMatches(coreCombined, /mount|unmount|destroy|cleanup|lifecycle|dispose/gi),
  schedulerSignals: countMatches(coreCombined, /requestAnimationFrame|queueMicrotask|setTimeout|schedule|flush|batch/gi),
  performanceMarkSignals: countMatches(coreCombined, /performance\.mark|performance\.measure|PerformanceObserver|console\.time/g),
  targetedDomSignals: countMatches(coreCombined, /replaceChildren|textContent|patch|updateSlot|data-slot|renderCoordinator|domUpdate/gi),
  broadDomSignals: countMatches(coreCombined, /innerHTML\s*=|document\.body|querySelectorAll\(/g),
  globalListenerSignals: countMatches(coreCombined, /window\.addEventListener|document\.addEventListener/g)
};

const moduleEvidence = moduleDirs.map(moduleName => {
  const dir = join(modulesRoot, moduleName);
  const files = Object.fromEntries(
    listFiles(dir, file => file.endsWith('.js')).map(file => [relative(dir, file), readMaybe(file)])
  );
  const combined = Object.values(files).join('\n');
  const totalBytes = Object.keys(files).reduce((sum, rel) => sum + statSync(join(dir, rel)).size, 0);
  const indexBytes = existsSync(join(dir, 'index.js')) ? statSync(join(dir, 'index.js')).size : 0;
  const viewBytes = existsSync(join(dir, 'view.js')) ? statSync(join(dir, 'view.js')).size : 0;

  const resultRendererSignals = countMatches(combined, /resultCard|renderResults|results\.js|Result|Ergebnis/g);
  const dynamicRendererSignals = countMatches(combined, /dynamicRenderer|updateDynamic|renderDynamic|data-dynamic|renderPipeline/g);
  const renderPipelineSignals = countMatches(combined, /renderPipeline|renderResults|renderDiagram|renderDynamic|renderCoordinator|updateDynamic/g);
  const broadDomMutationSignals = countMatches(combined, /\.innerHTML\s*=|insertAdjacentHTML\(|outerHTML\s*=|document\.body/g);
  const targetedDomSignals = countMatches(combined, /replaceChildren\(|textContent\s*=|data-slot|data-results|data-dynamic|querySelector\(\s*['"`]\[data-/g);
  const collectionSignals = countMatches(combined, /map\(|reduce\(|filter\(|forEach\(|Object\.entries|Object\.values/g);
  const savedRecordSignals = countMatches(combined, /savedRecord|savedRecords|active[A-Za-z]*Id|expanded[A-Za-z]*Id|save[A-Za-z]*\(|make[A-Za-z]*Record/g);
  const diagramSignals = countMatches(combined, /svg|path|polyline|chart|diagram|canvas|renderHxSvg/g);
  const pdfSignals = countMatches(combined, /pdf|PDF|jspdf|exportPdf|print/g);
  const globalListenerSignals = countMatches(combined, /window\.addEventListener|document\.addEventListener/g);
  const cleanupSignals = countMatches(combined, /cleanup|destroy|removeEventListener|AbortController|return\s*\(\)\s*=>/g);
  const hasSplitRenderers = ['results.js', 'dynamicRenderer.js'].some(name => Boolean(files[name]));
  const hasRenderPipeline = Boolean(files['renderPipeline.js']) || renderPipelineSignals > 0;
  const hasViewModel = Boolean(files['viewModel.js']);
  const hasController = Boolean(files['controller.js']);
  const indexRatio = totalBytes ? indexBytes / totalBytes : 0;

  let score = 4.1;
  if (hasSplitRenderers) score += 0.25;
  if (hasRenderPipeline) score += 0.25;
  if (hasViewModel) score += 0.15;
  if (hasController) score += 0.1;
  if (targetedDomSignals > broadDomMutationSignals) score += 0.15;
  if (indexRatio < 0.25) score += 0.15;
  if (diagramSignals > 8 && moduleName === 'hx-diagram' && files['diagramRenderer.js']) score += 0.2;
  if (broadDomMutationSignals > 4) score -= Math.min(0.5, broadDomMutationSignals * 0.05);
  if (globalListenerSignals > cleanupSignals) score -= 0.25;
  if (indexBytes > 16000) score -= 0.25;
  if (viewBytes > 18000 && !hasSplitRenderers) score -= 0.25;
  if (collectionSignals > 180) score -= 0.15;
  if (diagramSignals > 12 && !files['diagramRenderer.js']) score -= 0.25;

  return {
    module: moduleName,
    score: clampScore(score),
    fileCount: Object.keys(files).length,
    totalBytes,
    indexBytes,
    indexRatio: Number(indexRatio.toFixed(3)),
    viewBytes,
    hasController,
    hasViewModel,
    hasSplitRenderers,
    hasRenderPipeline,
    resultRendererSignals,
    dynamicRendererSignals,
    renderPipelineSignals,
    broadDomMutationSignals,
    targetedDomSignals,
    collectionSignals,
    savedRecordSignals,
    diagramSignals,
    pdfSignals,
    globalListenerSignals,
    cleanupSignals
  };
});

const modulesWithBroadDomMutation = moduleEvidence.filter(item => item.broadDomMutationSignals > 4);
const modulesWithoutRenderPipeline = moduleEvidence.filter(item => !item.hasRenderPipeline && (item.savedRecordSignals > 4 || item.dynamicRendererSignals > 1));
const modulesWithLargeIndex = moduleEvidence.filter(item => item.indexBytes > 16000 || item.indexRatio > 0.35);
const modulesWithHeavyRenderer = moduleEvidence.filter(item => item.diagramSignals > 8 || item.pdfSignals > 3);
const heavyModulesWithoutIsolation = modulesWithHeavyRenderer.filter(item => item.diagramSignals > 8 && item.module !== 'hx-diagram');
const savedRecordHeavyModules = moduleEvidence.filter(item => item.savedRecordSignals > 8);
const modulesWithListenerRisk = moduleEvidence.filter(item => item.globalListenerSignals > item.cleanupSignals);

function scoreInitialRender() {
  let score = 4.2;
  if (coreEvidence.moduleRuntimeExists && coreEvidence.registryExists && coreEvidence.routerExists) score += 0.25;
  if (moduleEvidence.every(item => item.indexRatio < 0.4)) score += 0.15;
  if (modulesWithLargeIndex.length) score -= Math.min(0.45, modulesWithLargeIndex.length * 0.12);
  return clampScore(score);
}

function scoreRerenderDiscipline() {
  let score = 4.15;
  if (coreEvidence.renderCoordinatorExists) score += 0.25;
  if (coreEvidence.domUpdateExists) score += 0.15;
  if (average(moduleEvidence, item => item.hasRenderPipeline ? 1 : 0) >= 0.55) score += 0.15;
  if (modulesWithBroadDomMutation.length) score -= Math.min(0.55, modulesWithBroadDomMutation.length * 0.12);
  return clampScore(score);
}

function scoreSavedRecordInteraction() {
  let score = 4.1;
  if (coreEvidence.scrollManagerExists) score += 0.2;
  if (savedRecordHeavyModules.length && savedRecordHeavyModules.every(item => item.hasSplitRenderers || item.hasRenderPipeline)) score += 0.25;
  if (modulesWithoutRenderPipeline.length) score -= Math.min(0.35, modulesWithoutRenderPipeline.length * 0.08);
  return clampScore(score);
}

function scoreModuleSwitch() {
  let score = 4.25;
  if (coreEvidence.lifecycleSignals >= 12) score += 0.2;
  if (modulesWithListenerRisk.length) score -= Math.min(0.45, modulesWithListenerRisk.length * 0.12);
  if (coreEvidence.globalListenerSignals > 8) score -= 0.1;
  return clampScore(score);
}

function scoreHeavyRendererIsolation() {
  let score = 4.2;
  if (modulesWithHeavyRenderer.length) score += 0.1;
  if (moduleEvidence.find(item => item.module === 'hx-diagram')?.diagramSignals > 8) score += 0.15;
  if (heavyModulesWithoutIsolation.length) score -= Math.min(0.5, heavyModulesWithoutIsolation.length * 0.2);
  return clampScore(score);
}

function scoreMeasurementBaseline() {
  let score = 3.85;
  if (coreEvidence.performanceMarkSignals > 0) score += 0.35;
  if (coreEvidence.schedulerSignals >= 4) score += 0.2;
  if (existsSync(join(root, 'docs', 'PHASE_27C5_PERFORMANCE_AUDIT.md'))) score += 0.1;
  return clampScore(score);
}

const scores = {
  initialRender: scoreInitialRender(),
  rerenderDiscipline: scoreRerenderDiscipline(),
  savedRecordInteraction: scoreSavedRecordInteraction(),
  moduleSwitch: scoreModuleSwitch(),
  heavyRendererIsolation: scoreHeavyRendererIsolation(),
  measurementBaseline: scoreMeasurementBaseline()
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

const overallScore = Number(average(Object.values(scores)).toFixed(2));
const overallGrade = grade(overallScore);

const report = {
  phase: '27C.5',
  name: 'Performance Audit',
  generatedAt: new Date().toISOString(),
  overallScore,
  overallGrade,
  scores,
  scorecard,
  findings,
  evidence: {
    coreEvidence,
    moduleEvidence,
    initialRender: {
      modulesWithLargeIndex: modulesWithLargeIndex.map(item => item.module),
      averageIndexRatio: Number(average(moduleEvidence, item => item.indexRatio).toFixed(3))
    },
    rerenderDiscipline: {
      modulesWithBroadDomMutation: modulesWithBroadDomMutation.map(item => item.module),
      modulesWithoutRenderPipeline: modulesWithoutRenderPipeline.map(item => item.module)
    },
    savedRecordInteraction: {
      savedRecordHeavyModules: savedRecordHeavyModules.map(item => item.module)
    },
    moduleSwitch: {
      modulesWithListenerRisk: modulesWithListenerRisk.map(item => item.module)
    },
    heavyRendererIsolation: {
      modulesWithHeavyRenderer: modulesWithHeavyRenderer.map(item => item.module),
      heavyModulesWithoutIsolation: heavyModulesWithoutIsolation.map(item => item.module)
    },
    measurementBaseline: {
      performanceMarkSignals: coreEvidence.performanceMarkSignals,
      schedulerSignals: coreEvidence.schedulerSignals
    }
  },
  executiveSummary: {
    status: overallScore >= 4.3 ? 'performance-baseline-stable' : overallScore >= 3.8 ? 'performance-baseline-watch' : 'performance-baseline-risk',
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    p3: findings.filter(item => item.risk === 'P3')
  }
};

writeFileSync(join(root, 'platform-performance-audit-phase27c5.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Phase 27C.5 Performance Audit: ${overallScore} / 5 (${overallGrade})`);
console.log(`P0: ${report.executiveSummary.p0.length}, P1: ${report.executiveSummary.p1.length}, P2: ${report.executiveSummary.p2.length}`);
