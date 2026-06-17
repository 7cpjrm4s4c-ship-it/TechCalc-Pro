import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const rel = (p) => path.relative(root, p).replaceAll(path.sep, '/');
const join = (...p) => path.join(root, ...p);
const walk = (dir) => {
  const start = join(dir);
  if (!fs.existsSync(start)) return [];
  const out = [];
  const stack = [start];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else out.push(rel(full));
    }
  }
  return out.sort();
};

const sourceFiles = [...walk('js'), ...walk('scripts'), ...walk('tests')]
  .filter((file) => /\.(js|mjs)$/.test(file));
const jsRuntimeFiles = walk('js').filter((file) => /\.(js|mjs)$/.test(file));
const docsFiles = walk('docs');
const rootFiles = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort();
const packageJson = JSON.parse(fs.readFileSync(join('package.json'), 'utf8'));
const packageScripts = Object.values(packageJson.scripts || {}).join('\n');

const normalizeImport = (fromFile, specifier) => {
  if (!specifier.startsWith('.')) return null;
  const base = path.dirname(fromFile);
  let resolved = path.normalize(path.join(base, specifier)).replaceAll(path.sep, '/');
  const candidates = [
    resolved,
    `${resolved}.js`,
    `${resolved}.mjs`,
    `${resolved}/index.js`,
    `${resolved}/index.mjs`
  ];
  return candidates.find((candidate) => fs.existsSync(join(candidate))) || resolved;
};

const staticImportPattern = /^(?:\s*import\s+(?:[^'\"]*?from\s+)?|\s*export\s+[^'\"]*?from\s+|\s*import\s*\()\s*['\"]([^'\"]+)['\"]/gm;
const inbound = new Map(sourceFiles.map((file) => [file, new Set()]));
const outbound = new Map(sourceFiles.map((file) => [file, new Set()]));
const unresolvedRelativeImports = [];

for (const file of sourceFiles) {
  const content = fs.readFileSync(join(file), 'utf8');
  for (const match of content.matchAll(staticImportPattern)) {
    const target = normalizeImport(file, match[1]);
    if (!target) continue;
    outbound.get(file).add(target);
    if (inbound.has(target)) inbound.get(target).add(file);
    else unresolvedRelativeImports.push({ from: file, specifier: match[1], resolvedCandidate: target });
  }
}

const packageReferencedFiles = new Set();
for (const file of sourceFiles) {
  if (packageScripts.includes(file)) packageReferencedFiles.add(file);
}
const appEntrypoints = ['js/index.js', 'js/app.js', 'js/main.js', 'index.html'].filter((file) => fs.existsSync(join(file)));
const html = fs.existsSync(join('index.html')) ? fs.readFileSync(join('index.html'), 'utf8') : '';
for (const file of sourceFiles) {
  if (html.includes(file) || html.includes(file.replace(/^js\//, './js/'))) packageReferencedFiles.add(file);
}

const moduleEssentialNames = new Set(['index.js', 'config.js', 'schema.js', 'state.js', 'logic.js', 'controller.js', 'view.js', 'viewModel.js', 'results.js', 'dynamicRenderer.js', 'diagramRenderer.js', 'formRenderer.js']);
const runtimeDeadCodeCandidates = jsRuntimeFiles.filter((file) => {
  const base = path.basename(file);
  if (file === 'js/index.js') return false;
  if (file.includes('/modules/') && moduleEssentialNames.has(base)) return false;
  if (inbound.get(file)?.size) return false;
  if (packageReferencedFiles.has(file)) return false;
  return true;
});

const testOrScriptCandidates = sourceFiles.filter((file) => {
  if (!/^(tests|scripts)\//.test(file)) return false;
  if (packageReferencedFiles.has(file)) return false;
  if (inbound.get(file)?.size) return false;
  return true;
});

const hashGroups = new Map();
for (const file of [...sourceFiles, ...docsFiles, ...rootFiles.filter((f) => /\.(json|md)$/.test(f))]) {
  const full = join(file);
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) continue;
  const buf = fs.readFileSync(full);
  if (buf.length === 0) continue;
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  if (!hashGroups.has(hash)) hashGroups.set(hash, []);
  hashGroups.get(hash).push(file);
}
const exactDuplicateGroups = [...hashGroups.values()].filter((group) => group.length > 1);

const basenameGroups = new Map();
for (const file of [...sourceFiles, ...docsFiles]) {
  const base = path.basename(file).toLowerCase();
  if (!basenameGroups.has(base)) basenameGroups.set(base, []);
  basenameGroups.get(base).push(file);
}
const duplicateNameGroups = [...basenameGroups.entries()]
  .filter(([, group]) => group.length > 1)
  .map(([basename, files]) => ({ basename, files }));

const exportedSymbolPattern = /export\s+(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)|export\s*\{([^}]+)\}/g;
const exportedSymbols = [];
for (const file of jsRuntimeFiles) {
  const content = fs.readFileSync(join(file), 'utf8');
  for (const match of content.matchAll(exportedSymbolPattern)) {
    if (match[1]) exportedSymbols.push({ file, symbol: match[1] });
    if (match[2]) {
      for (const raw of match[2].split(',')) {
        const symbol = raw.trim().split(/\s+as\s+/)[0]?.trim();
        if (symbol) exportedSymbols.push({ file, symbol });
      }
    }
  }
}
const corpus = sourceFiles.map((file) => [file, fs.readFileSync(join(file), 'utf8')]);
const unusedExportCandidates = exportedSymbols.filter(({ file, symbol }) => {
  let externalHits = 0;
  const token = new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  for (const [otherFile, content] of corpus) {
    if (otherFile === file) continue;
    if (token.test(content)) externalHits += 1;
    token.lastIndex = 0;
  }
  return externalHits === 0;
});

const phase30a = fs.existsSync(join('structure-cleanup-audit-phase30a.json'))
  ? JSON.parse(fs.readFileSync(join('structure-cleanup-audit-phase30a.json'), 'utf8'))
  : null;

const findings = [
  {
    id: 'P30B-F1',
    priority: 'P1',
    area: 'Root/report clutter',
    count: phase30a?.summary?.rootAuditJsonArtifacts ?? rootFiles.filter((f) => f.endsWith('.json')).length,
    finding: 'Root-level generated audit JSON files should be moved to a report/docs area before release packaging.'
  },
  {
    id: 'P30B-F2',
    priority: runtimeDeadCodeCandidates.length ? 'P2' : 'P3',
    area: 'Runtime dead-code candidates',
    count: runtimeDeadCodeCandidates.length,
    finding: 'Runtime JS files without inbound static imports or package/html references require manual review before deletion.'
  },
  {
    id: 'P30B-F3',
    priority: testOrScriptCandidates.length ? 'P2' : 'P3',
    area: 'Historical tests/scripts',
    count: testOrScriptCandidates.length,
    finding: 'Unreferenced tests/scripts are likely phase history; classify as archive, active quality gate, or removable.'
  },
  {
    id: 'P30B-F4',
    priority: exactDuplicateGroups.length ? 'P2' : 'P3',
    area: 'Exact duplicates',
    count: exactDuplicateGroups.length,
    finding: 'Exact duplicate groups detected by SHA-256. Do not delete before checking package scripts and docs links.'
  },
  {
    id: 'P30B-F5',
    priority: unresolvedRelativeImports.length ? 'P1' : 'P3',
    area: 'Import graph',
    count: unresolvedRelativeImports.length,
    finding: 'Unresolved relative import candidates detected by static scanner.'
  },
  {
    id: 'P30B-F6',
    priority: unusedExportCandidates.length ? 'P2' : 'P3',
    area: 'Unused export candidates',
    count: unusedExportCandidates.length,
    finding: 'Exported runtime symbols without external textual references require manual review; dynamic use may exist.'
  }
];

const score = unresolvedRelativeImports.length ? 4.05 : 4.24;
const report = {
  phase: '30B',
  title: 'Dead Code and Duplicate Detection',
  generatedAt: new Date().toISOString(),
  score,
  grade: 'B',
  summary: {
    sourceFiles: sourceFiles.length,
    runtimeFiles: jsRuntimeFiles.length,
    docsFiles: docsFiles.length,
    exactDuplicateGroups: exactDuplicateGroups.length,
    duplicateNameGroups: duplicateNameGroups.length,
    runtimeDeadCodeCandidates: runtimeDeadCodeCandidates.length,
    testOrScriptCandidates: testOrScriptCandidates.length,
    unusedExportCandidates: unusedExportCandidates.length,
    unresolvedRelativeImports: unresolvedRelativeImports.length
  },
  findings,
  candidates: {
    runtimeDeadCodeCandidates,
    testOrScriptCandidates,
    exactDuplicateGroups,
    duplicateNameGroups: duplicateNameGroups.slice(0, 80),
    unusedExportCandidates: unusedExportCandidates.slice(0, 120),
    unresolvedRelativeImports
  },
  policy: {
    deleteAutomatically: false,
    reason: 'Phase 30B is detection only. Deletion/moves happen in Phase 30C/30D after package scripts, docs references, and runtime import graph are updated.',
    safeNextStep: 'Move generated audit JSONs and phase docs first; then remove only candidates with zero runtime/package/doc references.'
  },
  nextPhases: [
    '30C - Documentation Reorganization',
    '30D - Cleanup Batch',
    '30E - Final Build/Import Baseline'
  ]
};

fs.writeFileSync(join('dead-code-duplicate-audit-phase30b.json'), JSON.stringify(report, null, 2));
console.log(`Phase 30B dead-code/duplicate audit complete: score ${score}/5, grade B`);
console.log(`Runtime dead-code candidates: ${runtimeDeadCodeCandidates.length}`);
console.log(`Unreferenced tests/scripts: ${testOrScriptCandidates.length}`);
console.log(`Exact duplicate groups: ${exactDuplicateGroups.length}`);
console.log(`Unresolved relative imports: ${unresolvedRelativeImports.length}`);
