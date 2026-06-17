import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const components = readFileSync(join(root, 'css', 'components.css'), 'utf8');
const modules = readFileSync(join(root, 'css', 'modules.css'), 'utf8');

const lineCount = components.split(/\r?\n/).length;
assert.ok(lineCount < 2000, `components.css must stay below 2000 lines, got ${lineCount}`);
assert.ok(components.includes('Phase 34B: rebuilt component system'), 'components.css must identify the rebuilt contract');
assert.ok(modules.includes('Module-specific layout exceptions only'), 'module-specific CSS must be isolated in modules.css');

for (const selector of ['.card', '.control', '.field', '.segmented', '.result-row', '.saved-record-card', '.settings-panel']) {
  assert.ok(components.includes(selector), `global selector ${selector} must live in components.css`);
}

for (const selector of ['.hx-layout', '.wrg-group-grid', '.pipe-dimension-card', '.wastewater-fixture', '.buffer-input-grid']) {
  assert.ok(modules.includes(selector), `module selector ${selector} must live in modules.css`);
}

const importantCount = (components.match(/!important/g) || []).length;
assert.ok(importantCount <= 4, `components.css should avoid important overrides, got ${importantCount}`);

console.log(`Phase 34B components rebuild OK: ${lineCount} lines, ${importantCount} !important overrides.`);
