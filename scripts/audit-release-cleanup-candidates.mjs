import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const textRoots = ['js', 'css', 'scripts', 'tests', 'docs', '.github'];
const checkedExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.md', '.html', '.css', '.yml', '.yaml']);

const cleanupCandidates = [
  'js/shared/rainwaterDomainTables.js',
  'js/shared/rainwaterSurfaceSnapshot.js',
  'js/shared/fGasesSystemSnapshot.js',
  'js/utils/calculations.js',
  'js/utils/pipes.js',
  'js/utils/units.js',
  'js/utils/refrigerants/en378-safety-data.js',
  'js/utils/refrigerants/gwp.js',
  'js/utils/refrigerants/index.js',
  'js/utils/refrigerants/refrigerant-label.js',
  'js/utils/refrigerants/refrigerant-service.js',
  'js/utils/refrigerants/refrigerants.js',
  'js/utils/refrigerants/regulations.js',
  'js/utils/refrigerants/safety-classes.js'
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}
function walk(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const child = path.join(relativePath, entry.name).replaceAll(path.sep, '/');
    if (entry.isDirectory()) files.push(...walk(child));
    if (entry.isFile()) files.push(child);
  }
  return files;
}
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}
function textFiles() {
  return [...new Set(textRoots.flatMap(walk))].filter(file => checkedExtensions.has(path.extname(file)));
}
function normalizeSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const resolved = path.normalize(path.join(path.dirname(fromFile), specifier)).replaceAll(path.sep, '/');
  return path.extname(resolved) ? resolved : `${resolved}.js`;
}
function importSpecifiers(source) {
  const specs = [];
  const re = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(source))) specs.push(match[1]);
  return specs;
}
function referencesFor(candidate, files) {
  const refs = [];
  for (const file of files) {
    if (file === candidate) continue;
    const source = read(file);
    const specifiers = path.extname(file).match(/\.m?js$/) ? importSpecifiers(source) : [];
    const importRefs = specifiers.map(specifier => normalizeSpecifier(file, specifier)).filter(resolved => resolved === candidate);
    const textRef = source.includes(candidate) || source.includes(`./${candidate}`) || source.includes(candidate.replace(/^js\//, './js/'));
    if (importRefs.length || textRef) refs.push({ file, importRefs: importRefs.length, textRef });
  }
  return refs;
}
function classify(candidate, refs) {
  if (!exists(candidate)) return 'deleted';
  if (!refs.length) return 'orphan-candidate';
  if (refs.every(ref => ref.file === 'service-worker.js')) return 'precache-only-candidate';
  if (refs.every(ref => ref.file.startsWith('js/core/') || ref.file === 'service-worker.js')) return 'core-facade-implementation';
  if (refs.some(ref => ref.file.startsWith('js/modules/'))) return 'module-runtime-reference';
  if (refs.some(ref => ref.file.startsWith('tests/') || ref.file.startsWith('scripts/'))) return 'test-or-tooling-reference';
  return 'referenced';
}

const files = textFiles();
const report = cleanupCandidates.map(candidate => {
  const refs = referencesFor(candidate, files);
  return { path: candidate, exists: exists(candidate), classification: classify(candidate, refs), references: refs };
});

console.log('Release cleanup candidate audit');
console.log(`checked candidates: ${report.length}`);
for (const item of report) {
  console.log(`- ${item.path}: ${item.classification}`);
  for (const ref of item.references) console.log(`  referenced by ${ref.file}${ref.importRefs ? ' (import)' : ''}`);
}

if (process.argv.includes('--json')) console.log(JSON.stringify({ report }, null, 2));
