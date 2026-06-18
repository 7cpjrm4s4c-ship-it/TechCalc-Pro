import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, 'js/core/app.js'), 'utf8');
const controllerPath = path.join(root, 'js/platform/shell/settingsController.js');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.ok(fs.existsSync(controllerPath), 'settingsController.js must exist');
assert.ok(appSource.includes("import { initializeSettingsController } from '../platform/shell/settingsController.js';"), 'app.js must import settings controller');
assert.ok(appSource.includes('initializeSettingsController({ settingsPanel, ensurePdfExport });'), 'app.js must initialize settings controller');
assert.ok(!appSource.includes('function setSettingsOpen('), 'settings open state implementation must be extracted from app.js');
assert.ok(!appSource.includes('function lockPageScroll('), 'settings scroll lock implementation must be extracted from app.js');
assert.ok(!appSource.includes('SETTINGS_UI_STORAGE_KEY'), 'settings UI storage key must be owned by settings controller');
assert.ok(controllerSource.includes('function setSettingsOpen('), 'settings controller must own drawer open/close behavior');
assert.ok(controllerSource.includes('function lockPageScroll('), 'settings controller must own page scroll lock');
assert.ok(controllerSource.includes("trackGlobalEventListener(document, 'touchmove'"), 'settings controller must keep mobile background scroll lock');
assert.ok(controllerSource.includes('let settingsControllerInitialized = false'), 'settings controller must be idempotent');
assert.ok(serviceWorkerSource.includes("'./js/platform/shell/settingsController.js'"), 'service worker must precache settings controller');

const appLines = appSource.split(/\r?\n/).length;
assert.ok(appLines <= 430, `app.js should be reduced after settings extraction; got ${appLines} lines`);

console.log('Phase 37C.3 settings controller extraction guard passed.');
