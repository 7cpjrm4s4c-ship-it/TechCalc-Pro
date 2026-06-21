import assert from 'node:assert/strict';

function createFormMock(entries = []) {
  const listeners = new Map();
  return {
    resetCalled: false,
    addEventListener(type, handler) { listeners.set(type, handler); },
    reportValidity() { return true; },
    reset() { this.resetCalled = true; },
    __listeners: listeners,
    __payload: new Map(entries)
  };
}

class FormDataMock {
  constructor(form) { this.values = new Map(form?.__payload || []); }
  set(key, value) { this.values.set(key, value); }
  get(key) { return this.values.get(key); }
  entries() { return this.values.entries(); }
}

function createStorageMock() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    __values: values
  };
}

globalThis.FormData = FormDataMock;

const controller = await import('../js/platform/shell/feedbackController.js?phase39f');
const form = createFormMock([
  ['subject', 'Baustellenfeedback'],
  ['message', 'Offline erfasst']
]);
const status = { textContent: '', dataset: {} };
const submit = { disabled: false, textContent: 'Feedback senden' };
const storage = createStorageMock();
let fetchCalled = false;

const initialized = controller.initializeFeedbackController({
  appVersion: '1.3.0-rc.1',
  form,
  status,
  submit,
  getRoute: () => 'buffer-storage',
  fetchImpl: async () => { fetchCalled = true; return { ok: true }; },
  storage,
  navigatorRef: { userAgent: 'Phase39F-Test', onLine: false }
});

assert.equal(initialized, true, 'feedback controller should initialize');
await form.__listeners.get('submit')({ preventDefault() {} });

assert.equal(fetchCalled, false, 'offline feedback must not call fetch');
assert.equal(form.resetCalled, false, 'offline feedback must keep the form content visible');
assert.equal(status.dataset.type, 'pending', 'offline fallback should use pending status');
assert.match(status.textContent, /lokal zwischengespeichert/, 'user must be told feedback was saved locally');

const rawQueue = storage.getItem('techcalc.feedback.offlineQueue.v1');
assert.ok(rawQueue, 'offline queue must be written to storage');
const queue = JSON.parse(rawQueue);
assert.equal(queue.length, 1, 'offline queue must contain one item');
assert.equal(queue[0].reason, 'offline', 'offline queue must record reason');
assert.equal(queue[0].payload.message, 'Offline erfasst', 'offline queue must preserve message');
assert.equal(queue[0].payload.route, 'buffer-storage', 'offline queue must include route');
assert.equal(queue[0].payload.userAgent, 'Phase39F-Test', 'offline queue must include user agent');
assert.equal(submit.disabled, false, 'submit button must remain enabled after offline save');

console.log('Phase 39F feedback offline fallback test passed.');
