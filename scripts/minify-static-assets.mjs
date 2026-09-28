import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
import { detectRuntimeLayout } from './runtime-layout.mjs';

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const outDir = path.join(root, 'dist');
const { coreDir, modulesDir } = detectRuntimeLayout(root);
const CSS_BUNDLE_PATH = 'css/techcalc.bundle.css';

const COPY_ENTRIES = [
  '_headers',
  'index.html',
  'manifest.json',
  'docs/release/RELEASE_NOTES.md',
  'service-worker.js',
  'css',
  coreDir,
  modulesDir,
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

async function consolidateStylesheets() {
  const indexPath = path.join(outDir, 'index.html');
  const index = fs.readFileSync(indexPath, 'utf8');
  const stylesheetPattern = /<link rel="stylesheet" href="\.\/css\/([^"]+\.css)">/g;
  const stylesheets = [...index.matchAll(stylesheetPattern)];
  if (!stylesheets.length) throw new Error('index.html has no CSS stylesheets to consolidate');
  const inlineCss = (file, stack = []) => {
    if (stack.includes(file)) throw new Error(`Circular CSS import: ${[...stack, file].join(' -> ')}`);
    const source = fs.readFileSync(path.join(root, 'css', file), 'utf8');
    const expanded = source.replace(/@import\s+url\(['"]?\.\/([^'"()]+\.css)['"]?\);/g,
      (_, imported) => inlineCss(imported, [...stack, file]));
    if (/@import\b/.test(expanded)) throw new Error(`Unresolved CSS import in ${file}`);
    const relativeUrl = [...expanded.matchAll(/url\(([^)]+)\)/gi)]
      .map(([, value]) => value.trim().replace(/^['"]|['"]$/g, ''))
      .find(value => !/^(?:data:|https?:|\/)/i.test(value));
    if (relativeUrl) {
      throw new Error(`Relative CSS URL in ${file} requires explicit rebasing`);
    }
    return expanded;
  };
  const combined = stylesheets.map(([, file]) => inlineCss(file)).join('\n');
  let insertedBundle = false;
  const rewritten = index.replace(stylesheetPattern, () => {
    if (insertedBundle) return '';
    insertedBundle = true;
    return `<link rel="stylesheet" href="./${CSS_BUNDLE_PATH}">`;
  });
  fs.writeFileSync(indexPath, rewritten);
  const result = await transform(combined, { loader: 'css', minify: true, target: 'chrome96', legalComments: 'none' });
  fs.writeFileSync(path.join(outDir, CSS_BUNDLE_PATH), result.code);
  return { sourceFiles: stylesheets.length, bytes: Buffer.byteLength(result.code) };
}

function precacheConsolidatedCss() {
  const workerPath = path.join(outDir, 'service-worker.js');
  const worker = fs.readFileSync(workerPath, 'utf8');
  const assets = worker.match(/const ASSETS = \[([\s\S]*?)\];/);
  if (!assets) throw new Error('service-worker.js has no precache list');
  const paths = [...assets[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  if (!paths.some(asset => asset.startsWith('./css/'))) throw new Error('service-worker.js has no CSS paths');
  const next = [...paths.filter(asset => !asset.startsWith('./css/')), `./${CSS_BUNDLE_PATH}`];
  fs.writeFileSync(workerPath, worker.replace(assets[0],
    `const ASSETS = [\n${next.map(asset => `  '${asset}'`).join(',\n')}\n];`));
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
      bundling: { javascript: false, css: true },
      files: minifiedFiles.map(file => path.relative(outDir, file).replaceAll(path.sep, '/')).sort()
    },
    files: files.map(file => ({ path: file, sha256: hashFile(path.join(outDir, file)) }))
  };

  fs.writeFileSync(path.join(outDir, 'build-info.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of COPY_ENTRIES) copyEntry(entry);
const cssBundle = await consolidateStylesheets();
precacheConsolidatedCss();

const minifyTargets = [
  ...walkFiles(path.join(outDir, coreDir), file => path.extname(file) === '.js'),
  ...walkFiles(path.join(outDir, modulesDir), file => path.extname(file) === '.js'),
  ...walkFiles(path.join(outDir, 'css'), file => path.extname(file) === '.css')
];

const serviceWorkerPath = path.join(outDir, 'service-worker.js');
if (fs.existsSync(serviceWorkerPath)) {
  minifyTargets.push(serviceWorkerPath);
}

for (const file of minifyTargets) await minifyFile(file);
writeBuildMetadata(minifyTargets);

const pkg = readPackageJson();
console.log(`${pkg.name}-${pkg.version} deploy artifact generated at dist/ (${cssBundle.sourceFiles} stylesheets consolidated into ${cssBundle.bytes} bytes, ${minifyTargets.length} files minified)`);
