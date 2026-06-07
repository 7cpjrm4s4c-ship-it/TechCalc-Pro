import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const controller = readFileSync('js/core/savedRecordController.js', 'utf8');
const savedCalculation = readFileSync('js/core/savedCalculationController.js', 'utf8');
const pipe = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const docs = readFileSync('docs/PHASE_16B_SAVED_RECORD_CONTROLLER.md', 'utf8');

assert.match(controller, /export function bindSavedRecordWorkflow/, 'central saved-record workflow must exist');
assert.match(controller, /savedRecordReducer/, 'central reducer must own create/update/delete/load patches');
assert.match(controller, /bindSavedRecordList/, 'central workflow must use the global saved-record UI binding');
assert.match(controller, /preserveActionScroll/, 'central workflow must own scroll-safe actions');
assert.match(savedCalculation, /bindSavedRecordWorkflow/, 'savedCalculationController must delegate to the central saved-record workflow');
assert.match(pipe, /createSavedRecordActions|bindSavedRecordWorkflow/, 'pipe-sizing must use central saved-record workflow/actions');
assert.doesNotMatch(pipe, /querySelector\('\[data-pipe-save\]'\)\?\.addEventListener/, 'pipe-sizing must not keep module-owned save listener');
assert.match(docs, /snapshot\(current, result\)/, 'Phase 16B docs must define the domain mapping contract');

console.log('phase16b saved-record controller ok');
