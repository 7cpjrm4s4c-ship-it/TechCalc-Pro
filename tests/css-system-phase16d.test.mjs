import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('css/components.css', 'utf8');

for (const selector of [
  '.tc-card',
  '.tc-card__header',
  '.tc-card__body',
  '.tc-field',
  '.tc-result-list',
  '.tc-result-item',
  '.tc-save-actions',
  '.tc-actions',
  '.tc-scroll-safe'
]) {
  assert.ok(css.includes(selector), `${selector} must exist as a global Phase 16D primitive`);
}

assert.ok(!css.includes('font-size: 12px;\n  font-size: 12px;'), 'duplicated font-size rule should stay removed');
assert.ok((css.match(/!important/g) || []).length <= 35, 'Phase 16D !important budget should not regress');

console.log('css-system-phase16d ok');
