import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/pressure-holding/index.js', 'utf8');
const state = readFileSync('js/modules/pressure-holding/state.js', 'utf8');
const config = readFileSync('js/modules/pressure-holding/config.js', 'utf8');

assert.match(index, /createSavedRecordActions/, 'pressure-holding must use central saved-record actions');
assert.match(index, /renderSavedRecordPanel/, 'pressure-holding must render the central saved-record panel');
assert.match(index, /renderSavedRecordList/, 'pressure-holding must render the central saved-record list');
assert.match(index, /registerCentralActions/, 'pressure-holding saved-record actions must go through the central action registry');
assert.match(index, /commitAllFields/, 'pressure-holding must commit field state before save/update');
assert.doesNotMatch(index, /bindSavedRecordWorkflow/, 'pressure-holding must not use the legacy saved-record workflow');
assert.doesNotMatch(index, /data-ph-save|data-ph-update|data-ph-select|data-ph-delete/, 'pressure-holding must not use legacy ph saved-record selectors');
assert.match(state, /activePlantId:\s*null/, 'pressure-holding state must expose activePlantId');
assert.match(state, /expandedPlantId:\s*null/, 'pressure-holding state must expose expandedPlantId');
assert.match(config, /CENTRAL_SAVED_RECORDS/, 'pressure-holding must declare central saved-record capability');
assert.match(config, /phase-20b2-saved-record-controller/, 'pressure-holding config must record phase 20B.2 migration');

console.log('pressure-holding phase20b2 saved-record controller regression ok');
