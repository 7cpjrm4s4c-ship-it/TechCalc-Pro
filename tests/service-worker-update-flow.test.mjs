import assert from 'node:assert/strict';
import { initializeServiceWorkerController } from '../js/platform/shell/serviceWorkerController.js';

const listeners = new Map();
const controllerListeners = new Map();
let registeredUrl = '';
let postedMessage = null;
let reloaded = false;

function add(map, type, handler) {
  const list = map.get(type) || [];
  list.push(handler);
  map.set(type, list);
}
function emit(map, type, payload) {
  (map.get(type) || []).forEach(handler => handler(payload));
}

const waitingWorker = {
  postMessage(message) { postedMessage = message; }
};

const registration = {
  waiting: waitingWorker,
  addEventListener() {},
  update() { return Promise.resolve(); }
};

const body = {
  appended: null,
  appendChild(node) { this.appended = node; }
};
const documentRef = {
  body,
  getElementById() { return null; },
  createElement() {
    const nodeListeners = new Map();
    const nodes = {
      '.tc-update-banner__button': {
        disabled: false,
        textContent: 'Aktualisieren',
        addEventListener(type, handler) { add(nodeListeners, `button:${type}`, handler); }
      },
      '.tc-update-banner__dismiss': {
        addEventListener(type, handler) { add(nodeListeners, `dismiss:${type}`, handler); }
      }
    };
    return {
      id: '',
      className: '',
      hidden: true,
      setAttribute() {},
      remove() {},
      set innerHTML(value) { this._innerHTML = value; },
      get innerHTML() { return this._innerHTML || ''; },
      querySelector(selector) { return nodes[selector] || null; },
      clickUpdate() { emit(nodeListeners, 'button:click', {}); }
    };
  }
};

const navigatorRef = {
  serviceWorker: {
    controller: {},
    addEventListener(type, handler) { add(controllerListeners, type, handler); },
    register(url) { registeredUrl = url; return Promise.resolve(registration); }
  }
};

const windowRef = {
  navigator: navigatorRef,
  location: { reload() { reloaded = true; } },
  addEventListener(type, handler) { add(listeners, type, handler); }
};

assert.equal(initializeServiceWorkerController({ navigatorRef, windowRef, documentRef, appVersion: 'test' }), true);
emit(listeners, 'load', {});
await Promise.resolve();
await Promise.resolve();

assert.match(registeredUrl, /service-worker\.js\?v=test/);
assert.ok(body.appended, 'update banner should be appended when a waiting worker exists');
assert.equal(body.appended.hidden, false);
body.appended.clickUpdate();
assert.deepEqual(postedMessage, { type: 'SKIP_WAITING' });
emit(controllerListeners, 'controllerchange', {});
assert.equal(reloaded, true);

console.log('service-worker update flow ok');
