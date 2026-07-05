import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => {
  console.error(`Theme contract audit failed: ${message}`);
  process.exitCode = 1;
};

const index = read('index.html');
const cssHrefs = [...index.matchAll(/<link\s+rel="stylesheet"\s+href="(\.\/css\/[^"]+)"/g)].map(match => match[1]);
if (!cssHrefs.length) fail('no CSS stylesheets linked from index.html');
if (cssHrefs.at(-1) !== './css/theme-light-final.css') {
  fail(`theme-light-final.css must be the last stylesheet, got ${cssHrefs.at(-1)}`);
}

const controls = read('css/components-controls.css');
for (const marker of [
  '.field--action .control',
  '.field:has(> .control > .action-button:only-child) > .control',
  '.field > .control > .action-button:only-child'
]) {
  if (!controls.includes(marker)) fail(`components-controls.css missing action-field contract marker ${marker}`);
}

const finalCss = read('css/theme-light-final.css');
for (const marker of [
  '1.3.2-dev.21 — Final Light Theme component contract',
  '1.3.2-dev.22 — Final UI Hardening contract',
  'background: color-mix(in srgb, var(--tc-active-accent) 18%, #ffffff) !important;',
  'border-color: var(--tc-active-accent) !important;',
  '--tc-contract-accent',
  '.field:has(> .control > .action-button:only-child) > .control'
]) {
  if (!finalCss.includes(marker)) fail(`theme-light-final.css missing final contract marker ${marker}`);
}

const moduleCssFiles = fs.readdirSync(path.join(root, 'css')).filter(name => /^modules-.*\.css$/.test(name));
const forbiddenModuleSelectors = /(?:^|\n)\s*(?::root\[data-theme='light'\]\s*)?\.(?:action-button|primary-button|tc-action|tc-button|tc-save-actions|theme-switch|segmented|settings-panel|release-note|field--action)\b/;
for (const file of moduleCssFiles) {
  const source = read(`css/${file}`);
  if (forbiddenModuleSelectors.test(source)) {
    fail(`${file} contains component/state selectors that belong in css/components-* or css/theme-*`);
  }
}

const wastewater = read('js/modules/wastewater/viewModel.js');
if (!wastewater.includes('field field--action')) fail('wastewater add action must use field--action wrapper');
if (wastewater.includes('action-button--secondary') && wastewater.includes('Gegenstand hinzufügen')) {
  fail('wastewater add action must not use secondary button styling');
}

if (process.exitCode) process.exit(process.exitCode);
console.log('Theme contract audit ok');
