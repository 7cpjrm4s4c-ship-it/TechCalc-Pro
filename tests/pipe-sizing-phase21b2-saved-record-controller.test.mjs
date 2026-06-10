import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const controller = readFileSync('js/modules/pipe-sizing/controller.js', 'utf8');
const state = readFileSync('js/modules/pipe-sizing/state.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');

assert.match(controller, /createLineSectionController/, 'pipe-sizing must use central saved-record controller');
assert.match(controller, /renderCard\(s\)/, 'pipe-sizing must render a central saved-record card');
assert.match(controller, /\.bind\(root\)/, 'pipe-sizing saved-record actions must go through central delegated bindings');
assert.doesNotMatch(index + controller, /bindSavedRecordWorkflow/, 'pipe-sizing must not use the legacy saved-record workflow');
assert.doesNotMatch(index + controller, /data-pipe-save|data-pipe-update|data-pipe-load|data-pipe-delete/, 'pipe-sizing must not use legacy pipe saved-record selectors');
assert.match(state, /expandedPipeId\s*:\s*null/, 'pipe-sizing must track expanded saved pipe state');
assert.match(config, /CENTRAL_SAVED_RECORDS/, 'pipe-sizing must advertise central saved records');
assert.match(config, /phase-21b2-saved-record-controller/, 'pipe-sizing config must record phase 21B.2 migration');

console.log('pipe-sizing phase21b2 saved-record controller regression ok');
