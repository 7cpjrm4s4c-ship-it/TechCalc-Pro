import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => {
  console.error(`Theme color matrix audit failed: ${message}`);
  process.exitCode = 1;
};

const finalCss = read('css/theme-light-final.css');
const moduleTokens = read('css/module-accent-tokens.css');
const index = read('index.html');

const requiredCssMarkers = [
  ['heating canonical token', '--tc-color-heating: #d96b1f'],
  ['cooling canonical token', '--tc-color-cooling: #008fb8'],
  ['buffer canonical token', '--tc-color-buffer: #0072ce'],
  ['pressure canonical token', '--tc-color-pressure: #0072ce'],
  ['air canonical token', '--tc-color-air: #008f9f'],
  ['hx canonical token', '--tc-color-hx: #008f9f'],
  ['pipe canonical token', '--tc-color-pipe: #0072ce'],
  ['water canonical token', '--tc-color-water: #1f8a4c'],
  ['rain canonical token', '--tc-color-rain: #1f8a4c'],
  ['waste canonical token', '--tc-color-waste: #1f8a4c'],
  ['dark cooling visible token', '--tc-color-cooling: #35e5ff'],
  ['dark air visible token', '--tc-color-air: #2fd3c8'],
  ['process cooling route', ".module-view[data-process-accent='cooling']"],
  ['process heating route', ".module-view[data-process-accent='orange']"],
  ['pressure route blue', ".module-view[data-module='pressure-holding'] { --tc-module-accent: var(--tc-color-pressure); }"],
  ['unit route blue', ".module-view[data-module='unit-converter'] { --tc-module-accent: var(--tc-color-pipe); }"],
  ['purple compatibility resolves to pressure', '.card--accent-purple,'],
  ['global ui primary token', '--tc-color-ui-primary']
];

for (const [label, marker] of requiredCssMarkers) {
  if (!finalCss.includes(marker)) fail(`missing ${label}: ${marker}`);
}

for (const [label, marker] of [
  ['light cooling token', '--tc-accent-cooling: #008fb8'],
  ['light pressure token', '--tc-accent-pressure: #0072ce'],
  ['light water token', '--tc-accent-water: #1f8a4c']
]) {
  if (!moduleTokens.includes(marker)) fail(`module-accent-tokens.css missing ${label}`);
}

const moduleAccentExpectations = new Map([
  ['heating-cooling', 'orange'],
  ['ventilation', 'cyan'],
  ['pipe-sizing', 'blue'],
  ['unit-converter', 'blue'],
  ['buffer-storage', 'blue'],
  ['pressure-holding', 'blue'],
  ['drinking-water', 'green'],
  ['rainwater', 'green'],
  ['wastewater', 'green'],
  ['heat-recovery', 'cyan'],
  ['hx-diagram', 'cyan']
]);

for (const [moduleId, accent] of moduleAccentExpectations) {
  const file = `js/modules/${moduleId}/config.js`;
  if (!fs.existsSync(path.join(root, file))) fail(`missing module config ${file}`);
  const source = read(file);
  const idRe = new RegExp(`id\\s*:\\s*['\"]${moduleId}['\"]`);
  const accentRe = new RegExp(`accent\\s*:\\s*['\"]${accent}['\"]`);
  if (!idRe.test(source) || !accentRe.test(source)) fail(`${moduleId} must declare accent '${accent}'`);
}

for (const marker of [
  "data-hc-mode=\"${accent}\" data-process-accent=\"${accent}\"",
  'data-process-accent="${processAccent}"'
]) {
  const sources = [read('js/modules/heating-cooling/view.js'), read('js/modules/ventilation/view.js')].join('\n');
  if (!sources.includes(marker)) fail(`process accent marker missing: ${marker}`);
}

const saveCss = read('css/components-save-manager.css');
for (const marker of [
  '--tc-ui-primary-accent: var(--tc-accent-pipe, #0072ce)',
  '--tc-ui-primary-bg: color-mix(in srgb, var(--tc-color-ui-primary) 16%, #ffffff)',
  "[data-save-mode-role=\'save\']",
  "[data-save-mode-role=\'update\']"
]) {
  if (!saveCss.includes(marker)) fail(`save manager missing global UI contract marker ${marker}`);
}

if (!index.includes('1.3.2-dev.35')) fail('index release notes/current version must be updated to 1.3.2-dev.35');

if (process.exitCode) process.exit(process.exitCode);
console.log('Theme color matrix audit ok');
