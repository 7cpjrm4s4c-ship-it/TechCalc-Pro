import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const serviceWorker = read('service-worker.js');
const packageJson = JSON.parse(read('package.json'));
const e2eSpec = read('tests/e2e/phase37b-runtime-smoke.spec.mjs');

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

const assetMatch = serviceWorker.match(/const ASSETS = \[([\s\S]*?)\];/);
const cachedAssets = assetMatch
  ? [...assetMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1])
  : [];
const cachedSet = new Set(cachedAssets);

const requiredAssets = [
  './',
  './index.html',
  './manifest.json',
  './RELEASE_NOTES.md',
  ...listFiles('css', file => file.endsWith('.css')),
  ...listFiles('js', file => file.endsWith('.js')),
  ...listFiles('assets/icons')
].filter((item, index, array) => array.indexOf(item) === index).sort();

const checks = [];
function check(id, passed, detail, extra = {}) {
  checks.push({ id, status: passed ? 'passed' : 'failed', detail, ...extra });
}

const missingAssets = requiredAssets.filter(asset => !cachedSet.has(asset));
const staleAssets = cachedAssets.filter(asset => !requiredAssets.includes(asset));

check('offline-precache:complete-runtime-surface', missingAssets.length === 0, 'service worker precaches every runtime JS/CSS/icon/shell asset', { missingAssets });
check('offline-precache:no-stale-assets', staleAssets.length === 0, 'service worker asset manifest has no stale runtime entries', { staleAssets });
check('offline-precache:all-js-modules', listFiles('js', file => file.endsWith('.js')).every(asset => cachedSet.has(asset)), 'all JavaScript modules are available after first install');
check('offline-strategy:navigation-fallback', /event\.request\.mode === 'navigate'/.test(serviceWorker) && /caches\.match\('\.\/index\.html'\)/.test(serviceWorker), 'offline navigation falls back to cached shell');
check('offline-strategy:cache-first-refresh', /cacheFirstWithRefresh/.test(serviceWorker) && /fetchFresh\(request\);/.test(serviceWorker), 'static assets use cache-first with background refresh');
check('offline-update:versioned-cache', /const CACHE_NAME = 'techcalc-pro-1\.3\.0-rc\.1'/.test(serviceWorker), 'cache name is versioned for deterministic updates');
check('offline-update:skip-waiting', /self\.skipWaiting\(\)/.test(serviceWorker), 'new service worker activates immediately after install');
check('offline-update:client-claim', /self\.clients\.claim\(\)/.test(serviceWorker), 'activated worker claims open clients');
check('offline-update:post-message', /TECHCALC_CACHE_UPDATED/.test(serviceWorker), 'clients receive cache update notification');
check('e2e:offline-all-module-reload', /offline reload keeps every module route available/.test(e2eSpec) && /for \(const moduleId of MODULE_IDS\)/.test(e2eSpec), 'Playwright spec covers offline reload for all module routes');
check('package-script:phase37b3', packageJson.scripts?.['test:phase37b3'] === 'node tests/platform-service-worker-offline-phase37b3.test.mjs', 'package exposes phase37b3 guard');
check('package-script:e2e-phase37b3', packageJson.scripts?.['test:e2e:phase37b3'] === 'playwright test tests/e2e/phase37b-runtime-smoke.spec.mjs', 'package exposes phase37b3 Playwright command');

const report = {
  phase: '37B.3',
  name: 'Service Worker Offline Runtime Hardening',
  status: checks.every(item => item.status === 'passed') ? 'passed' : 'failed',
  generatedAt: new Date().toISOString(),
  assets: {
    required: requiredAssets.length,
    cached: cachedAssets.length,
    missing: missingAssets.length,
    stale: staleAssets.length,
    jsModules: listFiles('js', file => file.endsWith('.js')).length
  },
  checks
};

fs.mkdirSync(path.join(root, 'docs/audits/json'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/audits/json/service-worker-offline-phase37b3.json'), `${JSON.stringify(report, null, 2)}\n`);

if (report.status !== 'passed') {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('phase37b3 service worker offline audit ok');
