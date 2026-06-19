import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const minifyScript = fs.readFileSync(path.join(root, 'scripts/minify-static-assets.mjs'), 'utf8');

function fail(message) {
  console.error(`phase38f audit failed: ${message}`);
  process.exit(1);
}

if (!pkg.devDependencies?.esbuild) fail('esbuild is not declared as a devDependency');
if (pkg.scripts?.build !== 'node scripts/generate-precache-manifest.mjs && node scripts/check-js-imports.mjs') fail('standard build must stay unchanged for Phase 38A compatibility');
if (!pkg.scripts?.['build:minified']?.includes('scripts/minify-static-assets.mjs')) fail('build:minified does not produce the minified static artifact');
if (minifyScript.includes('bundle: true')) fail('minification script must not enable bundling');
if (!minifyScript.includes("from 'esbuild'")) fail('minification script must use esbuild directly');
if (!minifyScript.includes("'dist'")) fail('minified output must be isolated in dist/');

console.log('phase38f esbuild minification audit ok');
