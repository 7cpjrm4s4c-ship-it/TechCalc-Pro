import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('js/modules/pipe-sizing/index.js', 'utf8');
const config = readFileSync('js/modules/pipe-sizing/config.js', 'utf8');

assert.match(index, /loadAttr:\s*'data-line-select'/, 'pipe-sizing saved list must use heating-style load attr');
assert.match(index, /toggleAttr:\s*'data-line-toggle'/, 'pipe-sizing saved list must use heating-style toggle attr');
assert.match(index, /deleteAttr:\s*'data-line-delete'/, 'pipe-sizing saved list must use heating-style delete attr');
assert.match(index, /attrs:\s*\{[\s\S]*loadAttr:\s*'data-line-select'[\s\S]*toggleAttr:\s*'data-line-toggle'[\s\S]*deleteAttr:\s*'data-line-delete'[\s\S]*\}/, 'pipe-sizing saved actions must read the same line attrs rendered by the list');
assert.doesNotMatch(index, /data-pipe-save|data-pipe-update|data-pipe-load|data-pipe-delete/, 'legacy pipe attrs must remain removed');
assert.match(config, /phase-21c2-saved-record-line-attrs/, 'config must record saved-record line attr fix');

console.log('pipe-sizing phase21c2 saved-record line attrs regression ok');
