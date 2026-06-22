import fs from 'node:fs';

const checks = [
  ['js/modules/hx-diagram/formRenderer.js', 'data-hx-clear', 'tc-action--ghost'],
  ['js/modules/drinking-water/view.js', 'data-dw-draft-add="unit"', 'action-button--secondary'],
  ['js/modules/drinking-water/view.js', 'data-dw-draft-add="single"', 'action-button--secondary'],
  ['js/modules/wastewater/viewModel.js', 'data-collection="fixtures"', 'action-button--secondary'],
];

let failed = false;
for (const [file, marker, forbidden] of checks) {
  const source = fs.readFileSync(file, 'utf8');
  const idx = source.indexOf(marker);
  if (idx === -1) {
    console.error(`[phase39i] missing marker ${marker} in ${file}`);
    failed = true;
    continue;
  }
  const window = source.slice(Math.max(0, idx - 160), idx + 220);
  if (window.includes(forbidden)) {
    console.error(`[phase39i] ${file} still uses ${forbidden} around ${marker}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('[phase39i] targeted action buttons use accented primary styling.');
