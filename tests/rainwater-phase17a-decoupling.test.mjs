import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rainwater = readFileSync('js/modules/rainwater/index.js', 'utf8');
const savedController = readFileSync('js/core/savedRecordController.js', 'utf8');
const resultRenderer = readFileSync('js/core/resultRenderer.js', 'utf8');

assert.match(resultRenderer, /export function renderPrimaryResultCard/, 'platform result renderer must expose primary result cards');
assert.match(resultRenderer, /export function renderNoticeCard/, 'platform result renderer must expose notice cards');
assert.match(savedController, /action === 'toggle-expanded'/, 'savedRecordReducer must own accordion toggle state');
assert.match(savedController, /expandedIdKey/, 'savedRecordReducer must support expanded record state');
assert.match(rainwater, /createSavedRecord/, 'Rainwater must create surfaces through the central saved-record factory');
assert.match(rainwater, /savedRecordReducer/, 'Rainwater surface workflow must reduce through central saved-record reducer');
assert.match(rainwater, /renderPrimaryResultCard/, 'Rainwater result card must use platform result renderer');
assert.match(rainwater, /renderNoticeCard/, 'Rainwater notices must use platform result renderer');
assert.doesNotMatch(rainwater, /removeRecord\(/, 'Rainwater must not delete surfaces through direct module list mutation');
assert.doesNotMatch(rainwater, /createRecordId\(/, 'Rainwater must not allocate record ids outside the central saved-record factory');
assert.doesNotMatch(rainwater, /mainResult\(/, 'Rainwater must not render primary result cards directly');

console.log('rainwater phase17a decoupling ok');
