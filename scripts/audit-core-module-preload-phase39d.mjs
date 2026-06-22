import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const packagePath = path.join(root, 'package.json');
const integrationPath = path.join(root, 'scripts/test-integration.mjs');

const requiredPreloads = [
  './js/core/app.js',
  './js/core/router.js',
  './js/core/registry.js',
  './js/core/navigation.js',
  './js/core/moduleLifecycleAdapter.js',
  './js/core/moduleRuntime.js',
  './js/core/projectStorage.js'
];

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const moduleScript = '<script type="module" src="./js/core/app.js"></script>';
const scriptIndex = indexHtml.indexOf(moduleScript);
if (scriptIndex === -1) {
  throw new Error('index.html must keep the app module script unchanged');
}

for (const href of requiredPreloads) {
  const link = `<link rel="modulepreload" href="${href}">`;
  const occurrenceCount = indexHtml.split(link).length - 1;
  if (occurrenceCount !== 1) {
    throw new Error(`Expected exactly one modulepreload link for ${href}, found ${occurrenceCount}`);
  }
  if (indexHtml.indexOf(link) > scriptIndex) {
    throw new Error(`modulepreload for ${href} must appear before the app module script`);
  }
  const filePath = path.join(root, href.replace(/^\.\//, ''));
  if (!fs.existsSync(filePath)) {
    throw new Error(`modulepreload target does not exist: ${href}`);
  }
}

const preloadMatches = [...indexHtml.matchAll(/<link\s+rel="modulepreload"\s+href="([^"]+)"\s*>/g)].map(match => match[1]);
const unexpected = preloadMatches.filter(href => !requiredPreloads.includes(href));
if (unexpected.length) {
  throw new Error(`Unexpected modulepreload target(s): ${unexpected.join(', ')}`);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
for (const scriptName of Object.keys(pkg.scripts || {})) {
  if (/^test:phase/i.test(scriptName)) {
    throw new Error(`Phase test script must not be reintroduced in package.json: ${scriptName}`);
  }
}

const integration = fs.readFileSync(integrationPath, 'utf8');
if (!integration.includes('scripts/audit-core-module-preload-phase39d.mjs')) {
  throw new Error('Phase 39D audit must be part of the integration gate');
}

console.log(`Phase 39D core module preload audit ok (${requiredPreloads.length} preloads)`);
