import fs from 'node:fs';

const view = fs.readFileSync('js/modules/buffer-storage/view.js', 'utf8');
const css = fs.readFileSync('css/modules.css', 'utf8');

const failures = [];

if (!view.includes('function renderCompareSections')) failures.push('compare mode must use a dedicated renderCompareSections function.');
if (!view.includes('data-buffer-compare-sections')) failures.push('compare wrapper must expose data-buffer-compare-sections for a stable layout hook.');
if (!view.includes('style="display:grid;row-gap:var(--space-2);gap:var(--space-2);align-content:start"')) failures.push('compare wrapper must carry inline grid gap so dynamic alias cleanup cannot remove spacing again.');
if (!/const sections = \[\s*renderRuntimeInputs\(vm\),\s*renderDefrostInputs\(vm\),\s*renderReserveInputs\(vm\)\s*\]/s.test(view)) failures.push('compare sections must include runtime, defrost and reserve cards in order.');
if (!/\[data-buffer-dynamic="input-blocks"\]\s*\{[^}]*display:\s*grid[^}]*gap:\s*var\(--space-2\)/s.test(css)) failures.push('input-blocks island must have a grid fallback with var(--space-2) gap.');
if (!/\.buffer-compare-sections\s*\{[^}]*display:\s*grid[^}]*gap:\s*var\(--space-2\)/s.test(css)) failures.push('compare wrapper CSS fallback must use grid with var(--space-2) gap.');

if (failures.length) {
  console.error('Phase 38D.4 buffer compare root-cause guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Phase 38D.4 buffer compare root-cause guard passed.');
