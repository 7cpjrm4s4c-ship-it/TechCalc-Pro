import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const rel = (p) => path.relative(root, p).replaceAll(path.sep, '/');
const walk = (dir) => {
  const start = path.join(root, dir);
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
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(root, f));
const jsFiles = walk('js').filter((f) => f.endsWith('.js'));
const runtimeFiles = jsFiles;
const sourceFiles = [...jsFiles, ...walk('scripts').filter((f) => f.endsWith('.mjs')), ...walk('tests').filter((f) => f.endsWith('.mjs'))];
const normalizeImport = (fromFile, specifier) => {
  if (!specifier.startsWith('.')) return null;
  const base = path.dirname(fromFile);
  const resolved = path.normalize(path.join(base, specifier)).replaceAll(path.sep, '/');
  return [resolved, `${resolved}.js`, `${resolved}.mjs`, `${resolved}/index.js`, `${resolved}/index.mjs`].find(exists) || resolved;
};
const importPattern = /^(?:\s*import\s+(?:[^'\"]*?from\s+)?|\s*export\s+[^'\"]*?from\s+|\s*import\s*\()\s*['\"]([^'\"]+)['\"]/gm;
const inbound = new Map(sourceFiles.map((file) => [file, new Set()]));
const unresolved = [];
for (const file of sourceFiles) {
  const content = read(file);
  for (const match of content.matchAll(importPattern)) {
    const target = normalizeImport(file, match[1]);
    if (!target) continue;
    if (inbound.has(target)) inbound.get(target).add(file);
    else unresolved.push({ from: file, specifier: match[1], resolvedCandidate: target });
  }
}
const html = exists('index.html') ? read('index.html') : '';
const packageJson = JSON.parse(read('package.json'));
const packageScripts = Object.values(packageJson.scripts || {}).join('\n');
const essential = new Set(['index.js','config.js','schema.js','state.js','logic.js','controller.js','view.js','viewModel.js','results.js','dynamicRenderer.js','diagramRenderer.js','formRenderer.js','tables.js']);
const currentDocs = walk('docs').filter((f) => /\.(md|json)$/.test(f) && !f.includes('/archive/')).map((f) => [f, read(f)]);
const candidates = runtimeFiles.filter((file) => {
  if (file === 'js/core/app.js' || file === 'js/core/logger.js') return false;
  if (file.includes('/modules/') && essential.has(path.basename(file))) return false;
  if (inbound.get(file)?.size) return false;
  if (html.includes(file) || html.includes(file.replace(/^js\//, './js/'))) return false;
  if (packageScripts.includes(file)) return false;
  if (currentDocs.some(([, content]) => content.includes(file))) return false;
  return true;
});
const duplicateNames = [...new Map(runtimeFiles.map((f) => [path.basename(f).toLowerCase(), []])).entries()];
const suspiciousNames = runtimeFiles.filter((f) => /(?:^|[._-])(?:copy|old|backup|legacy|logic2|render-old|index-copy)(?:[._-]|$)/i.test(path.basename(f)));
const hashes = new Map();
for (const f of runtimeFiles) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
  if (!hashes.has(hash)) hashes.set(hash, []);
  hashes.get(hash).push(f);
}
const exactDuplicateGroups = [...hashes.values()].filter((g) => g.length > 1);
if (unresolved.length || candidates.length || suspiciousNames.length || exactDuplicateGroups.length) {
  console.error('Phase 44B cleanup audit failed.');
  console.error(JSON.stringify({ unresolved, candidates, suspiciousNames, exactDuplicateGroups }, null, 2));
  process.exit(1);
}
console.log(`Phase 44B cleanup audit ok (${runtimeFiles.length} runtime files, no unreferenced undocumented runtime files, no duplicate artifacts)`);
