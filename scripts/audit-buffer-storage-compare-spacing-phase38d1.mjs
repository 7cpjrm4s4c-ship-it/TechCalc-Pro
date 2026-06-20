import fs from 'node:fs';

const css = fs.readFileSync('css/components.css', 'utf8');
const view = fs.readFileSync('js/modules/buffer-storage/view.js', 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

assert(css.includes('.tc-help--inline { margin-top: 0; }'), 'tc-help inline spacing selector must remain valid');
assert(!css.includes('.tc-help--inline--inline'), 'duplicated tc-help inline selector must not exist');
assert(css.includes('[data-buffer-dynamic="input-blocks"]'), 'buffer input-blocks dynamic container must be grid-spaced');
assert(/\[data-buffer-dynamic="input-blocks"\],[\s\S]*?\{[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*var\(--tc-gap\)/.test(css), 'buffer input-blocks must receive display:grid and gap in the shared dynamic spacing block');
assert(view.includes("return [renderRuntimeInputs(vm), renderDefrostInputs(vm), renderReserveInputs(vm)].join('');"), 'compare mode still renders the three input cards in one dynamic container');

console.log('✅ Phase 38D.1 buffer-storage compare spacing guard passed');
