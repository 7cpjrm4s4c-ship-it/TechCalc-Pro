import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, 'js/core/app.js'), 'utf8');
const controllerPath = path.join(root, 'js/platform/shell/releaseNotesController.js');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.ok(fs.existsSync(controllerPath), 'releaseNotesController.js must exist');
assert.ok(appSource.includes("import { initializeReleaseNotesController } from '../platform/shell/releaseNotesController.js';"), 'app.js must import release notes controller');
assert.ok(appSource.includes('initializeReleaseNotesController({ appVersion: APP_VERSION });'), 'app.js must initialize release notes controller');
assert.ok(!appSource.includes('function parseReleaseNotes('), 'release notes parser must be extracted from app.js');
assert.ok(!appSource.includes('function renderReleaseNotes('), 'release notes renderer must be extracted from app.js');
assert.ok(!appSource.includes('function loadReleaseNotes('), 'release notes loader must be extracted from app.js');
assert.ok(controllerSource.includes('export function parseReleaseNotes'), 'release notes controller must export parser');
assert.ok(controllerSource.includes('export function renderReleaseNotes'), 'release notes controller must export renderer');
assert.ok(controllerSource.includes('export function initializeReleaseNotesController'), 'release notes controller must export initializer');
assert.ok(controllerSource.includes('let releaseNotesControllerInitialized = false'), 'release notes controller must be idempotent');
assert.ok(serviceWorkerSource.includes("'./js/platform/shell/releaseNotesController.js'"), 'service worker must precache release notes controller');

const appLines = appSource.split(/\r?\n/).length;
assert.ok(appLines <= 370, `app.js should be reduced after release notes extraction; got ${appLines} lines`);

const store = new Map();
const versionHost = { textContent: '' };
const host = { innerHTML: '' };
const fallback = { textContent: '# TechCalc Pro 1.3.0 – Fallback\n- Offline notes' };

globalThis.document = {
  getElementById(id) {
    if (id === 'releaseNotesDynamic') return host;
    if (id === 'releaseNotesFallback') return fallback;
    return null;
  },
  querySelector(selector) {
    if (selector === '[data-app-version-current]') return versionHost;
    return null;
  }
};

const controller = await import('../js/platform/shell/releaseNotesController.js');
const parsed = controller.parseReleaseNotes('# TechCalc Pro 1.3.0 – Test\n- Erstes Item\n- Zweites Item');
assert.equal(parsed.length, 1);
assert.equal(parsed[0].version, '1.3.0');
assert.equal(parsed[0].items.length, 2);

controller.renderReleaseNotes(parsed, host);
assert.ok(host.innerHTML.includes('1.3.0'), 'rendered release notes should include version');
assert.ok(host.innerHTML.includes('Erstes Item'), 'rendered release notes should include item text');

await controller.loadReleaseNotes({
  appVersion: '1.3.0',
  host,
  fallback,
  fetchImpl: async url => {
    store.set('url', url);
    return {
      ok: true,
      async text() { return '# TechCalc Pro 1.3.0 – Loaded\n- Loaded item'; }
    };
  }
});
assert.ok(store.get('url').includes('v=1.3.0'), 'release notes request must be versioned');
assert.ok(host.innerHTML.includes('Loaded item'), 'dynamic release notes should render loaded items');

console.log('Phase 37C.4 release notes controller extraction guard passed.');
