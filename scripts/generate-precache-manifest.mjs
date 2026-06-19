import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serviceWorkerPath = path.join(root, 'service-worker.js');

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

function renderAssets(assets) {
  return `const ASSETS = [\n${assets.map(asset => `  '${asset}'`).join(',\n')}\n];`;
}

function updateServiceWorker(assets) {
  const source = fs.readFileSync(serviceWorkerPath, 'utf8');
  const nextSource = source.replace(/const ASSETS = \[[\s\S]*?\];/, renderAssets(assets));
  if (nextSource === source && !source.includes(renderAssets(assets))) {
    throw new Error('Could not replace const ASSETS block in service-worker.js');
  }
  fs.writeFileSync(serviceWorkerPath, nextSource);
}

const assets = collectAssets();
updateServiceWorker(assets);
console.log(`precache manifest generated (${assets.length} assets)`);
