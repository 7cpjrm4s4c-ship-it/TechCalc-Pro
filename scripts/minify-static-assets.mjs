import fs from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';

const root = process.cwd();
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

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
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

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of COPY_ENTRIES) copyEntry(entry);

const minifyTargets = [
  ...walkFiles(path.join(outDir, 'js'), file => path.extname(file) === '.js'),
  ...walkFiles(path.join(outDir, 'css'), file => path.extname(file) === '.css')
];

if (exists('service-worker.js')) {
  minifyTargets.push(path.join(outDir, 'service-worker.js'));
}

for (const file of minifyTargets) await minifyFile(file);

console.log(`static assets minified to dist/ (${minifyTargets.length} files, no bundling)`);
