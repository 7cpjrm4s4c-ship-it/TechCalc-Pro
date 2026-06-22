import { readFileSync } from 'node:fs';
import { calculate } from '../js/modules/buffer-storage/logic.js';
import { createBufferStorageViewModel, bufferModeOptions } from '../js/modules/buffer-storage/viewModel.js';
import { renderInputBlocks } from '../js/modules/buffer-storage/view.js';

function fail(message){
  console.error(`Phase 38D.9 failed: ${message}`);
  process.exit(1);
}

const view = readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const schema = readFileSync('js/modules/buffer-storage/schema.js', 'utf8');
const viewModel = readFileSync('js/modules/buffer-storage/viewModel.js', 'utf8');

if (bufferModeOptions.some(option => option.value === 'compare')) fail('compare remains in bufferModeOptions');
if (/value:\s*['"]compare['"]/.test(schema)) fail('compare remains in buffer-storage schema segment options');
if (/label:\s*['"]Vergleich['"]/.test(viewModel) || /label:\s*['"]Vergleich['"]/.test(schema)) fail('Vergleich remains in buffer switch options');
if (/isCompareMode/.test(view) || /isCompareMode/.test(viewModel)) fail('compare render flag/branch remains active');

const legacyCompareState = {
  calculationMode: 'compare',
  mediumMode: 'water',
  qMaxKw: '10',
  partLoadFactor: '0.25',
  qLoadKw: '0',
  compressorRunTimeMin: '1',
  controllerDeltaT: '1.25',
  existingSystemVolumeL: '0'
};

const vm = createBufferStorageViewModel(legacyCompareState);
if (vm.state.calculationMode !== 'runtime') fail('legacy compare state must normalize to runtime in the view model');

const result = calculate(legacyCompareState);
const runtimeResult = calculate({ ...legacyCompareState, calculationMode: 'runtime' });
if (result.decisiveVolume !== runtimeResult.decisiveVolume) fail('legacy compare calculation must fall back to runtime');

const html = renderInputBlocks(vm);
const cardCount = (html.match(/<section class="card/g) || []).length;
if (cardCount !== 1) fail(`normalized legacy compare mode must render one input card, found ${cardCount}`);

console.log('Phase 38D.9 buffer storage compare removal guard passed.');
