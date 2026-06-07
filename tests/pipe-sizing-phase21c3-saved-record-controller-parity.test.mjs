import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');

assert.match(index, /createLineSectionController/, 'pipe-sizing must use the same saved-record controller path as stable line-section modules');
assert.match(index, /activeIdKey:\s*'activePipeId'/, 'active pipe id must be controlled by the saved-record controller');
assert.match(index, /expandedIdKey:\s*'expandedPipeId'/, 'expanded pipe id must be controlled by the saved-record controller');
assert.match(index, /hydrateRecord:\s*\(\{ item, currentState \}\) => hydrateSavedPipe\(item, currentState\)/, 'saved pipe load must hydrate through the controller');
assert.match(index, /pipeSizingSavedController\.bind\(root\)/, 'pipe-sizing bind hook must delegate to the controller');
assert.doesNotMatch(index, /createSavedRecordActions|bindSavedRecordWorkflow|data-pipe-save|data-pipe-load|data-pipe-delete/, 'legacy/custom saved-record paths must be removed');
assert.match(config, /phase-21c3-saved-record-controller-parity/, 'config must record the saved-record controller parity fix');

console.log('pipe-sizing phase21c3 saved-record controller parity regression ok');
