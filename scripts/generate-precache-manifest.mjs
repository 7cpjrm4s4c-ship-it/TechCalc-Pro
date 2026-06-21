import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serviceWorkerPath = path.join(root, 'service-worker.js');
const packageJsonPath = path.join(root, 'package.json');
const checkMode = process.argv.includes('--check');

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './RELEASE_NOTES.md'
];

const GENERATED_DIRS = [
  { dir: 'css', extensions: new Set(['.css']) },
  { dir: 'js', extensions: new Set(['.js']) },
  { dir: 'assets/icons', extensions: null },
  { dir: 'docs/legal', extensions: new Set(['.html']) }
];

function readPackageJson() {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function packageCacheName() {
  const pkg = readPackageJson();
  if (!pkg.name || !pkg.version) {
    throw new Error('package.json must define name and version for service-worker cache versioning');
  }
  const safeName = String(pkg.name).replace(/^@/, '').replaceAll('/', '-');
  return `${safeName}-${pkg.version}`;
}

function toAssetPath(filePath) {
  return `./${path.relative(root, filePath).replaceAll(path.sep, '/')}`;
}

function walkFiles(dir, extensions) {
  const absoluteDir = path.join(root, dir);
  if (!fs.existsSync(absoluteDir)) return [];
  const files = [];

  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (extensions && !extensions.has(path.extname(entry.name))) continue;
      files.push(toAssetPath(absolutePath));
    }
  };

  walk(absoluteDir);
  return files.sort();
}

function collectAssets() {
  const generatedAssets = GENERATED_DIRS.flatMap(({ dir, extensions }) => walkFiles(dir, extensions));
  return [...new Set([...STATIC_ASSETS, ...generatedAssets])];
}

function renderCacheName(cacheName) {
  return `const CACHE_NAME = '${cacheName}';`;
}

function renderAssets(assets) {
  return `const ASSETS = [\n${assets.map(asset => `  '${asset}'`).join(',\n')}\n];`;
}

function renderServiceWorker(source, assets, cacheName) {
  let nextSource = source.replace(/const CACHE_NAME = '[^']+';/, renderCacheName(cacheName));
  if (nextSource === source && !source.includes(renderCacheName(cacheName))) {
    throw new Error('Could not replace const CACHE_NAME in service-worker.js');
  }

  const withAssets = nextSource.replace(/const ASSETS = \[[\s\S]*?\];/, renderAssets(assets));
  if (withAssets === nextSource && !nextSource.includes(renderAssets(assets))) {
    throw new Error('Could not replace const ASSETS block in service-worker.js');
  }
  return withAssets;
}

const assets = collectAssets();
const cacheName = packageCacheName();
const source = fs.readFileSync(serviceWorkerPath, 'utf8');
const nextSource = renderServiceWorker(source, assets, cacheName);

if (checkMode) {
  if (source !== nextSource) {
    console.error('service-worker.js is not synchronized with package.json version or precache manifest. Run npm run precache.');
    process.exit(1);
  }
  console.log(`precache manifest and cache name are synchronized (${assets.length} assets, ${cacheName})`);
} else {
  fs.writeFileSync(serviceWorkerPath, nextSource);
  console.log(`precache manifest generated (${assets.length} assets, ${cacheName})`);
}
