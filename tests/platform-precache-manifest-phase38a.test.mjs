import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function listFiles(dir, predicate = () => true) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && predicate(full)) out.push(`./${path.relative(root, full).replaceAll(path.sep, '/')}`);
    }
  };
  walk(base);
  return out.sort();
}

const generatorResult = spawnSync(process.execPath, ['scripts/generate-precache-manifest.mjs'], {
  cwd: root,
  encoding: 'utf8'
});
assert.equal(generatorResult.status, 0, generatorResult.stderr || generatorResult.stdout);

const serviceWorker = read('service-worker.js');
const assetMatch = serviceWorker.match(/const ASSETS = \[([\s\S]*?)\];/);
assert.ok(assetMatch, 'service-worker.js must expose a const ASSETS block');

const assets = [...assetMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
const assetSet = new Set(assets);
const requiredAssets = [
  './',
  './index.html',
  './manifest.json',
  './RELEASE_NOTES.md',
  ...listFiles('css', file => file.endsWith('.css')),
  ...listFiles('js', file => file.endsWith('.js')),
  ...listFiles('assets/icons')
];

const missingAssets = requiredAssets.filter(asset => !assetSet.has(asset));
const staleRuntimeAssets = assets.filter(asset => (
  (asset.startsWith('./js/') || asset.startsWith('./css/')) && !requiredAssets.includes(asset)
));

assert.deepEqual(missingAssets, [], 'generated precache manifest must include every runtime JS/CSS/static shell asset');
assert.deepEqual(staleRuntimeAssets, [], 'generated precache manifest must not keep stale JS/CSS entries');
assert.equal(assets.length, assetSet.size, 'generated precache manifest must not contain duplicate assets');
assert.match(read('package.json'), /"precache": "node scripts\/generate-precache-manifest\.mjs"/);
assert.match(read('package.json'), /"build": "node scripts\/generate-precache-manifest\.mjs && node scripts\/check-js-imports\.mjs"/);

const report = {
  phase: '38A',
  name: 'Automated Precache Manifest',
  status: 'passed',
  assets: {
    total: assets.length,
    js: listFiles('js', file => file.endsWith('.js')).length,
    css: listFiles('css', file => file.endsWith('.css')).length,
    icons: listFiles('assets/icons').length,
    missing: missingAssets.length,
    staleRuntime: staleRuntimeAssets.length
  },
  checks: [
    { id: 'precache:generator-script', status: 'passed' },
    { id: 'precache:all-js-css-discovered', status: 'passed' },
    { id: 'precache:build-integration', status: 'passed' },
    { id: 'precache:no-duplicates', status: 'passed' }
  ]
};
fs.mkdirSync(path.join(root, 'docs/audits/json'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/audits/json/phase38a-precache-manifest.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log('phase38a automated precache manifest guard ok');
