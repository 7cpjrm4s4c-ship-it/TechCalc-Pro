import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, 'js/core/app.js'), 'utf8');
const controllerPath = path.join(root, 'js/platform/shell/serviceWorkerController.js');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.ok(fs.existsSync(controllerPath), 'serviceWorkerController.js must exist');
assert.ok(appSource.includes("import { initializeServiceWorkerController } from '../platform/shell/serviceWorkerController.js';"), 'app.js must import service worker controller');
assert.ok(appSource.includes('initializeServiceWorkerController({ appVersion: APP_VERSION });'), 'app.js must initialize service worker controller');
assert.ok(!appSource.includes("if ('serviceWorker' in navigator)"), 'service worker block must be extracted from app.js');
assert.ok(!appSource.includes('navigator.serviceWorker.register'), 'app.js must not register the service worker directly');
assert.ok(controllerSource.includes('export function initializeServiceWorkerController'), 'service worker controller must export initializer');
assert.ok(controllerSource.includes('let serviceWorkerControllerInitialized = false'), 'service worker controller must be idempotent');
assert.ok(controllerSource.includes('TECHCALC_CACHE_UPDATED'), 'controller must handle cache update messages');
assert.ok(serviceWorkerSource.includes("'./js/platform/shell/serviceWorkerController.js'"), 'service worker must precache service worker controller');

const appLines = appSource.split(/\r?\n/).length;
assert.ok(appLines <= 310, `app.js should be reduced after service worker extraction; got ${appLines} lines`);

const listeners = new Map();
let registeredUrl = null;
let updateCalled = false;
const sessionValues = new Map();

const navigatorRef = {
  serviceWorker: {
    addEventListener(type, handler) { listeners.set(type, handler); },
    register(url) {
      registeredUrl = url;
      return Promise.resolve({ update() { updateCalled = true; } });
    }
  }
};
const windowRef = {
  addEventListener(type, handler) { listeners.set(`window:${type}`, handler); }
};
const sessionStorageRef = {
  setItem(key, value) { sessionValues.set(key, value); }
};

const controller = await import('../js/platform/shell/serviceWorkerController.js?phase37c6');
const initialized = controller.initializeServiceWorkerController({
  appVersion: '1.3.0',
  navigatorRef,
  windowRef,
  sessionStorageRef
});

assert.equal(initialized, true, 'service worker controller should initialize when serviceWorker is available');
assert.equal(listeners.has('message'), true, 'service worker controller must bind message listener');
assert.equal(listeners.has('window:load'), true, 'service worker controller must bind load listener');

listeners.get('message')({ data: { type: 'TECHCALC_CACHE_UPDATED', cache: 'tc-cache' } });
assert.equal(sessionValues.get('techcalc-active-cache'), 'tc-cache', 'cache update message must be stored');

await listeners.get('window:load')();
assert.equal(registeredUrl, './service-worker.js?v=1.3.0', 'service worker registration URL must include app version');
assert.equal(updateCalled, true, 'registration.update must be requested');
assert.equal(controller.initializeServiceWorkerController({ navigatorRef, windowRef, sessionStorageRef }), false, 'controller must be idempotent');

console.log('Phase 37C.6 service worker controller extraction guard passed.');
