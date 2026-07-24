import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const indexHtml = read('index.html');
const layoutCss = read('css/module-spacing-contract.css');
const renderer = read('js/core/renderer.js');

const moduleViews = [
  'js/platform/moduleRenderer/index.js',
  'js/modules/heating-cooling/view.js',
  'js/modules/ventilation/view.js',
  'js/modules/pipe-sizing/view.js',
  'js/modules/unit-converter/view.js',
  'js/modules/heat-recovery/view.js',
  'js/modules/mixed-air/view.js',
  'js/modules/hx-diagram/view.js',
  'js/modules/drinking-water/view.js',
  'js/modules/pressure-holding/view.js',
  'js/modules/buffer-storage/view.js',
  'js/modules/wastewater/view.js',
  'js/modules/rainwater/view.js',
  'js/modules/flooding-verification/view.js'
];

assert.match(indexHtml, /<link rel="stylesheet" href="\.\/css\/module-spacing-contract\.css">/,
  'index.html must load the module layout contract');
assert.match(renderer, /module-content tc-module-root-stack/,
  'renderModuleShell must author the root-stack class directly');
assert.match(layoutCss, /#app\s*>\s*\.module-view\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  '.module-view must span the complete #app grid');
assert.match(layoutCss, /\.tc-module-layout--2\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
  'desktop two-column layouts must use resilient equal-width tracks');
assert.match(layoutCss, /\.formula,[\s\S]*?\.empty-state,[\s\S]*?\.result-group[\s\S]*?margin-block:\s*0\s*!important/s,
  'formula, note, empty and result blocks must be neutral stack items');
assert.match(layoutCss, /\[data-platform-dynamic\],[\s\S]*?\[data-unit-dynamic\][\s\S]*?margin-block:\s*0\s*!important/s,
  'dynamic islands must not introduce outer margins after calculation');
assert.match(layoutCss, /\.tc-module-section\)\s*>\s*:is\(\.tc-help,\s*\.ph-help\)\s*\{[^}]*margin-top:\s*0\s*!important/s,
  'help text inside authored stacks must use parent gap instead of top margins');

for (const path of moduleViews) {
  const source = read(path);
  assert.doesNotMatch(source, /<div class=["']span-6["']/,
    `${path} still contains legacy sibling span-6 root columns`);
  assert.match(source, /tc-module-layout/,
    `${path} must declare an explicit module layout`);
  assert.match(source, /tc-module-column/,
    `${path} must declare explicit independent columns`);
}

const pipeSizingView = read('js/modules/pipe-sizing/view.js');
assert.doesNotMatch(pipeSizingView, /DIN EN 10255|DIN EN 10220|≤\s*DN50|≥\s*DN65/,
  'pipe-sizing must not expose a static steel-only norm hint in the material-independent layout');

console.log(`Module layout and spacing contract audit passed for ${moduleViews.length} render paths.`);