import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const controller = readFileSync('js/modules/pipe-sizing/controller.js', 'utf8');
const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');

assert.match(controller, /createLineSectionController/, 'pipe-sizing saved records must use the proven line-section controller path');
assert.match(controller, /dynamicDataAttr:\s*'data-pipe-dynamic'/, 'pipe-sizing saved records must keep the pipe dynamic island');
assert.match(controller, /dynamicAttr:\s*'saved-records'/, 'pipe-sizing saved records must render into the saved-records island');
assert.doesNotMatch(index + controller, /data-pipe-save|data-pipe-update|data-pipe-load|data-pipe-delete/, 'legacy pipe attrs must remain removed');

console.log('pipe-sizing phase21c2 saved-record line attrs regression ok');
