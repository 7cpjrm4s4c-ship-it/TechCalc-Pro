import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => {
  console.error(`CSS system hardening failed: ${message}`);
  process.exitCode = 1;
};

const cssFiles = fs.readdirSync(path.join(root, 'css')).filter(name => name.endsWith('.css'));

const saveStateSelectors = ['.tc-save-actions', 'data-save-mode-role', 'data-edit-mode'];
const allowedSaveStateFiles = new Set(['components-save-manager.css', 'components-core.css', 'theme-light-guards.css']);
for (const file of cssFiles) {
  const source = read(`css/${file}`);
  if (!allowedSaveStateFiles.has(file) && saveStateSelectors.some(token => source.includes(token))) {
    fail(`${file} contains save/edit-state selectors; keep this contract in components-save-manager.css`);
  }
}

const lightButtonFiles = ['css/theme-light.css', 'css/theme-light-rollout.css', 'css/theme-light-contrast.css', 'css/components-system.css', 'css/components-save-manager.css', 'css/theme-light-final.css'];
for (const file of lightButtonFiles) {
  const source = read(file);
  const buttonBlocks = [...source.matchAll(/:root\[data-theme='light'\][^{]*(?:\.action-button|\.tc-action|\.primary-button|\.tc-button--primary|button\[type='submit'\])[^{]*\{[^}]*\}/g)];
  for (const match of buttonBlocks) {
    const block = match[0];
    const disabledBlock = /\[disabled\]|:disabled|\.is-disabled|\[aria-disabled/.test(block);
    if (!disabledBlock && /background\s*:\s*(?:#[0-9a-fA-F]{3,8}|var\(--accent-blue\)|var\(--tc-button-primary-bg\))\s*!?important?\s*;/.test(block)) {
      fail(`${file} contains a non-tokenized filled Light button rule: ${block.split('\n')[0]}`);
    }
    if (/color\s*:\s*#fff(?:fff)?\s*!?important?\s*;/.test(block) || /-webkit-text-fill-color\s*:\s*#fff(?:fff)?\s*!?important?\s*;/.test(block)) {
      fail(`${file} contains white Light button text; use --tc-light-text`);
    }
  }
}

const moduleCssFiles = cssFiles.filter(name => /^modules-.*\.css$/.test(name));
const forbiddenModuleComponentSelectors = /(^|\n)\s*(?::root\[data-theme='light'\]\s*)?\.(?:action-button|primary-button|tc-button|tc-save-actions|settings-panel|release-note|theme-switch|segmented)(?:[\s\[\.:,{]|$)/;
for (const file of moduleCssFiles) {
  const source = read(`css/${file}`);
  if (forbiddenModuleComponentSelectors.test(source)) {
    fail(`${file} contains component selectors; module CSS may only contain module layout or domain visualizations`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('CSS system hardening ok');
