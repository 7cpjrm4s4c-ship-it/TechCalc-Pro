import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (message) => {
  console.error(`Phase 38G release package hygiene failed: ${message}`);
  process.exit(1);
};

const forbiddenNames = new Set([
  'coverage',
  'playwright-report',
  'test-results',
  '.cache',
  '.parcel-cache',
  '.turbo',
  '.DS_Store'
]);

const generatedWorkspaceDirs = new Set(['dist', 'node_modules']);
const forbiddenExtensions = new Set(['.zip', '.tgz', '.tar', '.gz', '.br', '.map']);
const forbiddenSuffixes = ['.min.js', '.min.css'];
const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');

    if (entry.isDirectory() && generatedWorkspaceDirs.has(entry.name)) {
      continue;
    }

    if (forbiddenNames.has(entry.name)) {
      findings.push(relative);
      if (entry.isDirectory()) continue;
    }

    if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (forbiddenExtensions.has(ext) || forbiddenSuffixes.some((suffix) => entry.name.endsWith(suffix))) {
        findings.push(relative);
      }
    }

    if (entry.isDirectory()) walk(absolute);
  }
}

walk(root);

if (findings.length > 0) {
  fail(`generated or packaged artifacts must stay outside the source tree:\n${findings.sort().map((item) => `- ${item}`).join('\n')}`);
}

const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const requiredScripts = ['build', 'build:minified', 'precache', 'test', 'test:integration', 'test:e2e'];
for (const scriptName of requiredScripts) {
  if (!packageJson.scripts?.[scriptName]) fail(`missing required npm script: ${scriptName}`);
}

if (packageJson.scripts.build.includes('minify-static-assets')) {
  fail('standard build must not create minified artifacts; use build:minified explicitly');
}

if (!packageJson.scripts['build:minified'].includes('minify-static-assets')) {
  fail('build:minified must invoke scripts/minify-static-assets.mjs');
}

if (!packageJson.scripts['test:integration'].includes('test-integration.mjs')) {
  fail('test:integration must stay routed through the consolidated integration gate');
}

const lockPath = path.join(root, 'package-lock.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
if (!lock.packages?.['node_modules/esbuild']) {
  fail('package-lock.json must pin esbuild for optional minification reproducibility');
}

const serviceWorker = readFileSync(path.join(root, 'service-worker.js'), 'utf8');
if (!/const\s+ASSETS\s*=\s*\[/.test(serviceWorker)) {
  fail('service worker must keep a generated const ASSETS precache block');
}

const precacheCount = (serviceWorker.match(/'\.\//g) || []).length;
if (precacheCount < 100) {
  fail(`service worker generated ASSETS block looks unexpectedly small (${precacheCount} entries)`);
}

const releaseNotes = readFileSync(path.join(root, 'RELEASE_NOTES.md'), 'utf8');
if (!releaseNotes.includes('Phase 38F')) {
  fail('release notes must include Phase 38F before RC hygiene closure');
}

console.log('Phase 38G release package hygiene ok');
