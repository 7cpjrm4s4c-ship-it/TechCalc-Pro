import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testsRoot = path.join(root, 'tests');
const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function resolveImport(importer, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(importer), specifier);
  const candidates = [base, `${base}.js`, `${base}.mjs`, path.join(base, 'index.js'), path.join(base, 'index.mjs')];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

function exportedNames(file, seen = new Set()) {
  const key = path.resolve(file);
  if (seen.has(key)) return new Set();
  seen.add(key);
  const source = fs.readFileSync(file, 'utf8');
  const names = new Set();

  for (const match of source.matchAll(/\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  if (/\bexport\s+default\b/.test(source)) names.add('default');

  for (const match of source.matchAll(/\bexport\s*\{([^}]+)\}(?:\s+from\s+['"]([^'"]+)['"])?/g)) {
    for (const entry of match[1].split(',')) {
      const clean = entry.trim().replace(/^type\s+/, '');
      if (!clean) continue;
      const parts = clean.split(/\s+as\s+/);
      names.add((parts[1] || parts[0]).trim());
    }
  }

  for (const match of source.matchAll(/\bexport\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const target = resolveImport(file, match[1]);
    if (target) for (const name of exportedNames(target, seen)) if (name !== 'default') names.add(name);
  }
  return names;
}

function importedBindings(clause) {
  const names = [];
  const trimmed = clause.trim();
  if (!trimmed) return names;
  if (trimmed.startsWith('{')) {
    const body = trimmed.slice(1, trimmed.lastIndexOf('}'));
    for (const entry of body.split(',')) {
      const clean = entry.trim().replace(/^type\s+/, '');
      if (!clean) continue;
      names.push(clean.split(/\s+as\s+/)[0].trim());
    }
    return names;
  }
  if (trimmed.startsWith('*')) return names;
  names.push('default');
  const brace = trimmed.indexOf('{');
  if (brace >= 0) names.push(...importedBindings(trimmed.slice(brace)));
  return names;
}

const testFiles = walk(testsRoot).filter(file => /\.(?:mjs|js)$/.test(file));
for (const testFile of testFiles) {
  const source = fs.readFileSync(testFile, 'utf8');
  for (const match of source.matchAll(/\bimport\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    const [, clause, specifier] = match;
    const target = resolveImport(testFile, specifier);
    if (!specifier.startsWith('.')) continue;
    if (!target) {
      failures.push(`${relative(testFile)} imports missing module ${specifier}`);
      continue;
    }
    const available = exportedNames(target);
    for (const name of importedBindings(clause)) {
      if (!available.has(name)) failures.push(`${relative(testFile)} imports missing export ${name} from ${relative(target)}`);
    }
  }
  for (const match of source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const specifier = match[1];
    if (specifier.startsWith('.') && !resolveImport(testFile, specifier)) failures.push(`${relative(testFile)} dynamically imports missing module ${specifier}`);
  }
}

const runnerFiles = [
  'scripts/test-fast.mjs',
  'scripts/test-flooding-verification-phase47c.mjs',
  'scripts/test-integration.mjs',
  'scripts/test-phase47d-regression.mjs'
];
for (const runnerPath of runnerFiles) {
  const full = path.join(root, runnerPath);
  if (!fs.existsSync(full)) {
    failures.push(`missing test runner ${runnerPath}`);
    continue;
  }
  const source = fs.readFileSync(full, 'utf8');
  for (const match of source.matchAll(/['"](tests\/[^'"]+\.(?:mjs|js))['"]/g)) {
    if (!fs.existsSync(path.join(root, match[1]))) failures.push(`${runnerPath} references missing test ${match[1]}`);
  }
}

if (failures.length) {
  console.error('TechCalc Pro 1.4.0 test contract audit failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`TechCalc Pro 1.4.0 test contract audit passed (${testFiles.length} test source files).`);
