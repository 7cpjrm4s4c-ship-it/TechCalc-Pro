import fs from 'node:fs';

const source = fs.readFileSync(new URL('../js/core/eventPipeline.js', import.meta.url), 'utf8');

if (!source.includes("const keyboardFieldSelector = 'input[data-field], textarea[data-field]';")) {
  throw new Error('Keyboard focus selector must exclude select[data-field]. Native select pickers must not hide the mobile nav.');
}

if (!source.includes("document.body.classList.remove('tc-keyboard-open')")) {
  throw new Error('Select commits must defensively clear tc-keyboard-open to restore the mobile nav pill.');
}

if (/const keyboardFieldSelector\s*=\s*['\"][^'\"]*select\[data-field\]/.test(source)) {
  throw new Error('select[data-field] is still part of the keyboard-open focus selector.');
}

console.log('heating-cooling phase18c2 select focus nav guard passed');
