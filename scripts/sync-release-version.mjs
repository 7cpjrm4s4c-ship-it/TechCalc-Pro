import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(root, 'package.json');
const packageLockPath = path.join(root, 'package-lock.json');
const manifestPath = path.join(root, 'manifest.json');
const versionModulePath = path.join(root, 'js/core/version.js');
const appPath = path.join(root, 'js/core/app.js');
const floodingReportPath = path.join(root, 'js/modules/flooding-verification/reportAdapter.js');
const releaseNotesControllerPath = path.join(root, 'js/platform/shell/releaseNotesController.js');
const indexPath = path.join(root, 'index.html');
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function stableJson(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function versionModule(version) {
  return `// Generated from package.json by scripts/sync-release-version.mjs. Do not edit manually.\nexport const APP_VERSION = '${version}';\nexport default APP_VERSION;\n`;
}
function syncFile(file, nextSource, check, changes) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current === nextSource) return;
  changes.push(path.relative(root, file).replaceAll(path.sep, '/'));
  if (!check) fs.writeFileSync(file, nextSource);
}
function replaceRequired(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source && !source.includes(replacement)) throw new Error(`Could not synchronize ${label}`);
  return next;
}
function syncRuntimeVersion(file, transform, check, changes) {
  const source = fs.readFileSync(file, 'utf8');
  syncFile(file, transform(source), check, changes);
}
function syncPackageLock(version, check, changes) {
  const source = fs.readFileSync(packageLockPath, 'utf8');
  const packageLock = JSON.parse(source);
  if (!packageLock.packages?.['']) throw new Error('package-lock.json is missing the root package entry');
  let nextSource = source;
  if (packageLock.version !== version) {
    nextSource = replaceRequired(nextSource, /("version"\s*:\s*")[^"]+("\s*,)/, `$1${version}$2`, 'package-lock top-level version');
  }
  if (packageLock.packages[''].version !== version) {
    nextSource = replaceRequired(nextSource, /("packages"\s*:\s*\{\s*""\s*:\s*\{[\s\S]*?"version"\s*:\s*")[^"]+("\s*,)/, `$1${version}$2`, 'package-lock root package version');
  }
  syncFile(packageLockPath, nextSource, check, changes);
}
export function syncReleaseVersion({ check = false } = {}) {
  const pkg = readJson(packageJsonPath);
  const version = String(pkg.version || '').trim();
  if (!SEMVER.test(version)) throw new Error(`package.json contains invalid release version: ${version || '<empty>'}`);
  const changes = [];

  syncFile(versionModulePath, versionModule(version), check, changes);
  const manifest = readJson(manifestPath);
  manifest.version = version;
  syncFile(manifestPath, stableJson(manifest), check, changes);
  syncPackageLock(version, check, changes);
  syncRuntimeVersion(appPath, source => replaceRequired(source, /const APP_VERSION = '[^']+';(?: \/\/ generated from package\.json)?/, `const APP_VERSION = '${version}'; // generated from package.json`, 'app runtime version'), check, changes);
  syncRuntimeVersion(floodingReportPath, source => replaceRequired(source, /appVersion:\s*'[^']+'/m, `appVersion: '${version}'`, 'flooding PDF app version'), check, changes);
  syncRuntimeVersion(releaseNotesControllerPath, source => source.replace(/appVersion = '[^']+'/g, `appVersion = '${version}'`), check, changes);
  syncRuntimeVersion(indexPath, source => source
    .replace(/(<strong data-app-version-current>)[^<]*(<\/strong>)/, `$1${version}$2`)
    .replace(/(<input type="hidden" name="version" value=")[^"]*(">)/, `$1${version}$2`)
    .replace(/(<strong id="appVersion">)[^<]*(<\/strong>)/, `$1${version}$2`), check, changes);
  if (check && changes.length) throw new Error(`Release version is not synchronized from package.json: ${changes.join(', ')}. Run npm run version:sync.`);
  return Object.freeze({ version, changes: Object.freeze([...changes]) });
}
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    const result = syncReleaseVersion({ check: process.argv.includes('--check') });
    const suffix = result.changes.length ? ` (${result.changes.join(', ')})` : '';
    console.log(`TechCalc Pro ${result.version} release version synchronized${suffix}`);
  } catch (error) {
    console.error(error?.message || String(error));
    process.exit(1);
  }
}
