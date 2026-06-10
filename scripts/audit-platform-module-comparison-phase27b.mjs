import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const modulesRoot = join(root, 'js', 'modules');
const testsRoot = join(root, 'tests');

const expectedModules = [
  'heating-cooling',
  'ventilation',
  'rainwater',
  'wastewater',
  'pipe-sizing',
  'pressure-holding',
  'unit-converter',
  'buffer-storage',
  'heat-recovery',
  'drinking-water',
  'hx-diagram'
];

const dimensions = [
  'platformMount',
  'stateContract',
  'controllerSeparation',
  'viewModelSeparation',
  'viewPurity',
  'resultRenderer',
  'dynamicRenderer',
  'diagramRenderer',
  'savedRecords',
  'renderPipeline',
  'numericLocaleHandling',
  'uxStability',
  'testCoverage'
];

const fileNames = [
  'config.js',
  'schema.js',
  'state.js',
  'logic.js',
  'index.js',
  'controller.js',
  'viewModel.js',
  'view.js',
  'results.js',
  'dynamicRenderer.js',
  'diagramRenderer.js',
  'renderPipeline.js',
  'formRenderer.js'
];

const referenceModules = new Set(['heat-recovery', 'buffer-storage', 'hx-diagram']);
const savedRecordModules = new Set(['rainwater', 'wastewater', 'pipe-sizing', 'pressure-holding', 'buffer-storage', 'heat-recovery', 'drinking-water', 'hx-diagram']);
const diagramModules = new Set(['hx-diagram']);
const dynamicModules = new Set(['drinking-water', 'heat-recovery', 'hx-diagram']);

function readMaybe(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function lines(text) {
  return text ? text.split('\n').length : 0;
}

function listTests(moduleName) {
  if (!existsSync(testsRoot)) return [];
  return readdirSync(testsRoot)
    .filter(file => file.endsWith('.test.mjs') && file.includes(moduleName))
    .sort();
}

function scoreFromPresence(hasFile, expected = true) {
  if (!expected) return 5;
  return hasFile ? 4 : 1;
}

function classifyRisk(score, dimension, moduleName) {
  if (score >= 4) return null;
  if (score <= 1 && ['platformMount', 'stateContract', 'controllerSeparation'].includes(dimension)) return 'P1';
  if (score <= 2 && ['viewPurity', 'renderPipeline', 'savedRecords'].includes(dimension)) return 'P2';
  if (score <= 2 && moduleName === 'hx-diagram' && dimension === 'diagramRenderer') return 'P1';
  if (score <= 2) return 'P3';
  return 'P4';
}

function evidenceFor(moduleName) {
  const moduleDir = join(modulesRoot, moduleName);
  const files = Object.fromEntries(fileNames.map(file => [file, existsSync(join(moduleDir, file))]));
  const content = Object.fromEntries(fileNames.map(file => [file, readMaybe(join(moduleDir, file))]));
  const tests = listTests(moduleName);
  const allJs = Object.values(content).join('\n');
  const index = content['index.js'];
  const view = content['view.js'];
  const controller = content['controller.js'];
  const state = content['state.js'];
  const results = content['results.js'];

  return {
    files,
    lineCounts: {
      index: lines(index),
      controller: lines(controller),
      view: lines(view),
      results: lines(results)
    },
    tests,
    flags: {
      usesCreatePlatformModule: /createPlatformModule/.test(index),
      indexExportsDefault: /export\s+default/.test(index),
      hasSavedRecordState: /saved[A-Z]|savedRecords|savedProcesses|records|active.*Id|expanded.*Id/i.test(state),
      viewHasSvgInternals: /<svg|createElementNS|viewBox|polyline|path\s+d=/.test(view),
      viewHasStorageMutation: /localStorage|sessionStorage|save[A-Z]|delete[A-Z]|update[A-Z]|active.*Id\s*=|expanded.*Id\s*=/.test(view),
      controllerBindsEvents: /addEventListener|onclick|onchange|bind/i.test(controller),
      resultsRenderMarkup: /result|card|section|summary|html/i.test(results),
      hasGermanNumberHandling: /formatNumber|parseNumber|parseGerman|locale|de-DE|Intl\.NumberFormat|decimal/i.test(allJs),
      hasScrollGuard: /preventScroll|scrollIntoView|focus\(|tabindex|keydown|Enter|Tab/i.test(allJs)
    }
  };
}

function scoreModule(moduleName) {
  const ev = evidenceFor(moduleName);
  const f = ev.files;
  const expectedSaved = savedRecordModules.has(moduleName);
  const expectedDynamic = dynamicModules.has(moduleName);
  const expectedDiagram = diagramModules.has(moduleName);

  const scores = {
    platformMount: ev.flags.usesCreatePlatformModule && ev.lineCounts.index <= 140 ? 5 : ev.flags.usesCreatePlatformModule ? 4 : 2,
    stateContract: f['state.js'] && f['schema.js'] && f['logic.js'] ? 4 : 1,
    controllerSeparation: f['controller.js'] && ev.flags.controllerBindsEvents ? 4 : f['controller.js'] ? 3 : 1,
    viewModelSeparation: f['viewModel.js'] ? 4 : 1,
    viewPurity: f['view.js'] && !ev.flags.viewHasSvgInternals && !ev.flags.viewHasStorageMutation && ev.lineCounts.view <= 260 ? 5 : f['view.js'] && !ev.flags.viewHasStorageMutation ? 4 : f['view.js'] ? 2 : 1,
    resultRenderer: f['results.js'] && ev.flags.resultsRenderMarkup ? 4 : f['results.js'] ? 3 : 1,
    dynamicRenderer: scoreFromPresence(f['dynamicRenderer.js'], expectedDynamic),
    diagramRenderer: scoreFromPresence(f['diagramRenderer.js'], expectedDiagram),
    savedRecords: expectedSaved ? (ev.flags.hasSavedRecordState && f['controller.js'] ? 4 : ev.flags.hasSavedRecordState ? 3 : 2) : 5,
    renderPipeline: f['renderPipeline.js'] ? 5 : f['dynamicRenderer.js'] ? 4 : 3,
    numericLocaleHandling: ev.flags.hasGermanNumberHandling ? 4 : 3,
    uxStability: ev.flags.hasScrollGuard || ev.tests.some(test => /scroll|navigation|input|enter|tab/i.test(test)) ? 4 : 3,
    testCoverage: ev.tests.length >= 5 ? 5 : ev.tests.length >= 3 ? 4 : ev.tests.length >= 1 ? 3 : 1
  };

  const findings = dimensions
    .map(dimension => ({ dimension, score: scores[dimension], risk: classifyRisk(scores[dimension], dimension, moduleName) }))
    .filter(item => item.risk)
    .sort((a, b) => a.score - b.score || a.dimension.localeCompare(b.dimension));

  const average = Number((dimensions.reduce((sum, dimension) => sum + scores[dimension], 0) / dimensions.length).toFixed(2));
  const status = average >= 4.4 ? 'reference-grade' : average >= 4.0 ? 'platform-conformant' : average >= 3.5 ? 'compatible-with-cleanup' : 'requires-follow-up';

  return {
    module: moduleName,
    cluster: referenceModules.has(moduleName) ? 'reference-candidate' : expectedSaved ? 'saved-record-module' : 'standard-module',
    average,
    status,
    scores,
    findings,
    evidence: ev
  };
}

function buildSummary(modules) {
  const matrix = Object.fromEntries(modules.map(module => [module.module, module.scores]));
  const averages = Object.fromEntries(modules.map(module => [module.module, module.average]));
  const byDimension = Object.fromEntries(dimensions.map(dimension => {
    const avg = Number((modules.reduce((sum, module) => sum + module.scores[dimension], 0) / modules.length).toFixed(2));
    const lowest = modules
      .map(module => ({ module: module.module, score: module.scores[dimension] }))
      .sort((a, b) => a.score - b.score || a.module.localeCompare(b.module))
      .slice(0, 4);
    return [dimension, { average: avg, lowest }];
  }));
  const riskRegister = modules.flatMap(module => module.findings.map(finding => ({ module: module.module, ...finding })))
    .sort((a, b) => (a.risk || '').localeCompare(b.risk || '') || a.score - b.score || a.module.localeCompare(b.module));
  const backlog = riskRegister.map((item, index) => ({
    rank: index + 1,
    risk: item.risk,
    module: item.module,
    dimension: item.dimension,
    action: remediationAction(item)
  }));
  return { matrix, averages, byDimension, riskRegister, backlog };
}

function remediationAction(item) {
  const labels = {
    controllerSeparation: 'Controller-Grenze nachziehen und Event-Binding aus View/Index entfernen',
    viewModelSeparation: 'ViewModel-Vertrag ergänzen und Renderdaten aus Fachlogik ableiten',
    viewPurity: 'View auf Layout/Shell reduzieren; Mutationen und Fachrenderer auslagern',
    resultRenderer: 'Result-Card-Rendering in results.js konsolidieren',
    dynamicRenderer: 'Dynamic Islands über dynamicRenderer.js oder Pipeline standardisieren',
    diagramRenderer: 'Diagrammrenderer als eigene Boundary absichern',
    savedRecords: 'Saved-Record-State und active/expanded IDs vollständig über Controller/ViewModel führen',
    renderPipeline: 'Zentralen Render-Orchestrator einführen oder bestehende Pipeline dokumentieren',
    testCoverage: 'Architektur- und Regressionsabdeckung pro Modul erhöhen',
    platformMount: 'createPlatformModule-Mount nach Plattformstandard herstellen',
    stateContract: 'state/schema/logic Contract schließen',
    numericLocaleHandling: 'deutsche Zahlenformatierung zentral nachweisen',
    uxStability: 'Scroll-, Enter-/Tab- und Live-Update-Regression ergänzen'
  };
  return labels[item.dimension] || 'Architekturabweichung prüfen und bereinigen';
}

const existingModules = expectedModules.filter(moduleName => existsSync(join(modulesRoot, moduleName)));
const missingModules = expectedModules.filter(moduleName => !existsSync(join(modulesRoot, moduleName)));
const moduleReports = existingModules.map(scoreModule).sort((a, b) => a.module.localeCompare(b.module));
const summary = buildSummary(moduleReports);

const report = {
  phase: '27B',
  name: 'Platform Module Comparison',
  generatedBy: 'scripts/audit-platform-module-comparison-phase27b.mjs',
  generatedAt: new Date().toISOString(),
  modulesExpected: expectedModules.length,
  modulesAudited: moduleReports.length,
  missingModules,
  referenceModules: [...referenceModules],
  dimensions,
  ...summary,
  modules: moduleReports
};

writeFileSync(join(root, 'platform-module-comparison-phase27b.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`phase27b module comparison ok (${moduleReports.length} modules, ${summary.riskRegister.length} findings)`);
