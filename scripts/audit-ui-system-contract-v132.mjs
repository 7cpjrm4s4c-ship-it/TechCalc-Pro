import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => {
  console.error(`UI system contract failed: ${message}`);
  process.exitCode = 1;
};
const lines = file => read(file).split(/\r?\n/).length;

const deprecatedAggregates = [
  ['css/components.css', 12],
  ['css/modules.css', 12],
  ['css/theme-light-guards.css', 12]
];
for (const [file, max] of deprecatedAggregates) {
  if (!fs.existsSync(path.join(root, file))) fail(`${file} missing`);
  if (lines(file) > max) fail(`${file} must remain a deprecated aggregation stub (<= ${max} lines)`);
}

const requiredCss = [
  './css/tokens.css',
  './css/module-accent-tokens.css',
  './css/components-core.css',
  './css/components-controls.css',
  './css/components-collections.css',
  './css/components-save-manager.css',
  './css/theme-light-contrast.css',
  './css/modules-base.css',
  './css/modules-hx.css',
  './css/modules-wrg.css',
  './css/modules-pipe.css',
  './css/modules-pressure-buffer.css',
  './css/modules-unit.css',
  './css/modules-light-overrides.css',
  './css/modules-responsive.css'
];
const index = read('index.html');
for (const href of requiredCss) {
  if (!index.includes(`href="${href}"`)) fail(`${href} is not linked from index.html`);
}

const moduleCssFiles = fs.readdirSync(path.join(root, 'css')).filter(name => /^modules-.*\.css$/.test(name));
const forbiddenComponentSelectors = /(^|\s)\.(action-button|primary-button|tc-button|settings-panel|release-note|theme-switch)/;
for (const name of moduleCssFiles) {
  const source = read(`css/${name}`);
  if (forbiddenComponentSelectors.test(source)) {
    fail(`${name} contains component-level selectors; move them to css/components-*`);
  }
}

const jsFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel);
    else if (entry.isFile() && entry.name.endsWith('.js')) jsFiles.push(rel);
  }
}
walk('js/modules');
for (const file of jsFiles) {
  const source = read(file);
  const inlineStyleMatches = [...source.matchAll(/style="([^"]*)"/g)];
  for (const match of inlineStyleMatches) {
    if (file === 'js/modules/pipe-sizing/results.js' && /width:\$\{percent\}%/.test(match[1])) continue;
    fail(`${file} contains inline style: ${match[0]}`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('UI system contract ok');
