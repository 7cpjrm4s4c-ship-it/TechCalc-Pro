import fs from 'node:fs';

const view = fs.readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const css = fs.readFileSync('css/modules.css', 'utf8');

function fail(message) {
  console.error(`Phase 38D.8 guard failed: ${message}`);
  process.exit(1);
}

if (!view.includes('class="tc-stack" data-buffer-dynamic="input-blocks"')) {
  fail('buffer input-blocks island must use the global tc-stack spacing contract');
}

const compareBlock = view.match(/export function renderInputBlocks\(vm\) \{[\s\S]*?\n\}/)?.[0] || '';
if (!compareBlock.includes('if (vm.isCompareMode)')) fail('compare branch missing');
if (!compareBlock.includes('renderRuntimeInputs(vm)') || !compareBlock.includes('renderDefrostInputs(vm)') || !compareBlock.includes('renderReserveInputs(vm)')) {
  fail('compare branch must render all three input cards');
}
if (compareBlock.includes('buffer-compare-stack') || compareBlock.includes('buffer-input-blocks')) {
  fail('compare branch must not rely on a module-specific spacing wrapper');
}
if (/buffer-compare-stack|data-buffer-dynamic="input-blocks"[^\{]*\{/.test(css)) {
  fail('modules.css must not carry a competing buffer compare/input-blocks spacing exception');
}

console.log('Phase 38D.8 buffer storage compare global stack guard passed.');
