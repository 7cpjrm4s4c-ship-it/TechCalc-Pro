import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const coreRoot = join(root, 'js', 'core');
const modulesRoot = join(root, 'js', 'modules');

const auditAreas = [
  'storageBoundary',
  'savedRecordStateModel',
  'hydrationSerialization',
  'migrationReadiness',
  'moduleStorageIsolation'
];

const allowedStorageFiles = [
  'js/core/projectStorage.js',
  'js/core/preferences.js',
  'js/core/savedRecords.js',
  'js/core/state.js'
];

const toleratedCoreStorageFiles = [
  'js/core/app.js'
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
  if (areaGrade === 'C') return ['storageBoundary', 'hydrationSerialization', 'moduleStorageIsolation'].includes(area) ? 'P1' : 'P2';
  if (areaGrade === 'B') return ['storageBoundary', 'moduleStorageIsolation'].includes(area) ? 'P2' : 'P3';
  return null;
}

function actionFor(area) {
  const actions = {
    storageBoundary: 'Storage-Zugriffe vollstaendig in Core Storage Services konsolidieren; verbleibende App-Shell-Themenzugriffe bewerten oder kapseln.',
    savedRecordStateModel: 'Saved-Record-State je Modul mit einheitlichen Arrays, aktiver ID und optionaler expanded ID nachweisen.',
    hydrationSerialization: 'Hydration/Serialization-Pfade zentralisieren und defensiv gegen fehlerhafte gespeicherte Payloads absichern.',
    migrationReadiness: 'Storage-Key-Versionierung, Migration Hooks und Rueckwaertskompatibilitaet dokumentieren.',
    moduleStorageIsolation: 'Moduldateien duerfen keine direkten localStorage/sessionStorage-Zugriffe enthalten.'
  };
  return actions[area];
}

const jsFiles = [
  ...listFiles(coreRoot, file => file.endsWith('.js')),
  ...listFiles(modulesRoot, file => file.endsWith('.js'))
];

const files = Object.fromEntries(jsFiles.map(file => [relative(root, file), readMaybe(file)]));
const moduleDirs = existsSync(modulesRoot)
  ? readdirSync(modulesRoot, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  : [];

const storageAccess = Object.entries(files)
  .flatMap(([file, text]) => {
    const hits = countMatches(text, /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem|clear|key|length)/g);
    if (!hits) return [];
    const allowed = allowedStorageFiles.includes(file);
    const tolerated = toleratedCoreStorageFiles.includes(file);
    const inModule = file.startsWith('js/modules/');
    return [{ file, hits, allowed, tolerated, inModule }];
  })
  .sort((a, b) => Number(a.allowed) - Number(b.allowed) || Number(a.tolerated) - Number(b.tolerated) || b.hits - a.hits || a.file.localeCompare(b.file));

const forbiddenModuleStorageAccess = storageAccess.filter(item => item.inModule);
const uncapsulatedCoreStorageAccess = storageAccess.filter(item => !item.allowed && !item.inModule && !item.tolerated);
const toleratedStorageAccess = storageAccess.filter(item => item.tolerated);

const moduleStateEvidence = moduleDirs.map(moduleName => {
  const dir = join(modulesRoot, moduleName);
  const state = readMaybe(join(dir, 'state.js'));
  const index = readMaybe(join(dir, 'index.js'));
  const controller = readMaybe(join(dir, 'controller.js'));
  const viewModel = readMaybe(join(dir, 'viewModel.js'));
  const combined = `${state}\n${index}\n${controller}\n${viewModel}`;
  const hasSavedArray = /saved[A-Z][A-Za-z0-9]*|savedRecords|records|processes|entries|calculations/.test(combined);
  const hasActiveId = /active[A-Z][A-Za-z0-9]*Id|activeRecordId|activeProcessId|selected[A-Z][A-Za-z0-9]*Id/.test(combined);
  const hasExpandedId = /expanded[A-Z][A-Za-z0-9]*Id|expandedRecordId|expandedProcessId/.test(combined);
  const hasSaveFunction = /save[A-Z][A-Za-z0-9]*\s*\(|make[A-Z][A-Za-z0-9]*(?:Record|Entry)\s*\(|create[A-Z][A-Za-z0-9]*(?:Record|Entry)\s*\(/.test(combined);
  const hasHydrationTerms = /hydrate|load|restore|deserialize|fromStorage|normalize|initialState|getInitialState/.test(combined);
  const hasSerializationTerms = /serialize|toJSON|JSON\.stringify|save|snapshot|export|persist/.test(combined);
  const directStorage = /(?:localStorage|sessionStorage)\./.test(combined);
  return {
    module: moduleName,
    hasStateFile: existsSync(join(dir, 'state.js')),
    hasSavedArray,
    hasActiveId,
    hasExpandedId,
    hasSaveFunction,
    hasHydrationTerms,
    hasSerializationTerms,
    directStorage,
    stateSize: state.length
  };
});

const modulesWithSavedRecordSignals = moduleStateEvidence.filter(item => item.hasSavedArray || item.hasSaveFunction || item.hasActiveId);
const savedRecordModelGaps = modulesWithSavedRecordSignals.filter(item => !item.hasActiveId || !item.hasSaveFunction);
const modulesWithDirectStorage = moduleStateEvidence.filter(item => item.directStorage);
const hydrationGaps = moduleStateEvidence.filter(item => !item.hasHydrationTerms);
const serializationGaps = modulesWithSavedRecordSignals.filter(item => !item.hasSerializationTerms && !item.hasSaveFunction);

const projectStorage = readMaybe(join(coreRoot, 'projectStorage.js'));
const savedRecords = readMaybe(join(coreRoot, 'savedRecords.js'));
const centralState = readMaybe(join(coreRoot, 'state.js'));
const app = readMaybe(join(coreRoot, 'app.js'));

const storageBoundaryEvidence = {
  projectStorageExists: existsSync(join(coreRoot, 'projectStorage.js')),
  savedRecordsCoreExists: existsSync(join(coreRoot, 'savedRecords.js')),
  preferencesExists: existsSync(join(coreRoot, 'preferences.js')),
  directStorageFiles: storageAccess,
  forbiddenModuleStorageAccess,
  uncapsulatedCoreStorageAccess,
  toleratedStorageAccess
};

const hydrationEvidence = {
  projectStorageHasCollect: /collectProjectData|getProjectData|snapshot|serialize/i.test(projectStorage),
  projectStorageHasRestore: /restore|load|hydrate|import|apply/i.test(projectStorage + centralState),
  hasJsonParseGuards: /try\s*\{|catch\s*\(/.test(projectStorage + savedRecords + app),
  hasJsonStringify: /JSON\.stringify/.test(projectStorage + savedRecords + app),
  hydrationGaps,
  serializationGaps
};

const migrationEvidence = {
  storageKeyCount: countMatches(projectStorage + savedRecords + app, /STORAGE_KEY|storageKey|key\s*=|techcalc-/g),
  versionTerms: countMatches(projectStorage + savedRecords + app, /version|schemaVersion|migration|migrate|legacy|compat/g),
  importExportTerms: countMatches(projectStorage + savedRecords + app, /import|export|snapshot|restore|collect/g),
  docsMentionMigration: listFiles(join(root, 'docs'), file => file.endsWith('.md')).some(file => /migration|storage|saved/i.test(readMaybe(file)))
};

function scoreStorageBoundary() {
  let score = 4.7;
  if (!storageBoundaryEvidence.projectStorageExists) score -= 1.4;
  if (!storageBoundaryEvidence.savedRecordsCoreExists) score -= 0.8;
  if (forbiddenModuleStorageAccess.length) score -= Math.min(2.5, forbiddenModuleStorageAccess.length * 0.7);
  if (uncapsulatedCoreStorageAccess.length) score -= Math.min(1.2, uncapsulatedCoreStorageAccess.length * 0.4);
  if (toleratedStorageAccess.length) score -= Math.min(0.45, toleratedStorageAccess.length * 0.15);
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreSavedRecordStateModel() {
  let score = 4.5;
  if (savedRecordModelGaps.length) score -= Math.min(1.6, savedRecordModelGaps.length * 0.25);
  const savedWithExpanded = modulesWithSavedRecordSignals.filter(item => item.hasExpandedId).length;
  if (modulesWithSavedRecordSignals.length && savedWithExpanded < Math.floor(modulesWithSavedRecordSignals.length * 0.5)) score -= 0.35;
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreHydrationSerialization() {
  let score = 4.4;
  if (!hydrationEvidence.projectStorageHasCollect) score -= 0.8;
  if (!hydrationEvidence.projectStorageHasRestore) score -= 0.8;
  if (!hydrationEvidence.hasJsonParseGuards) score -= 0.55;
  if (!hydrationEvidence.hasJsonStringify) score -= 0.4;
  if (serializationGaps.length) score -= Math.min(0.9, serializationGaps.length * 0.18);
  return Math.max(1, Number(score.toFixed(2)));
}

function scoreMigrationReadiness() {
  let score = 4.0;
  if (migrationEvidence.storageKeyCount >= 2) score += 0.25;
  if (migrationEvidence.versionTerms >= 3) score += 0.35;
  if (migrationEvidence.importExportTerms >= 4) score += 0.25;
  if (migrationEvidence.docsMentionMigration) score += 0.15;
  if (migrationEvidence.versionTerms < 2) score -= 0.55;
  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function scoreModuleStorageIsolation() {
  let score = 5;
  if (modulesWithDirectStorage.length) score -= Math.min(3, modulesWithDirectStorage.length * 0.75);
  if (forbiddenModuleStorageAccess.length) score -= Math.min(1.2, forbiddenModuleStorageAccess.length * 0.3);
  return Math.max(1, Number(score.toFixed(2)));
}

const scores = {
  storageBoundary: scoreStorageBoundary(),
  savedRecordStateModel: scoreSavedRecordStateModel(),
  hydrationSerialization: scoreHydrationSerialization(),
  migrationReadiness: scoreMigrationReadiness(),
  moduleStorageIsolation: scoreModuleStorageIsolation()
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
  phase: '27C.2',
  name: 'State and Storage Audit',
  generatedBy: 'scripts/audit-state-storage-phase27c2.mjs',
  generatedAt: new Date().toISOString(),
  auditAreas,
  overallScore,
  overallGrade: grade(overallScore),
  scores,
  grades: Object.fromEntries(auditAreas.map(area => [area, grade(scores[area])])),
  findings,
  evidence: {
    storageBoundary: storageBoundaryEvidence,
    savedRecordStateModel: {
      modules: moduleStateEvidence,
      modulesWithSavedRecordSignals,
      savedRecordModelGaps
    },
    hydrationSerialization: hydrationEvidence,
    migrationReadiness: migrationEvidence,
    moduleStorageIsolation: {
      modulesWithDirectStorage,
      forbiddenModuleStorageAccess
    }
  },
  executiveSummary: {
    status: overallScore >= 4.3 ? 'state-storage-stable' : overallScore >= 3.8 ? 'state-storage-stable-with-hardening' : 'state-storage-needs-remediation',
    p0: [],
    p1: findings.filter(item => item.risk === 'P1'),
    p2: findings.filter(item => item.risk === 'P2'),
    p3: findings.filter(item => item.risk === 'P3')
  }
};

writeFileSync(join(root, 'platform-state-storage-audit-phase27c2.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Phase 27C.2 state/storage audit complete: ${overallScore} (${report.overallGrade})`);
