import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const rel = (...parts) => path.join(ROOT, ...parts);
const toPosix = (p) => p.replaceAll(path.sep, '/');

const walk = (dir, predicate = () => true) => {
  const base = rel(dir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else {
        const file = toPosix(path.relative(ROOT, full));
        if (predicate(file)) out.push(file);
      }
    }
  };
  visit(base);
  return out.sort();
};

const readJson = (file) => JSON.parse(fs.readFileSync(rel(file), 'utf8'));
const exists = (file) => fs.existsSync(rel(file));

const rootFiles = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);

const misplacedRootPhaseDocs = rootFiles.filter((name) => /^PHASE_.*\.md$/.test(name) || /^RELEASE_NOTES_PHASE.*\.md$/.test(name));
const misplacedRootAuditJson = rootFiles.filter((name) => name.endsWith('.json') && !['package.json', 'manifest.json'].includes(name));
const topLevelDocsPhaseDocs = fs.existsSync(rel('docs'))
  ? fs.readdirSync(rel('docs'), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => /^PHASE_.*\.md$/.test(name) || /^RELEASE_NOTES_PHASE.*\.md$/.test(name))
  : [];

const phase30Docs = walk('docs/phases/phase-30', (file) => file.endsWith('.md'));
const auditJson = walk('docs/audits/json', (file) => file.endsWith('.json'));

const packageJson = readJson('package.json');
const packageScriptPaths = Object.values(packageJson.scripts || {})
  .flatMap((script) => script.match(/(?:tests|scripts)\/[A-Za-z0-9_.\/-]+\.mjs/g) || [])
  .filter(Boolean);
const missingPackageScriptTargets = [...new Set(packageScriptPaths)].filter((file) => !exists(file));

const qualityGateSource = exists('scripts/quality-gate.mjs') ? fs.readFileSync(rel('scripts/quality-gate.mjs'), 'utf8') : '';
const qualityGatePaths = [...qualityGateSource.matchAll(/['"]((?:tests|scripts)\/[A-Za-z0-9_.\/-]+\.mjs)['"]/g)]
  .map((match) => match[1]);
const missingQualityGateTargets = [...new Set(qualityGatePaths)].filter((file) => !exists(file));

const duplicateGroup = [
  'js/modules/rainwater/index.js',
  'js/modules/wastewater/index.js'
];
const intentionalPlatformWrapperDuplicate = duplicateGroup.every(exists) && duplicateGroup.every((file) => {
  const source = fs.readFileSync(rel(file), 'utf8');
  return source.includes('createPlatformModule') && source.includes("./config.js") && source.includes("./schema.js");
});

const runtimeDeadCodeCandidates = [
  'js/core/eventDelegation.js',
  'js/core/menuFallback.js',
  'js/core/moduleContract.js',
  'js/core/pdfExport.js',
  'js/core/platformLifecycle.js',
  'js/core/quality/appHealth.js',
  'js/core/resultRenderer.js',
  'js/core/savedCalculationController.js',
  'js/core/schemaModuleMount.js',
  'js/core/uiSystem.js',
  'js/modules/wastewater/lineModel.js'
];
const retainedRuntimeReviewCandidates = runtimeDeadCodeCandidates.filter(exists);

const findings = [];
if (misplacedRootPhaseDocs.length) findings.push({ severity: 'P1', area: 'root-docs', count: misplacedRootPhaseDocs.length, message: 'Phase documents remain in project root.' });
if (misplacedRootAuditJson.length) findings.push({ severity: 'P1', area: 'root-json', count: misplacedRootAuditJson.length, message: 'Generated audit JSON files remain in project root.' });
if (topLevelDocsPhaseDocs.length) findings.push({ severity: 'P1', area: 'docs-top-level', count: topLevelDocsPhaseDocs.length, message: 'Phase documents remain directly under docs/ instead of docs/phases/.' });
if (missingPackageScriptTargets.length) findings.push({ severity: 'P0', area: 'package-scripts', count: missingPackageScriptTargets.length, message: 'Package scripts reference missing files.', files: missingPackageScriptTargets });
if (missingQualityGateTargets.length) findings.push({ severity: 'P0', area: 'quality-gate', count: missingQualityGateTargets.length, message: 'Quality gate references missing files.', files: missingQualityGateTargets });
if (!intentionalPlatformWrapperDuplicate) findings.push({ severity: 'P2', area: 'duplicates', message: 'Known rainwater/wastewater wrapper duplicate is no longer classifiable as intentional.' });
if (retainedRuntimeReviewCandidates.length) findings.push({ severity: 'P2', area: 'runtime-review', count: retainedRuntimeReviewCandidates.length, message: 'Runtime dead-code candidates retained for manual review; no unsafe deletion performed.' });

const p0 = findings.filter((finding) => finding.severity === 'P0').length;
const p1 = findings.filter((finding) => finding.severity === 'P1').length;
const p2 = findings.filter((finding) => finding.severity === 'P2').length;
const score = p0 ? 0 : p1 ? 4.2 : p2 ? 4.85 : 5;
const result = {
  phase: '30D',
  name: 'Controlled Cleanup Batch',
  score,
  grade: score >= 4.8 ? 'A' : score >= 4.0 ? 'B' : 'C',
  counts: {
    phase30Docs: phase30Docs.length,
    auditJson: auditJson.length,
    misplacedRootPhaseDocs: misplacedRootPhaseDocs.length,
    misplacedRootAuditJson: misplacedRootAuditJson.length,
    topLevelDocsPhaseDocs: topLevelDocsPhaseDocs.length,
    packageScriptTargets: [...new Set(packageScriptPaths)].length,
    missingPackageScriptTargets: missingPackageScriptTargets.length,
    qualityGateTargets: [...new Set(qualityGatePaths)].length,
    missingQualityGateTargets: missingQualityGateTargets.length,
    retainedRuntimeReviewCandidates: retainedRuntimeReviewCandidates.length
  },
  cleanupActions: [
    'Moved Phase 30C documentation into docs/phases/phase-30.',
    'Added controlled cleanup audit and regression test.',
    'Classified rainwater/wastewater index duplicate as intentional platform wrapper.',
    'Retained runtime/test candidates pending manual validation instead of deleting them.'
  ],
  findings,
  generatedAt: new Date().toISOString()
};

const outPath = rel('docs/audits/json/controlled-cleanup-audit-phase30d.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
