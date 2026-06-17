import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const modulesRoot = join(root, 'js', 'modules');
const moduleNames = readdirSync(modulesRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const expectedCore = ['config.js', 'schema.js', 'state.js', 'logic.js', 'index.js'];
const optionalBoundaries = ['controller.js', 'viewModel.js', 'view.js', 'results.js', 'dynamicRenderer.js', 'diagramRenderer.js', 'renderPipeline.js', 'formRenderer.js'];
const docsPath = join(root, 'docs', 'PHASE_27A_PLATFORM_AUDIT_FRAMEWORK.md');
const frameworkPath = join(root, 'platform-audit-framework-phase27a.json');

function readMaybe(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function scoreModule(moduleName) {
  const moduleDir = join(modulesRoot, moduleName);
  const files = Object.fromEntries([...expectedCore, ...optionalBoundaries].map(file => [file, existsSync(join(moduleDir, file))]));
  const index = readMaybe(join(moduleDir, 'index.js'));
  const view = readMaybe(join(moduleDir, 'view.js'));
  const state = readMaybe(join(moduleDir, 'state.js'));
  const tests = readdirSync(join(root, 'tests')).filter(file => file.includes(moduleName) && file.endsWith('.test.mjs'));

  const evidence = {
    files,
    tests: tests.length,
    indexLines: index ? index.split('\n').length : 0,
    viewLines: view ? view.split('\n').length : 0,
    hasSavedRecordState: /saved|records|active.*Id|expanded.*Id/i.test(state),
    indexUsesPlatformMount: /createPlatformModule|mount|moduleRuntime|register/i.test(index),
    viewHasSvgInternals: /<svg|createElementNS|polyline|path d=|viewBox/i.test(view),
    viewHasStorageMutation: /localStorage|save[A-Z]|delete[A-Z]|update[A-Z]|active.*Id\s*=/.test(view)
  };

  const scores = {
    platformMount: evidence.indexUsesPlatformMount && evidence.indexLines < 180 ? 4 : evidence.indexUsesPlatformMount ? 3 : 1,
    stateContract: files['state.js'] ? 4 : 0,
    controllerSeparation: files['controller.js'] ? 4 : 2,
    viewModelSeparation: files['viewModel.js'] ? 4 : 1,
    viewPurity: files['view.js'] && !evidence.viewHasSvgInternals && !evidence.viewHasStorageMutation ? 4 : files['view.js'] ? 2 : 0,
    resultRenderer: files['results.js'] ? 4 : 2,
    dynamicRenderer: files['dynamicRenderer.js'] || !evidence.hasSavedRecordState ? 4 : 2,
    diagramRenderer: moduleName === 'hx-diagram' ? (files['diagramRenderer.js'] ? 4 : 1) : 5,
    savedRecords: evidence.hasSavedRecordState ? (files['controller.js'] ? 4 : 2) : 5,
    renderPipeline: files['renderPipeline.js'] ? 4 : 3,
    numericLocaleHandling: 3,
    uxStability: tests > 0 ? 4 : 2,
    testCoverage: tests >= 3 ? 4 : tests > 0 ? 3 : 1
  };

  const average = Number((Object.values(scores).reduce((sum, value) => sum + value, 0) / Object.values(scores).length).toFixed(2));
  return { module: moduleName, average, scores, evidence };
}

const report = {
  phase: '27A',
  generatedBy: 'scripts/audit-platform-framework-phase27a.mjs',
  frameworkPresent: existsSync(docsPath) && existsSync(frameworkPath),
  modules: moduleNames.map(scoreModule)
};

writeFileSync(join(root, 'platform-audit-baseline-phase27a.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`phase27a audit framework baseline ok (${moduleNames.length} modules)`);
