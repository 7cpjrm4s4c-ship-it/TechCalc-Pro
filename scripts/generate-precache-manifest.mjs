import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serviceWorkerPath = path.join(root, 'service-worker.js');
const packageJsonPath = path.join(root, 'package.json');
const releaseNotesPath = path.join(root, 'RELEASE_NOTES.md');
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

function packageMeta() {
  const pkg = readPackageJson();
  if (!pkg.name || !pkg.version) {
    throw new Error('package.json must define name and version for service-worker cache versioning');
  }
  return pkg;
}

function safePackageName(name) {
  return String(name).replace(/^@/, '').replaceAll('/', '-');
}

function packageCacheName(pkg = packageMeta()) {
  return `${safePackageName(pkg.name)}-${pkg.version}`;
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function currentReleaseHeading() {
  if (!fs.existsSync(releaseNotesPath)) return '';
  const markdown = fs.readFileSync(releaseNotesPath, 'utf8');
  const heading = markdown.split(/\r?\n/).find(line => /^#{1,3}\s+/.test(line));
  return heading ? heading.replace(/^#{1,3}\s+/, '').trim() : '';
}

function packageCacheRevision(pkg = packageMeta()) {
  const releaseSlug = slug(currentReleaseHeading());
  return releaseSlug ? `${pkg.version}-${releaseSlug}` : pkg.version;
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

function renderCacheRevision(cacheRevision) {
  return `const CACHE_REVISION = '${cacheRevision}';`;
}

function renderAssets(assets) {
  return `const ASSETS = [\n${assets.map(asset => `  '${asset}'`).join(',\n')}\n];`;
}

function renderServiceWorker(source, assets, cacheName, cacheRevision) {
  let nextSource = source.replace(/const CACHE_NAME = '[^']+';/, renderCacheName(cacheName));
  if (nextSource === source && !source.includes(renderCacheName(cacheName))) {
    throw new Error('Could not replace const CACHE_NAME in service-worker.js');
  }

  nextSource = nextSource.replace(/const CACHE_REVISION = '[^']+';/, renderCacheRevision(cacheRevision));
  if (!nextSource.includes(renderCacheRevision(cacheRevision))) {
    throw new Error('Could not replace const CACHE_REVISION in service-worker.js');
  }

  const withAssets = nextSource.replace(/const ASSETS = \[[\s\S]*?\];/, renderAssets(assets));
  if (withAssets === nextSource && !nextSource.includes(renderAssets(assets))) {
    throw new Error('Could not replace const ASSETS block in service-worker.js');
  }
  return withAssets;
}

const pkg = packageMeta();
const assets = collectAssets();
const cacheName = packageCacheName(pkg);
const cacheRevision = packageCacheRevision(pkg);
const source = fs.readFileSync(serviceWorkerPath, 'utf8');
const nextSource = renderServiceWorker(source, assets, cacheName, cacheRevision);

if (checkMode) {
  if (source !== nextSource) {
    console.error('service-worker.js is not synchronized with package.json version or precache manifest. Run npm run precache.');
    process.exit(1);
  }
  console.log(`precache manifest, cache name and revision are synchronized (${assets.length} assets, ${cacheName}, ${cacheRevision})`);
} else {
  fs.writeFileSync(serviceWorkerPath, nextSource);
  console.log(`precache manifest generated (${assets.length} assets, ${cacheName}, ${cacheRevision})`);
}
