import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const coreRoot = join(root, 'js', 'core');
const platformRoot = join(root, 'js', 'platform');
const modulesRoot = join(root, 'js', 'modules');

const requiredCoreFiles = [
  'moduleDefinition.js',
  'registry.js',
  'mount.js',
  'moduleRuntime.js',
  'moduleLifecycleAdapter.js',
  'navigation.js',
  'router.js',
  'eventPipeline.js',
  'eventDelegation.js',
  'renderCoordinator.js',
  'renderScheduler.js',
  'scrollManager.js',
  'savedRecordController.js',
  'savedRecords.js',
  'centralStore.js',
  'projectStorage.js'
];

const auditAreas = [
  'platformKernel',
  'moduleRegistry',
  'lifecycle',
  'eventSystem',
  'navigation',
  'dependencyGraph'
];

function readMaybe(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function listFiles(dir, predicate = () => true) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path, predicate);
    return predicate(path) ? [path] : [];
  });
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
  if (areaGrade === 'C') return ['lifecycle', 'eventSystem', 'navigation'].includes(area) ? 'P1' : 'P2';
  if (areaGrade === 'B') return ['eventSystem', 'navigation'].includes(area) ? 'P2' : 'P3';
  return null;
}

const coreFiles = [...listFiles(coreRoot, file => file.endsWith('.js')), ...listFiles(platformRoot, file => file.endsWith('.js'))];
const moduleFiles = listFiles(modulesRoot, file => file.endsWith('.js'));
const allJsFiles = [...coreFiles, ...moduleFiles];
const coreByName = Object.fromEntries(requiredCoreFiles.map(name => [name, readMaybe(join(coreRoot, name))]));
const allTextByFile = Object.fromEntries(allJsFiles.map(file => [relative(root, file), readMaybe(file)]));

const moduleDirs = existsSync(modulesRoot)
  ? readdirSync(modulesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  : [];

const moduleIndexFiles = moduleDirs.map(moduleName => ({
  module: moduleName,
  path: join(modulesRoot, moduleName, 'index.js'),
  content: readMaybe(join(modulesRoot, moduleName, 'index.js'))
}));

const createPlatformModuleCount = moduleIndexFiles.filter(item => /createPlatformModule/.test(item.content)).length;
const indexDefaultExportCount = moduleIndexFiles.filter(item => /export\s+default/.test(item.content)).length;
const missingCoreFiles = requiredCoreFiles.filter(name => !existsSync(join(coreRoot, name)));

const directGlobalListeners = Object.entries(allTextByFile)
  .flatMap(([file, text]) => {
    const add = countMatches(text, /(?:window|document)\.addEventListener\s*\(/g);
    const remove = countMatches(text, /(?:window|document)\.removeEventListener\s*\(/g);
    return add ? [{ file, add, remove, balance: add - remove }] : [];
  })
  .sort((a, b) => b.balance - a.balance || a.file.localeCompare(b.file));

const directStorageAccess = Object.entries(allTextByFile)
  .flatMap(([file, text]) => {
    const hits = countMatches(text, /(?:localStorage|sessionStorage)\./g);
    if (!hits) return [];
    const allowed = /js\/core\/(projectStorage|preferences|savedRecords|state)\.js$/.test(file);
    return [{ file, hits, allowed }];
  })
  .sort((a, b) => Number(a.allowed) - Number(b.allowed) || b.hits - a.hits || a.file.localeCompare(b.file));

const dependencyViolations = Object.entries(allTextByFile)
  .flatMap(([file, text]) => {
    const violations = [];
    if (/js\/modules\/.+\/view\.js$/.test(file) && /from ['"].*(logic|state|storage|savedRecords|controller)/.test(text)) {
      violations.push('view imports logic/state/storage/controller');
    }
    if (/js\/modules\/.+\/(results|dynamicRenderer|diagramRenderer|formRenderer)\.js$/.test(file) && /from ['"].*controller/.test(text)) {
      violations.push('renderer imports controller');
    }
    if (/js\/modules\/.+\/viewModel\.js$/.test(file) && /addEventListener|querySelector|innerHTML\s*=/.test(text)) {
      violations.push('viewModel contains DOM/event mutation');
    }
    return violations.map(reason => ({ file, reason }));
  })
  .sort((a, b) => a.file.localeCompare(b.file));

const navigationEvidence = {
  routerExists: existsSync(join(coreRoot, 'router.js')),
  navigationExists: existsSync(join(coreRoot, 'navigation.js')),
  scrollManagerExists: existsSync(join(coreRoot, 'scrollManager.js')),
  sameModuleGuard: /same|current|active|guard|already/i.test(coreByName['router.js'] + coreByName['navigation.js']),
  hashHandling: /hash|popstate|pushState|replaceState/i.test(coreByName['router.js'] + coreByName['navigation.js']),
  scrollPolicy: /scroll|preventScroll|restore|position/i.test(coreByName['scrollManager.js'] + coreByName['navigation.js'])
};

const lifecycleEvidence = {
  runtimeExists: existsSync(join(coreRoot, 'moduleRuntime.js')),
  adapterExists: existsSync(join(coreRoot, 'moduleLifecycleAdapter.js')),
  platformLifecycleExists: existsSync(join(coreRoot, 'platformLifecycle.js')),
  lifecycleTerms: countMatches(Object.values(coreByName).join('\n'), /mount|unmount|destroy|hydrate|render|cleanup|dispose/g),
  cleanupTerms: countMatches(Object.values(coreByName).join('\n'), /cleanup|dispose|removeEventListener|abort|AbortController/g)
};

const registryEvidence = {
  registryExists: existsSync(join(coreRoot, 'registry.js')),
  moduleCount: moduleDirs.length,
  createPlatformModuleCount,
  indexDefaultExportCount,
  allModulesUsePlatformMount: createPlatformModuleCount === moduleDirs.length,
  allModulesExportDefault: indexDefaultExportCount === moduleDirs.length
};

const kernelEvidence = {
  missingCoreFiles,
  requiredCoreFilesPresent: requiredCoreFiles.length - missingCoreFiles.length,
  moduleDefinitionHasFactory: /createPlatformModule/.test(Object.values(allTextByFile).join('\n')),
  mountHasRuntimeBoundary: /mount|module|runtime|lifecycle/i.test(coreByName['mount.js'] + coreByName['moduleRuntime.js']),
  centralStoreExists: existsSync(join(coreRoot, 'centralStore.js'))
};

const eventEvidence = {
  eventPipelineExists: existsSync(join(coreRoot, 'eventPipeline.js')),
  eventDelegationExists: existsSync(join(coreRoot, 'eventDelegation.js')),
  directGlobalListeners,
  unbalancedGlobalListenerFiles: directGlobalListeners.filter(item => item.balance > 0),
  delegatedEventTerms: countMatches(coreByName['eventPipeline.js'] + coreByName['eventDelegation.js'], /delegate|dispatch|handler|event|bind/g)
};

function scorePlatformKernel() {
  let score = 5;
  if (kernelEvidence.missingCoreFiles.length) score -= Math.min(2, kernelEvidence.missingCoreFiles.length * 0.25);
  if (!kernelEvidence.moduleDefinitionHasFactory) score -= 1.5;
  if (!kernelEvidence.mountHasRuntimeBoundary) score -= 0.75;
  if (!kernelEvidence.centralStoreExists) score -= 0.5;
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreModuleRegistry() {
  let score = 5;
  if (!registryEvidence.registryExists) score -= 1.5;
  if (!registryEvidence.allModulesUsePlatformMount) score -= Math.min(2, (moduleDirs.length - createPlatformModuleCount) * 0.25);
  if (!registryEvidence.allModulesExportDefault) score -= Math.min(1, (moduleDirs.length - indexDefaultExportCount) * 0.15);
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreLifecycle() {
  let score = 4.6;
  if (!lifecycleEvidence.runtimeExists) score -= 1.2;
  if (!lifecycleEvidence.adapterExists) score -= 0.8;
  if (lifecycleEvidence.cleanupTerms < 2) score -= 0.8;
  if (eventEvidence.unbalancedGlobalListenerFiles.length > 2) score -= 0.4;
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreEventSystem() {
  let score = 4.5;
  if (!eventEvidence.eventPipelineExists) score -= 1.2;
  if (!eventEvidence.eventDelegationExists) score -= 0.8;
  if (eventEvidence.unbalancedGlobalListenerFiles.length) score -= Math.min(1.2, eventEvidence.unbalancedGlobalListenerFiles.length * 0.2);
  if (eventEvidence.delegatedEventTerms < 8) score -= 0.4;
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreNavigation() {
  let score = 4.5;
  if (!navigationEvidence.routerExists) score -= 1.2;
  if (!navigationEvidence.navigationExists) score -= 0.9;
  if (!navigationEvidence.scrollManagerExists) score -= 0.7;
  if (!navigationEvidence.sameModuleGuard) score -= 0.3;
  if (!navigationEvidence.hashHandling) score -= 0.3;
  if (!navigationEvidence.scrollPolicy) score -= 0.4;
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreDependencyGraph() {
  let score = 4.6;
  if (dependencyViolations.length) score -= Math.min(1.6, dependencyViolations.length * 0.25);
  const forbiddenStorage = directStorageAccess.filter(item => !item.allowed);
  if (forbiddenStorage.length) score -= Math.min(1, forbiddenStorage.length * 0.2);
  return Math.max(1, Number(score.toFixed(2)));
}

const scores = {
  platformKernel: scorePlatformKernel(),
  moduleRegistry: scoreModuleRegistry(),
  lifecycle: scoreLifecycle(),
  eventSystem: scoreEventSystem(),
  navigation: scoreNavigation(),
  dependencyGraph: scoreDependencyGraph()
};

const findings = auditAreas
  .map(area => {
    const areaGrade = grade(scores[area]);
    const risk = riskFromGrade(area, areaGrade);
    return risk ? { area, score: scores[area], grade: areaGrade, risk, action: actionFor(area) } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.risk.localeCompare(b.risk) || a.score - b.score || a.area.localeCompare(b.area));

function actionFor(area) {
  const actions = {
    platformKernel: 'Core-Dateien und createPlatformModule Boundary absichern',
    moduleRegistry: 'Module Registry und Navigation ausschliesslich ueber Platform Module Metadata fuehren',
    lifecycle: 'Lifecycle-Cleanup fuer Event-Listener und Runtime-Hooks explizit nachweisen',
    eventSystem: 'Direkte globale Listener reduzieren oder mit Cleanup-Contract absichern',
    navigation: 'Scroll-/Focus-/Hash-Verhalten zentral ueber Router, Navigation und ScrollManager haerten',
    dependencyGraph: 'Verbotene View/Renderer-Abhaengigkeiten entfernen und Boundary-Test erweitern'
  };
  return actions[area];
}

const overallScore = Number((auditAreas.reduce((sum, area) => sum + scores[area], 0) / auditAreas.length).toFixed(2));

const report = {
  phase: '27C.1',
  name: 'Core Platform Audit',
  generatedBy: 'scripts/audit-core-platform-phase27c1.mjs',
  generatedAt: new Date().toISOString(),
  auditAreas,
  overallScore,
  overallGrade: grade(overallScore),
  scores,
  grades: Object.fromEntries(auditAreas.map(area => [area, grade(scores[area])])),
  findings,
  evidence: {
    kernel: kernelEvidence,
    registry: registryEvidence,
    lifecycle: lifecycleEvidence,
    eventSystem: eventEvidence,
    navigation: navigationEvidence,
    dependencyGraph: {
      dependencyViolations,
      directStorageAccess,
      forbiddenStorageAccess: directStorageAccess.filter(item => !item.allowed)
    }
  },
  executiveSummary: {
    status: overallScore >= 4.3 ? 'platform-core-stable' : overallScore >= 3.8 ? 'platform-core-stable-with-hardening' : 'platform-core-needs-remediation',
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    p3: findings.filter(item => item.risk === 'P3')
  }
};

writeFileSync(join(root, 'platform-core-audit-phase27c1.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Phase 27C.1 core platform audit complete: ${overallScore} (${report.overallGrade})`);
