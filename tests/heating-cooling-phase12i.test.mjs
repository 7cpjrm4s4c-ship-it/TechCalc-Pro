import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const controller = readFileSync('js/modules/heating-cooling/controller.js', 'utf8');
const lineSectionController = readFileSync('js/platform/lineSectionController/index.js', 'utf8');
const savedRecords = readFileSync('js/core/savedRecords.js', 'utf8');
const eventPipeline = readFileSync('js/core/eventPipeline.js', 'utf8');
const docs = readFileSync('docs/PHASE_12I_HEATING_COOLING_FINAL_STABILIZATION.md', 'utf8');

assert.match(controller, /Conversion to kg\/h happens only inside activeCalculationState\(\)/, 'm3/h display values must not be normalized twice.');
assert.match(controller, /function activeRawInputState\(s/, 'line records must store raw input state separately from calculation state.');
assert.match(controller, /calculationState: activeCalculationState\(currentState\)/, 'line records must keep calculation state for traceability.');
assert.match(index, /expandedLineSectionId/, 'saved-record accordion state must be store-backed.');
assert.match(lineSectionController, /shouldSkipDuplicateAction/, 'line save/update actions must be deduplicated by the platform line-section controller.');
assert.match(savedRecords, /expandedId = null/, 'central saved-record renderer must support persisted expanded state.');
assert.match(eventPipeline, /wasPointerActionHandled\(root, action\)/, 'pointer and touch actions must be deduplicated before dispatch.');
assert.match(docs, /Basis: Phase 12H/, 'Phase 12I must document that it is based on Phase 12H.');

console.log('heating-cooling phase12i final stabilization regression ok');
