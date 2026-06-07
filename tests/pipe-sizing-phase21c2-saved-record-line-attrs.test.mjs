import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');

assert.match(index, /createLineSectionController/, 'pipe-sizing saved records must use the proven line-section controller path');
assert.match(index, /dynamicDataAttr:\s*'data-pipe-dynamic'/, 'pipe-sizing saved records must keep the pipe dynamic island');
assert.match(index, /dynamicAttr:\s*'saved-records'/, 'pipe-sizing saved records must render into the saved-records island');
assert.doesNotMatch(index, /data-pipe-save|data-pipe-update|data-pipe-load|data-pipe-delete/, 'legacy pipe attrs must remain removed');
assert.match(config, /phase-21c2-saved-record-line-attrs/, 'config must record saved-record line attr fix');

console.log('pipe-sizing phase21c2 saved-record line attrs regression ok');
