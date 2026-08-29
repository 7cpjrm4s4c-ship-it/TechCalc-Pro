import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => {
  console.error(`UI polish audit failed: ${message}`);
  process.exitCode = 1;
};

const index = read('index.html');
const css = read('css/components-polish.css');

if (!index.includes('./css/components-polish.css')) fail('components-polish.css must be loaded by index.html');
if (index.indexOf('./css/components-polish.css') > index.indexOf('./css/theme-light-final.css')) {
  fail('components-polish.css must be loaded before theme-light-final.css so the final theme guard remains last');
}

for (const marker of [
  '--tc-line-height-body',
  '--tc-touch-target-min',
  '--tc-focus-ring-strong',
  'button:focus-visible',
  '.card,',
  '.module-nav__track button',
  '@media (max-width: 520px)'
]) {
  if (!css.includes(marker)) fail(`missing polish marker: ${marker}`);
}

for (const forbidden of [
  '--tc-color-heating',
  '--tc-color-cooling',
  '--tc-color-water',
  '--tc-module-accent:'
]) {
  if (css.includes(forbidden)) fail(`components-polish.css must not define module color contract: ${forbidden}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log('UI polish audit ok');
