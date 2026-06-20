#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { renderInputBlocks } from '../js/modules/buffer-storage/view.js';
import { createBufferStorageViewModel } from '../js/modules/buffer-storage/viewModel.js';
import { state as defaultState } from '../js/modules/buffer-storage/state.js';

const view = readFileSync('js/modules/buffer-storage/view.js', 'utf8');

const vm = createBufferStorageViewModel({
  ...defaultState,
  calculationMode: 'compare',
  qMaxKw: '10',
  qConsumerKw: '8',
  consumerFlowM3h: '2'
});
const html = renderInputBlocks(vm);

const fail = message => {
  console.error(`Phase 38D.7 compatibility audit failed: ${message}`);
  process.exit(1);
};

if (!view.includes('class="tc-stack" data-buffer-dynamic="input-blocks"')) {
  fail('input-blocks island must now use the global tc-stack spacing contract');
}

const cardCount = (html.match(/<section class="card /g) || []).length;
if (cardCount !== 3) {
  fail(`compare mode must render exactly 3 input cards, found ${cardCount}`);
}

if (html.includes('buffer-compare-stack') || view.includes('buffer-input-blocks')) {
  fail('obsolete module-specific compare spacing wrappers must not return');
}

console.log('Phase 38D.7 compatibility audit ok; superseded by Phase 38D.8 global stack contract.');
