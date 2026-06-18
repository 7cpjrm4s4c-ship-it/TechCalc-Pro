import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appSource = fs.readFileSync(path.join(root, 'js/core/app.js'), 'utf8');
const controllerPath = path.join(root, 'js/platform/shell/feedbackController.js');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.ok(fs.existsSync(controllerPath), 'feedbackController.js must exist');
assert.ok(appSource.includes("import { initializeFeedbackController } from '../platform/shell/feedbackController.js';"), 'app.js must import feedback controller');
assert.ok(appSource.includes('initializeFeedbackController({'), 'app.js must initialize feedback controller');
assert.ok(appSource.includes('getRoute: currentRoute'), 'feedback controller must receive route provider');
assert.ok(!appSource.includes('function initFeedbackForm('), 'feedback form initializer must be extracted from app.js');
assert.ok(!appSource.includes('const FEEDBACK_ENDPOINT'), 'feedback endpoint constant must be extracted from app.js');
assert.ok(!appSource.includes('function buildPayload()'), 'feedback payload builder must be extracted from app.js');
assert.ok(controllerSource.includes('export function initializeFeedbackController'), 'feedback controller must export initializer');
assert.ok(controllerSource.includes('let feedbackControllerInitialized = false'), 'feedback controller must be idempotent');
assert.ok(controllerSource.includes('DEFAULT_FEEDBACK_ENDPOINT'), 'feedback endpoint default must live in feedback controller');
assert.ok(serviceWorkerSource.includes("'./js/platform/shell/feedbackController.js'"), 'service worker must precache feedback controller');

const appLines = appSource.split(/\r?\n/).length;
assert.ok(appLines <= 325, `app.js should be reduced after feedback extraction; got ${appLines} lines`);

function createFormMock() {
  const listeners = new Map();
  const payload = new Map();
  return {
    resetCalled: false,
    addEventListener(type, handler) { listeners.set(type, handler); },
    reportValidity() { return true; },
    reset() { this.resetCalled = true; },
    __listeners: listeners,
    __payload: payload
  };
}

class FormDataMock {
  constructor(form) { this.form = form; this.values = new Map(form?.__payload || []); }
  set(key, value) { this.values.set(key, value); }
  get(key) { return this.values.get(key); }
}

globalThis.FormData = FormDataMock;
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Phase37C5-Test' }, configurable: true });

const form = createFormMock();
const status = { textContent: '', dataset: {} };
const submit = { disabled: false, textContent: 'Feedback senden' };
const subject = { value: 'TechCalc Pro Feedback' };
let capturedPayload;

const controller = await import('../js/platform/shell/feedbackController.js?phase37c5');
const initialized = controller.initializeFeedbackController({
  appVersion: '1.3.0-rc.1',
  endpoint: 'https://example.invalid/feedback',
  form,
  status,
  submit,
  subject,
  getRoute: () => 'drinking-water',
  fetchImpl: async (_endpoint, options) => {
    capturedPayload = options.body;
    return { ok: true };
  }
});

assert.equal(initialized, true, 'feedback controller should initialize when form exists');
assert.equal(form.__listeners.has('submit'), true, 'feedback controller must bind submit');

await form.__listeners.get('submit')({ preventDefault() {} });

assert.equal(form.resetCalled, true, 'successful feedback submission should reset form');
assert.equal(subject.value, 'TechCalc Pro Feedback', 'feedback subject should be restored after reset');
assert.equal(status.dataset.type, 'success', 'successful feedback submission should set success status');
assert.equal(submit.disabled, false, 'submit button should be re-enabled after submission');
assert.equal(submit.textContent, 'Feedback senden', 'submit text should be restored after submission');
assert.equal(capturedPayload.get('version'), '1.3.0-rc.1', 'feedback payload must include app version');
assert.equal(capturedPayload.get('route'), 'drinking-water', 'feedback payload must include current route');
assert.equal(capturedPayload.get('userAgent'), 'Phase37C5-Test', 'feedback payload must include user agent');
assert.ok(capturedPayload.get('timestamp'), 'feedback payload must include timestamp');

console.log('Phase 37C.5 feedback controller extraction guard passed.');
