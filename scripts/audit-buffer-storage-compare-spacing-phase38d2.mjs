import fs from 'node:fs';

const viewPath = 'js/modules/buffer-storage/view.js';
const cssPath = 'css/modules.css';
const view = fs.readFileSync(viewPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

const failures = [];

if (!view.includes('buffer-compare-sections')) {
  failures.push('Pufferspeicher compare renderer must wrap compare cards in .buffer-compare-sections.');
}

if (!/isCompareMode[\s\S]*buffer-compare-sections[\s\S]*renderRuntimeInputs[\s\S]*renderDefrostInputs[\s\S]*renderReserveInputs/.test(view)) {
  failures.push('Compare mode must render runtime, defrost and reserve cards inside the compare spacing wrapper.');
}

if (!/\.buffer-compare-sections\s*\{[^}]*display:\s*grid[^}]*gap:\s*var\(--space-2\)/s.test(css)) {
  failures.push('.buffer-compare-sections must define an explicit section gap independent of legacy aliases.');
}

if (!/\.buffer-compare-sections\s*>\s*\.card/.test(css)) {
  failures.push('.buffer-compare-sections should normalize direct card margins.');
}

if (failures.length) {
  console.error('[phase38d2] Buffer storage compare spacing audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[phase38d2] Buffer storage compare spacing audit passed.');
