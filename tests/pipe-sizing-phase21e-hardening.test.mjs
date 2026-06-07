import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');
const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const controller = readFileSync('js/modules/pipe-sizing/controller.js', 'utf8');
const viewModel = readFileSync('js/modules/pipe-sizing/viewModel.js', 'utf8');
const view = readFileSync('js/modules/pipe-sizing/view.js', 'utf8');
const dynamicRenderer = readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');
const results = readFileSync('js/modules/pipe-sizing/results.js', 'utf8');
const state = readFileSync('js/modules/pipe-sizing/state.js', 'utf8');

for (const file of ['config.js', 'schema.js', 'state.js', 'logic.js', 'results.js', 'controller.js', 'viewModel.js', 'view.js', 'index.js']) {
  assert.ok(existsSync(`js/modules/pipe-sizing/${file}`), `pipe-sizing platform contract must include ${file}`);
}

assert.match(config, /phase-21e-hardening/, 'config must record phase 21E hardening');
assert.match(config, /CENTRAL_SAVED_RECORDS/, 'pipe-sizing must advertise central saved records');
assert.match(index, /createPlatformModule/, 'pipe-sizing must use platform module runtime');
assert.match(index, /createPipeSizingDynamicRenderer/, 'pipe-sizing must use platform dynamic renderer');
assert.match(controller, /createLineSectionController/, 'pipe-sizing saved records must use line-section controller parity path');
assert.match(controller, /dynamicDataAttr:\s*'data-pipe-dynamic'/, 'pipe-sizing saved island must use module dynamic data attribute');
assert.match(controller, /dynamicAttr:\s*'saved-records'/, 'pipe-sizing saved rows must live in the saved-records dynamic island');
assert.match(controller, /activeIdKey:\s*'activePipeId'/, 'active pipe id must remain controlled centrally');
assert.match(controller, /expandedIdKey:\s*'expandedPipeId'/, 'expanded pipe id must remain controlled centrally');
assert.match(state, /expandedPipeId:\s*null/, 'state must include expandedPipeId for central accordion control');
assert.match(view, /data-pipe-dynamic="input"/, 'view must expose input dynamic island');
assert.match(view, /data-pipe-dynamic="saved-records"/, 'view must expose saved-records dynamic island');
assert.match(view, /data-pipe-dynamic="result"/, 'view must expose result dynamic island');
assert.match(results, /pipeDimensionCardsHtml/, 'result model must preserve dimension comparison cards');
assert.match(results, /pipe-dimension-card/, 'dimension comparison cards must remain rendered as cards');
assert.match(dynamicRenderer, /const savedFields = \['savedPipes', 'activePipeId', 'expandedPipeId'\]/, 'saved dynamic updates must be structural only for saved list and active/expanded ids');
assert.doesNotMatch(dynamicRenderer, /const savedFields = \[[^\]]*pipeName/, 'pipeName typing must not structurally re-render the saved-record panel');

const combined = [index, controller, viewModel, view].join('\n');
assert.doesNotMatch(combined, /mountModule|bindSavedRecordWorkflow|createSavedRecordActions|renderSavedRecordPanel|renderSavedRecordList|data-pipe-save|data-pipe-load|data-pipe-delete|data-saved-/,
  'pipe-sizing must not contain legacy/custom saved-record or old mount paths');
assert.doesNotMatch(index, /card\(|field\(|selectField\(|renderModuleShell\(|createLineSectionController|renderResultModel/,
  'index.js must remain a thin platform adapter');

console.log('pipe-sizing phase21e hardening regression ok');
