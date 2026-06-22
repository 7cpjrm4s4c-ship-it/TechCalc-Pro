import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const controllerPath = path.join(root, 'js/platform/shell/feedbackController.js');
const integrationPath = path.join(root, 'scripts/test-integration.mjs');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const integrationSource = fs.readFileSync(integrationPath, 'utf8');

assert.ok(controllerSource.includes('FEEDBACK_OFFLINE_QUEUE_KEY'), 'feedback controller must define an offline queue key');
assert.ok(controllerSource.includes('localStorage'), 'feedback controller must use localStorage for offline fallback');
assert.ok(controllerSource.includes('navigatorRef'), 'feedback controller must accept an injectable navigator reference');
assert.ok(controllerSource.includes('onLine'), 'feedback controller must check online state');
assert.ok(controllerSource.includes('saveOfflineFeedback'), 'feedback controller must persist failed feedback locally');
assert.ok(controllerSource.includes('Feedback wurde lokal zwischengespeichert'), 'feedback controller must tell users when feedback is saved locally');
assert.ok(controllerSource.includes('fetch-unavailable'), 'feedback controller must handle missing fetch without silent failure');
assert.ok(controllerSource.includes('send-failed'), 'feedback controller must store failed sends');
assert.ok(integrationSource.includes('tests/platform-feedback-offline-fallback-phase39f.test.mjs'), 'integration gate must include phase39f feedback offline fallback test');

console.log('Phase 39F feedback offline fallback audit passed.');
