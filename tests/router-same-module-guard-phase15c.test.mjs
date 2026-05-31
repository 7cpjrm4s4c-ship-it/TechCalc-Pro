import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routerSource = readFileSync(new URL('../js/core/router.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');

assert.match(routerSource, /function isMountedRoute\(id\)/, 'router must detect already mounted modules centrally.');
assert.match(routerSource, /function isPendingRoute\(id\)/, 'router must detect pending modules centrally.');
assert.match(routerSource, /if \(!options\.forceRender && \(mounted \|\| pending\)\)/, 'navigate must guard repeated taps on active or pending modules.');
assert.match(routerSource, /return true;/, 'same-module guard must complete without rendering.');
assert.doesNotMatch(routerSource, /activeRouteId = id;\s*\/\//, 'router must not mark active route before successful content render.');
assert.match(appSource, /isMountedActive \|\| isPendingActive/, 'global nav must skip same-module navigation before showing loading.');
assert.match(appSource, /navigate\(id\);/, 'global nav must use normal navigation instead of forced remounts.');
assert.doesNotMatch(appSource, /navigate\(id, \{ force: true \}\)/, 'global nav must not force remounts on repeated module taps.');

console.log('router same-module guard phase15c regression ok');
