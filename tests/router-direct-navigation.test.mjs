import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routerSource = readFileSync(new URL('../js/core/router.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');

assert.match(routerSource, /history\.pushState/, 'Router must use one direct pushState render path for module navigation.');
assert.doesNotMatch(routerSource, /window\.location\.hash\s*=\s*`?\/\$\{id\}/, 'Router must not rely on asynchronous hash assignment for app navigation.');
assert.match(routerSource, /window\.addEventListener\('popstate'/, 'Router must still support browser back/forward navigation.');
assert.match(routerSource, /renderCallback\(id\)/, 'navigate(id) must render the selected module immediately.');
assert.match(appSource, /#overflowMenu \[data-module-id\]/, 'Global navigation handler must also cover overflow menu module buttons.');
assert.match(appSource, /currentRoute\(\) === id/, 'Duplicate nav suppression must not block a route that is selected but not rendered yet.');

console.log('router direct navigation ok');
