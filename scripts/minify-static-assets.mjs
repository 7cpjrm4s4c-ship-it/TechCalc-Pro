import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const outDir = path.join(root, 'dist');

const COPY_ENTRIES = [
  '_headers',
  'index.html',
  'manifest.json',
  'RELEASE_NOTES.md',
  'service-worker.js',
  'css',
  'js',
  'assets',
  'docs/legal'
];

function readPackageJson() {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function copyEntry(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) return;
  const target = path.join(outDir, relativePath);
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.cpSync(source, target, { recursive: true });
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function walkFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (entry.isFile() && predicate(absolutePath)) files.push(absolutePath);
    }
  };
  walk(dir);
  return files.sort();
}

async function minifyFile(filePath) {
  const extension = path.extname(filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const loader = extension === '.css' ? 'css' : 'js';
  const result = await transform(source, {
    loader,
    minify: true,
    sourcemap: false,
    target: loader === 'css' ? 'chrome96' : 'es2020',
    legalComments: 'none'
  });
  fs.writeFileSync(filePath, result.code);
}

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function artifactFiles() {
  return walkFiles(outDir, file => true).map(file => path.relative(outDir, file).replaceAll(path.sep, '/'));
}

function writeBuildMetadata(minifiedFiles) {
  const pkg = readPackageJson();
  const files = artifactFiles();
  const manifest = {
    name: pkg.name,
    version: pkg.version,
    artifact: `${pkg.name}-${pkg.version}`,
    buildPath: 'dist/',
    generatedAt: new Date(0).toISOString(),
    minification: {
      tool: 'esbuild',
      bundling: false,
      files: minifiedFiles.map(file => path.relative(outDir, file).replaceAll(path.sep, '/')).sort()
    },
    files: files.map(file => ({ path: file, sha256: hashFile(path.join(outDir, file)) }))
  };

  fs.writeFileSync(path.join(outDir, 'build-info.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of COPY_ENTRIES) copyEntry(entry);

const minifyTargets = [
  ...walkFiles(path.join(outDir, 'js'), file => path.extname(file) === '.js'),
  ...walkFiles(path.join(outDir, 'css'), file => path.extname(file) === '.css')
];

const serviceWorkerPath = path.join(outDir, 'service-worker.js');
if (fs.existsSync(serviceWorkerPath)) {
  minifyTargets.push(serviceWorkerPath);
}

for (const file of minifyTargets) await minifyFile(file);
writeBuildMetadata(minifyTargets);

const pkg = readPackageJson();
console.log(`${pkg.name}-${pkg.version} deploy artifact generated at dist/ (${minifyTargets.length} minified files, no bundling)`);
