import { readFileSync } from 'node:fs';
import { renderInputBlocks } from '../js/modules/buffer-storage/view.js';
import { createBufferStorageViewModel } from '../js/modules/buffer-storage/viewModel.js';
import { state as defaultState } from '../js/modules/buffer-storage/state.js';

const css = readFileSync('css/modules.css', 'utf8');
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
  console.error(`Phase 38D.7 audit failed: ${message}`);
  process.exit(1);
};

if (!view.includes('buffer-compare-stack')) {
  fail('renderInputBlocks must emit a dedicated buffer-compare-stack wrapper for compare mode');
}

if (!html.startsWith('<div class="tc-stack buffer-compare-stack">')) {
  fail('compare input blocks must start with the dedicated tc-stack buffer-compare-stack wrapper');
}

const cardCount = (html.match(/<section class="card /g) || []).length;
if (cardCount !== 3) {
  fail(`compare wrapper must contain exactly 3 input cards, found ${cardCount}`);
}

if (!css.includes('.module-view[data-module=\'buffer-storage\'] [data-buffer-dynamic="input-blocks"]') && !css.includes('.module-view[data-module="buffer-storage"] [data-buffer-dynamic="input-blocks"]')) {
  fail('buffer-storage input-blocks island needs an explicit display/gap rule');
}

if (!css.includes('.buffer-compare-stack') || !/\.buffer-compare-stack\s*\{[^}]*display:\s*grid;[^}]*gap:\s*var\(--tc-gap\)/s.test(css)) {
  fail('buffer-compare-stack needs display:grid and gap:var(--tc-gap)');
}

if (!css.includes('.buffer-compare-stack > .card + .card')) {
  fail('compare stack needs a margin fallback for engines or overridden gap contexts');
}

console.log('Phase 38D.7 buffer-storage compare stack audit ok');
