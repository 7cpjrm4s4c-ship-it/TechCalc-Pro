import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const fail = message => {
  console.error(`Phase 39B versioned build artifact failed: ${message}`);
  process.exit(1);
};
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const readText = file => fs.readFileSync(path.join(root, file), 'utf8');

const pkg = readJson('package.json');
const scripts = pkg.scripts || {};
if (!scripts['build:minified']?.includes('minify-static-assets.mjs')) {
  fail('build:minified must generate the deploy artifact through scripts/minify-static-assets.mjs');
}
if (scripts.build?.includes('minify-static-assets.mjs')) {
  fail('npm run build must stay a source validation path and must not create dist/');
}
if (!scripts['audit:artifacts']?.includes('audit-versioned-build-artifact-phase39b.mjs')) {
  fail('package.json must expose audit:artifacts for release artifact validation');
}

const sourceForbiddenDirs = ['dist'];
for (const dir of sourceForbiddenDirs) {
  const absolute = path.join(root, dir);
  if (fs.existsSync(absolute)) {
    // dist is allowed only while this audit validates the freshly generated deploy artifact.
    // It must never be committed or packed into the source ZIP; Phase 38G guards source packages.
    continue;
  }
}

const minifier = readText('scripts/minify-static-assets.mjs');
for (const required of ['build-info.json', 'generatedAt: new Date(0).toISOString()', 'artifact:', 'bundling: false']) {
  if (!minifier.includes(required)) fail(`minify-static-assets.mjs missing deterministic artifact contract: ${required}`);
}

execFileSync('node', ['scripts/generate-precache-manifest.mjs'], { stdio: 'inherit' });
execFileSync('node', ['scripts/check-js-imports.mjs'], { stdio: 'inherit' });
execFileSync('node', ['scripts/minify-static-assets.mjs'], { stdio: 'inherit' });

const dist = path.join(root, 'dist');
if (!fs.existsSync(dist)) fail('build:minified did not create dist/');
for (const required of ['index.html', 'service-worker.js', 'manifest.json', 'build-info.json']) {
  if (!fs.existsSync(path.join(dist, required))) fail(`dist/ missing required deploy file: ${required}`);
}

const buildInfo = readJson('dist/build-info.json');
if (buildInfo.name !== pkg.name) fail('build-info.json name does not match package.json');
if (buildInfo.version !== pkg.version) fail('build-info.json version does not match package.json');
if (buildInfo.artifact !== `${pkg.name}-${pkg.version}`) fail('build-info.json artifact id must be name-version');
if (buildInfo.buildPath !== 'dist/') fail('build-info.json buildPath must be dist/');
if (buildInfo.generatedAt !== '1970-01-01T00:00:00.000Z') fail('build-info.json generatedAt must be deterministic');
if (buildInfo.minification?.bundling !== false) fail('build-info.json must state that no bundling is used');
if (!Array.isArray(buildInfo.files) || buildInfo.files.length < 100) fail('build-info.json file manifest is unexpectedly small');

for (const entry of buildInfo.files) {
  const absolute = path.join(dist, entry.path);
  if (!fs.existsSync(absolute)) fail(`build-info.json references missing file: ${entry.path}`);
  const hash = createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
  if (hash !== entry.sha256) fail(`sha256 mismatch for dist/${entry.path}`);
}

const netlifyPath = path.join(root, 'netlify.toml');
if (!fs.existsSync(netlifyPath)) fail('netlify.toml must define the deploy command and publish directory');
const netlify = readText('netlify.toml');
if (!/command\s*=\s*"npm run build:minified"/.test(netlify)) fail('netlify.toml build command must be npm run build:minified');
if (!/publish\s*=\s*"dist"/.test(netlify)) fail('netlify.toml publish directory must be dist');

const report = {
  phase: '39B',
  name: 'Versioned Build Artifact',
  status: 'passed',
  artifact: buildInfo.artifact,
  files: buildInfo.files.length,
  checks: [
    'build:minified creates dist/',
    'dist/build-info.json pins package name and version',
    'dist/build-info.json contains sha256 file manifest',
    'Netlify publishes dist/'
  ]
};
fs.mkdirSync(path.join(root, 'docs/audits/json'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/audits/json/versioned-build-artifact-phase39b.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log('phase39b versioned build artifact audit ok');
