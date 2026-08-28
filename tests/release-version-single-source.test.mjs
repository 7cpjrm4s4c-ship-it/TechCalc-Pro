import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION } from '../js/core/version.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const manifest = JSON.parse(read('manifest.json'));
const app = read('js/core/app.js');
const floodingReport = read('js/modules/flooding-verification/reportAdapter.js');
const serviceWorker = read('service-worker.js');

assert.equal(APP_VERSION, pkg.version, 'generated APP_VERSION must match package.json');
assert.equal(lock.version, pkg.version, 'package-lock top-level version must match package.json');
assert.equal(lock.packages?.['']?.version, pkg.version, 'package-lock root version must match package.json');
assert.equal(manifest.version, pkg.version, 'manifest version must match package.json');
assert.ok(app.includes(`const APP_VERSION = '${pkg.version}'; // generated from package.json`), 'app runtime version must be synchronized from package.json');
assert.ok(floodingReport.includes(`appVersion: '${pkg.version}'`), 'flooding report must use synchronized app version');
assert.ok(serviceWorker.includes(`const CACHE_NAME = 'techcalc-pro-${pkg.version}';`), 'service-worker cache name must match package version');
assert.ok(serviceWorker.includes(`const CACHE_REVISION = '${pkg.version}-`), 'service-worker cache revision must match package version');
assert.ok(serviceWorker.includes("'./js/core/version.js'"), 'version module must be available offline');
console.log(`release version single-source regression ok (${pkg.version})`);
