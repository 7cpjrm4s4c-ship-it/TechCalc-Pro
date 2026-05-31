import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routerSource = readFileSync(new URL('../js/core/router.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../js/core/app.js', import.meta.url), 'utf8');
const navigationSource = readFileSync(new URL('../js/core/navigation.js', import.meta.url), 'utf8');

assert.match(routerSource, /export async function navigate\(id, options = \{\}\)/, 'navigate must expose one explicit route-change entry point.');
assert.match(routerSource, /renderCallback\(id\)/, 'navigate must render the selected module directly.');
assert.match(routerSource, /options\.force/, 'navigate must be able to force content rendering when the nav state already matches.');
assert.match(appSource, /NAV_INTERACTIVE_SELECTOR/, 'module navigation must be delegated globally.');
assert.match(appSource, /pointermove/, 'module navigation must distinguish scroll gestures from taps.');

const pointerUpBody = appSource.slice(appSource.indexOf('function onGlobalNavPointerUp'), appSource.indexOf('function onGlobalNavClick'));
assert.doesNotMatch(pointerUpBody, /commitGlobalModuleNav/, 'pointerup must not commit module navigation; click is the only activation path.');
assert.match(appSource, /Modul wird geladen/, 'render must clear stale module content before async mount starts.');
assert.match(appSource, /renderNavigation\(id\);/, 'navigation active state is rendered after successful content mount.');
assert.doesNotMatch(appSource, /touchend'\s*,\s*handleGlobalModuleNav/, 'module navigation must not use a second touchend navigation path.');
assert.doesNotMatch(navigationSource, /bindModuleNavButton/, 'navigation rendering must not bind per-button module handlers.');
assert.match(navigationSource, /\.module-nav, #overflowMenu/, 'overflow menu must stay open while interacting or scrolling inside it.');

console.log('router single navigation path ok');
