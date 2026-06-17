import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['scripts/audit-modules-css-isolation-phase34c.mjs'], { stdio: 'inherit' });

const components = readFileSync('css/components.css', 'utf8');
const modules = readFileSync('css/modules.css', 'utf8');

assert.ok(components.split(/\r?\n/).length < 2000, 'components.css remains below the release limit');
assert.ok(modules.split(/\r?\n/).length < 500, 'modules.css remains a small exception layer');
assert.equal((modules.match(/!important/g) || []).length, 0, 'modules.css has no important overrides');
assert.ok(!/data-module=|module-view\[data-module|\.hx-|\.wrg-|\.pipe-|\.wastewater-|\.rainwater-|\.buffer-/m.test(components), 'components.css is free of module-specific selectors');
assert.ok(/Global component geometry/.test(modules), 'modules.css documents the isolation contract');

console.log('Phase 34C module CSS isolation test passed');
