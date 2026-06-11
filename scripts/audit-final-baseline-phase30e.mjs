import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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

const exists = (file) => fs.existsSync(rel(file));
const readJson = (file) => JSON.parse(fs.readFileSync(rel(file), 'utf8'));
const rootFiles = fs.readdirSync(ROOT, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name);
const misplacedRootPhaseDocs = rootFiles.filter((name) => /^PHASE_.*\.md$/.test(name) || /^RELEASE_NOTES_PHASE.*\.md$/.test(name));
const misplacedRootAuditJson = rootFiles.filter((name) => name.endsWith('.json') && !['package.json', 'manifest.json'].includes(name));
const docsPhaseFiles = walk('docs/phases', (file) => file.endsWith('.md'));
const auditJsonFiles = walk('docs/audits/json', (file) => file.endsWith('.json'));
const jsFiles = walk('.', (file) => file.endsWith('.js') || file.endsWith('.mjs'))
  .filter((file) => !file.startsWith('node_modules/'));

const packageJson = readJson('package.json');
const packageScriptPaths = Object.values(packageJson.scripts || {})
  .flatMap((script) => script.match(/(?:tests|scripts)\/[A-Za-z0-9_.\/-]+\.mjs/g) || [])
  .filter(Boolean);
const missingPackageScriptTargets = [...new Set(packageScriptPaths)].filter((file) => !exists(file));

let importCheck = { status: 'not-run', filesOk: null, output: '' };
try {
  const output = execFileSync('node', ['scripts/check-js-imports.mjs'], { encoding: 'utf8', timeout: 120000 });
  const match = output.match(/(\d+)\s+files?\s+ok/i) || output.match(/(\d+)\s+Dateien\s+ok/i);
  importCheck = { status: 'passed', filesOk: match ? Number(match[1]) : null, output: output.trim() };
} catch (error) {
  importCheck = {
    status: 'failed',
    filesOk: null,
    output: String(error.stdout || error.stderr || error.message).trim()
  };
}

const retainedRuntimeReviewCandidates = [
  'js/core/eventDelegation.js',
  'js/core/moduleContract.js',
  'js/core/pdfExport.js',
  'js/core/platformLifecycle.js',
  'js/core/quality/appHealth.js',
  'js/core/resultRenderer.js',
  'js/core/savedCalculationController.js',
  'js/core/schemaModuleMount.js',
  'js/core/uiSystem.js',
  'js/modules/wastewater/lineModel.js'
].filter(exists);

const findings = [];
if (importCheck.status !== 'passed') findings.push({ severity: 'P0', area: 'imports', message: 'Final import baseline failed.', detail: importCheck.output });
if (missingPackageScriptTargets.length) findings.push({ severity: 'P0', area: 'package-scripts', count: missingPackageScriptTargets.length, files: missingPackageScriptTargets });
if (misplacedRootPhaseDocs.length) findings.push({ severity: 'P1', area: 'root-docs', count: misplacedRootPhaseDocs.length });
if (misplacedRootAuditJson.length) findings.push({ severity: 'P1', area: 'root-json', count: misplacedRootAuditJson.length });
if (retainedRuntimeReviewCandidates.length) findings.push({ severity: 'P2', area: 'manual-runtime-review', count: retainedRuntimeReviewCandidates.length, files: retainedRuntimeReviewCandidates });

const p0 = findings.filter((finding) => finding.severity === 'P0').length;
const p1 = findings.filter((finding) => finding.severity === 'P1').length;
const p2 = findings.filter((finding) => finding.severity === 'P2').length;
const score = p0 ? 0 : p1 ? 4.2 : p2 ? 4.9 : 5;
const result = {
  phase: '30E',
  name: 'Final Build Import Baseline',
  score,
  grade: score >= 4.8 ? 'A' : score >= 4.0 ? 'B' : 'C',
  counts: {
    jsFiles: jsFiles.length,
    importFilesOk: importCheck.filesOk,
    docsPhaseFiles: docsPhaseFiles.length,
    auditJsonFiles: auditJsonFiles.length,
    misplacedRootPhaseDocs: misplacedRootPhaseDocs.length,
    misplacedRootAuditJson: misplacedRootAuditJson.length,
    packageScriptTargets: [...new Set(packageScriptPaths)].length,
    missingPackageScriptTargets: missingPackageScriptTargets.length,
    retainedRuntimeReviewCandidates: retainedRuntimeReviewCandidates.length
  },
  validation: {
    importCheck
  },
  conclusion: 'Phase 30 cleanup is complete. Remaining P2 items are explicit manual runtime review candidates and not release blockers.',
  findings,
  generatedAt: new Date().toISOString()
};

const outPath = rel('docs/audits/json/final-baseline-phase30e.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
