import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const modulesRoot = join(root, 'js', 'modules');
const coreRoot = join(root, 'js', 'core');

const auditAreas = [
  'renderPipeline',
  'dynamicRenderer',
  'resultRenderer',
  'diagramRenderer',
  'viewRenderPurity',
  'renderTriggerConsistency'
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
  if (areaGrade === 'C') return ['renderPipeline', 'renderTriggerConsistency', 'viewRenderPurity'].includes(area) ? 'P1' : 'P2';
  if (areaGrade === 'B') return ['renderPipeline', 'renderTriggerConsistency'].includes(area) ? 'P2' : 'P3';
  return null;
}

function actionFor(area) {
  return {
    renderPipeline: 'Render-Orchestrierung je Modul klar nachweisen; langfristig gemeinsame Pipeline-Konvention fuer results, dynamic sections und Sonderrenderer definieren.',
    dynamicRenderer: 'Dynamic Renderer fuer Module mit dynamischen Inseln beibehalten und direkte DOM-Aktualisierungen aus Controller/View entfernen.',
    resultRenderer: 'Result Renderer als einzige Quelle fuer Ergebnis-Markup absichern; Ergebnis-HTML nicht erneut in index/view duplizieren.',
    diagramRenderer: 'Sonderrenderer wie h,x-Diagramm isoliert halten und zukuenftige Diagramm-Module ueber denselben Contract fuehren.',
    viewRenderPurity: 'View-Dateien weiter auf Layout, Shell und Slots reduzieren; Fachlogik/SVG/Table-Rendering auslagern.',
    renderTriggerConsistency: 'Render-Trigger vereinheitlichen: State-Update -> Pipeline/Renderer; keine parallelen manuellen Re-Render-Pfade.'
  }[area];
}

const moduleDirs = existsSync(modulesRoot)
  ? readdirSync(modulesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  : [];

const moduleEvidence = moduleDirs.map(moduleName => {
  const dir = join(modulesRoot, moduleName);
  const files = Object.fromEntries(
    listFiles(dir, file => file.endsWith('.js')).map(file => [relative(dir, file), readMaybe(file)])
  );
  const combined = Object.values(files).join('\n');
  const index = files['index.js'] || '';
  const view = files['view.js'] || '';
  const controller = files['controller.js'] || '';
  const results = files['results.js'] || '';
  const dynamicRenderer = files['dynamicRenderer.js'] || '';
  const renderPipeline = files['renderPipeline.js'] || '';
  const diagramRenderer = files['diagramRenderer.js'] || '';
  const tables = files['tables.js'] || '';

  const renderTerms = countMatches(combined, /render[A-Z][A-Za-z0-9_]*\s*\(/g);
  const manualDomWrites = countMatches(combined, /\.innerHTML\s*=|\.textContent\s*=|insertAdjacentHTML\s*\(|replaceChildren\s*\(/g);
  const controllerDomWrites = countMatches(controller, /\.innerHTML\s*=|\.textContent\s*=|insertAdjacentHTML\s*\(|replaceChildren\s*\(/g);
  const viewLogicSignals = countMatches(view, /calculate|compute|psychrometric|polyline|pathData|segments|resultCard|processPath|JSON\.|localStorage|addEventListener/g);
  const indexRenderSignals = countMatches(index, /innerHTML\s*=|resultCard|render[A-Z][A-Za-z0-9_]*\s*\(|chartCard|processPathCard/g);
  const usesResultRenderer = existsSync(join(dir, 'results.js')) && /export\s+function|export\s+const|result|Card|render/i.test(results);
  const hasDynamicRenderer = existsSync(join(dir, 'dynamicRenderer.js'));
  const hasRenderPipeline = existsSync(join(dir, 'renderPipeline.js')) || /renderPipeline|renderResults|renderDynamic|renderDiagram|scheduleRender|requestRender|updateDynamic/i.test(combined);
  const delegatesToDynamicRenderer = /dynamicRenderer|renderDynamic|updateDynamic|renderPipeline/i.test(index + controller + view);
  const hasDiagramRenderer = existsSync(join(dir, 'diagramRenderer.js'));
  const hasDiagramSignals = /svg|polyline|pathData|diagram|chartCard|Psychrometric|hx/i.test(combined);
  const diagramInView = /<svg|polyline|pathData|chartCard|renderHxSvg|buildStateSegments/i.test(view + index);
  const hasTableRenderer = existsSync(join(dir, 'tables.js')) || /table|thead|tbody|renderTable/i.test(tables + results);
  const rendererFiles = Object.keys(files).filter(file => /results|dynamicRenderer|diagramRenderer|renderPipeline|tables|viewModel|formRenderer/.test(file));

  let moduleScore = 3.4;
  if (usesResultRenderer) moduleScore += 0.45;
  if (existsSync(join(dir, 'view.js'))) moduleScore += 0.25;
  if (existsSync(join(dir, 'viewModel.js'))) moduleScore += 0.25;
  if (hasDynamicRenderer || !/dynamic|saved|record|process|line|area|surface|chart/i.test(combined)) moduleScore += 0.25;
  if (hasRenderPipeline) moduleScore += 0.35;
  if (!controllerDomWrites) moduleScore += 0.25;
  if (viewLogicSignals <= 3) moduleScore += 0.25;
  if (indexRenderSignals <= 2) moduleScore += 0.2;
  if (hasDiagramSignals && !diagramInView) moduleScore += 0.2;
  if (moduleName === 'hx-diagram' && hasDiagramRenderer && existsSync(join(dir, 'renderPipeline.js'))) moduleScore += 0.35;
  if (moduleName === 'rainwater' && !existsSync(join(dir, 'view.js'))) moduleScore -= 0.45;
  if (moduleName === 'wastewater' && !existsSync(join(dir, 'view.js'))) moduleScore -= 0.35;
  if (controllerDomWrites) moduleScore -= Math.min(0.8, controllerDomWrites * 0.1);
  if (viewLogicSignals > 8) moduleScore -= 0.35;
  if (indexRenderSignals > 5) moduleScore -= 0.35;

  return {
    module: moduleName,
    score: Math.max(1, Math.min(5, Number(moduleScore.toFixed(2)))),
    files: Object.keys(files).sort(),
    rendererFiles,
    usesResultRenderer,
    hasDynamicRenderer,
    hasRenderPipeline,
    delegatesToDynamicRenderer,
    hasDiagramRenderer,
    hasDiagramSignals,
    diagramInView,
    hasTableRenderer,
    renderTerms,
    manualDomWrites,
    controllerDomWrites,
    viewLogicSignals,
    indexRenderSignals
  };
});

const coreEvidence = {
  renderCoordinatorExists: existsSync(join(coreRoot, 'renderCoordinator.js')),
  renderSchedulerExists: existsSync(join(coreRoot, 'renderScheduler.js')),
  coreRendererExists: existsSync(join(coreRoot, 'renderer.js')),
  resultRendererExists: existsSync(join(coreRoot, 'resultRenderer.js')),
  domUpdateExists: existsSync(join(coreRoot, 'domUpdate.js')),
  renderCoordinatorSignals: countMatches(readMaybe(join(coreRoot, 'renderCoordinator.js')) + readMaybe(join(coreRoot, 'renderScheduler.js')), /render|schedule|request|flush|queue/g)
};

const modulesWithResultRenderer = moduleEvidence.filter(item => item.usesResultRenderer);
const modulesWithDynamicRenderer = moduleEvidence.filter(item => item.hasDynamicRenderer);
const modulesWithRenderPipeline = moduleEvidence.filter(item => item.hasRenderPipeline);
const modulesWithControllerDomWrites = moduleEvidence.filter(item => item.controllerDomWrites > 0);
const modulesWithViewLogic = moduleEvidence.filter(item => item.viewLogicSignals > 8 || item.indexRenderSignals > 6);
const modulesWithDiagramInView = moduleEvidence.filter(item => item.diagramInView && item.hasDiagramSignals);
const modulesWithoutResultRenderer = moduleEvidence.filter(item => !item.usesResultRenderer);
const renderPipelineGaps = moduleEvidence.filter(item => !item.hasRenderPipeline && item.score < 4.1);

function average(items, selector) {
  return items.length ? items.reduce((sum, item) => sum + selector(item), 0) / items.length : 0;
}

function scoreRenderPipeline() {
  let score = 4.15;
  if (coreEvidence.renderCoordinatorExists) score += 0.25;
  if (coreEvidence.renderSchedulerExists) score += 0.15;
  if (modulesWithRenderPipeline.length >= 3) score += 0.15;
  if (renderPipelineGaps.length) score -= Math.min(0.75, renderPipelineGaps.length * 0.15);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreDynamicRenderer() {
  let score = 4.15;
  if (modulesWithDynamicRenderer.length >= 3) score += 0.25;
  if (modulesWithControllerDomWrites.length) score -= Math.min(0.85, modulesWithControllerDomWrites.length * 0.12);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreResultRenderer() {
  let score = 4.3;
  if (modulesWithResultRenderer.length === moduleEvidence.length) score += 0.35;
  if (modulesWithoutResultRenderer.length) score -= Math.min(0.9, modulesWithoutResultRenderer.length * 0.18);
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreDiagramRenderer() {
  let score = 4.45;
  const diagramModules = moduleEvidence.filter(item => item.hasDiagramSignals);
  const isolated = diagramModules.filter(item => !item.diagramInView || item.hasDiagramRenderer);
  if (diagramModules.length && isolated.length === diagramModules.length) score += 0.25;
  if (modulesWithDiagramInView.length) score -= Math.min(0.7, modulesWithDiagramInView.length * 0.2);
  if (moduleEvidence.some(item => item.module === 'hx-diagram' && item.hasDiagramRenderer)) score += 0.2;
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreViewRenderPurity() {
  let score = 4.25;
  if (modulesWithViewLogic.length) score -= Math.min(1.0, modulesWithViewLogic.length * 0.2);
  const averageViewLogic = average(moduleEvidence, item => item.viewLogicSignals);
  if (averageViewLogic <= 4) score += 0.25;
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreRenderTriggerConsistency() {
  let score = 4.05;
  if (modulesWithControllerDomWrites.length) score -= Math.min(0.7, modulesWithControllerDomWrites.length * 0.15);
  if (coreEvidence.renderCoordinatorExists && coreEvidence.renderSchedulerExists) score += 0.3;
  if (modulesWithRenderPipeline.length < Math.ceil(moduleEvidence.length * 0.3)) score -= 0.25;
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

const scores = {
  renderPipeline: scoreRenderPipeline(),
  dynamicRenderer: scoreDynamicRenderer(),
  resultRenderer: scoreResultRenderer(),
  diagramRenderer: scoreDiagramRenderer(),
  viewRenderPurity: scoreViewRenderPurity(),
  renderTriggerConsistency: scoreRenderTriggerConsistency()
};

const findings = auditAreas
  .map(area => {
    const areaGrade = grade(scores[area]);
    const risk = riskFromGrade(area, areaGrade);
    return risk ? { area, score: scores[area], grade: areaGrade, risk, action: actionFor(area) } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.risk.localeCompare(b.risk) || a.score - b.score || a.area.localeCompare(b.area));

const overallScore = Number((auditAreas.reduce((sum, area) => sum + scores[area], 0) / auditAreas.length).toFixed(2));

const report = {
  phase: '27C.3',
  name: 'Rendering Audit',
  generatedBy: 'scripts/audit-rendering-phase27c3.mjs',
  generatedAt: new Date().toISOString(),
  auditAreas,
  modulesAudited: moduleEvidence.length,
  overallScore,
  overallGrade: grade(overallScore),
  scores,
  grades: Object.fromEntries(auditAreas.map(area => [area, grade(scores[area])])),
  findings,
  evidence: {
    coreRendering: coreEvidence,
    moduleRendering: {
      modules: moduleEvidence,
      modulesWithResultRenderer: modulesWithResultRenderer.map(item => item.module),
      modulesWithoutResultRenderer: modulesWithoutResultRenderer.map(item => item.module),
      modulesWithDynamicRenderer: modulesWithDynamicRenderer.map(item => item.module),
      modulesWithRenderPipeline: modulesWithRenderPipeline.map(item => item.module),
      renderPipelineGaps: renderPipelineGaps.map(item => item.module),
      modulesWithControllerDomWrites: modulesWithControllerDomWrites.map(item => ({ module: item.module, hits: item.controllerDomWrites })),
      modulesWithViewLogic: modulesWithViewLogic.map(item => ({ module: item.module, viewLogicSignals: item.viewLogicSignals, indexRenderSignals: item.indexRenderSignals })),
      modulesWithDiagramInView: modulesWithDiagramInView.map(item => item.module)
    }
  },
  executiveSummary: {
    status: overallScore >= 4.3 ? 'rendering-stable' : overallScore >= 3.8 ? 'rendering-stable-with-hardening' : 'rendering-needs-remediation',
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    p3: findings.filter(item => item.risk === 'P3')
  }
};

writeFileSync(join(root, 'platform-rendering-audit-phase27c3.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Phase 27C.3 rendering audit complete: ${overallScore} (${report.overallGrade})`);
