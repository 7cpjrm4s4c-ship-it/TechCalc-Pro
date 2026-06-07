import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const state = readFileSync('js/modules/pipe-sizing/state.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');

assert.match(index, /createSavedRecordActions|createLineSectionController/, 'pipe-sizing must use central saved-record actions/controller');
assert.match(index, /renderCard\(s\)|renderSavedRecordPanel/, 'pipe-sizing must render a central saved-record panel/card');
assert.match(index, /renderRows|renderSavedRecordList|createLineSectionController/, 'pipe-sizing must render a central saved-record list');
assert.match(index, /\.bind\(root\)|registerCentralActions/, 'pipe-sizing saved-record actions must go through central delegated bindings');
assert.doesNotMatch(index, /bindSavedRecordWorkflow/, 'pipe-sizing must not use the legacy saved-record workflow');
assert.doesNotMatch(index, /data-pipe-save|data-pipe-update|data-pipe-load|data-pipe-delete/, 'pipe-sizing must not use legacy pipe saved-record selectors');
assert.match(state, /activePipeId:\s*null/, 'pipe-sizing state must expose activePipeId');
assert.match(state, /expandedPipeId:\s*null/, 'pipe-sizing state must expose expandedPipeId');
assert.match(config, /CENTRAL_SAVED_RECORDS/, 'pipe-sizing must declare central saved-record capability');
assert.match(config, /phase-21b2-saved-record-controller/, 'pipe-sizing config must record phase 21B.2 migration');

console.log('pipe-sizing phase21b2 saved-record controller regression ok');
