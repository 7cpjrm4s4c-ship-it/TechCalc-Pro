import fs from 'node:fs';
import { bufferStorageSchema } from '../js/modules/buffer-storage/schema.js';
import { bufferModeOptions, createBufferStorageViewModel } from '../js/modules/buffer-storage/viewModel.js';
import { renderInputBlocks, renderView } from '../js/modules/buffer-storage/view.js';
import { calculate } from '../js/modules/buffer-storage/logic.js';
import { state as bufferStorageState } from '../js/modules/buffer-storage/state.js';

function fail(message) {
  console.error(`Phase 38D.10 buffer compare removal failed: ${message}`);
  process.exit(1);
}

const sourceFiles = [
  'js/modules/buffer-storage/schema.js',
  'js/modules/buffer-storage/viewModel.js',
  'js/modules/buffer-storage/view.js',
  'js/modules/buffer-storage/logic.js',
  'js/modules/buffer-storage/results.js',
  'js/modules/buffer-storage/controller.js',
  'js/modules/buffer-storage/state.js'
];

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (/Vergleich/.test(source)) fail(`${file} still contains Vergleich`);
  if (/isCompareMode|buffer-compare|compare-stack/.test(source)) fail(`${file} still contains compare render structures`);
  if (/value:\s*['"]compare['"]/.test(source)) fail(`${file} still contains a compare option value`);
}

if (bufferModeOptions.length !== 3) fail(`expected exactly 3 buffer modes, found ${bufferModeOptions.length}`);
const modes = bufferModeOptions.map(option => option.value).join(',');
if (modes !== 'runtime,defrost,reserve') fail(`unexpected buffer mode sequence: ${modes}`);
if (bufferModeOptions.some(option => option.value === 'compare' || option.label === 'Vergleich')) fail('compare remains in bufferModeOptions');

const schemaMode = bufferStorageSchema.fields.find(field => field.key === 'calculationMode');
if (!schemaMode) fail('calculationMode schema field missing');
if (schemaMode.options.length !== 3) fail(`expected exactly 3 schema options, found ${schemaMode.options.length}`);
if (schemaMode.options.some(option => option.value === 'compare' || option.label === 'Vergleich')) fail('compare remains in schema options');

const baselineState = bufferStorageState.get();
const legacyCompareState = { ...baselineState, calculationMode: 'compare' };
const vm = createBufferStorageViewModel(legacyCompareState);
if (vm.state.calculationMode !== 'runtime') fail('legacy compare state must normalize to runtime in view model');
const html = renderView(legacyCompareState);
if (/Vergleich|value="compare"|data-value="compare"|isCompareMode|buffer-compare/.test(html)) fail('rendered buffer view still exposes compare structures');
const tabs = html.match(/data-segment="calculationMode"/g) || [];
if (tabs.length !== 3) fail(`rendered switch must expose exactly 3 options, found ${tabs.length}`);

const inputHtml = renderInputBlocks(vm);
const cardCount = (inputHtml.match(/<section class="card/g) || []).length;
if (cardCount !== 1) fail(`legacy compare mode must render one normalized runtime card, found ${cardCount}`);

const result = calculate(legacyCompareState);
const runtimeResult = calculate({ ...baselineState, calculationMode: 'runtime' });
if (result.decisiveVolume !== runtimeResult.decisiveVolume) fail('legacy compare calculation must fall back to runtime');

const sw = fs.readFileSync('service-worker.js', 'utf8');
if (!/phase38d10-buffer-compare-code-removal/.test(sw)) fail('service worker revision was not bumped for compare removal');

console.log('Phase 38D.10 buffer compare full removal guard passed.');
