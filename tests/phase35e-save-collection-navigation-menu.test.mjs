import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lineController = readFileSync('js/platform/lineSectionController/index.js', 'utf8');
assert.match(lineController, /data-field="\$\{nameKey\}"/, 'saved dialog name input must participate in central field commits');
assert.match(lineController, /__tcLineSectionDirectContext/, 'line section direct action bridge must use refreshed context');
assert.match(lineController, /commitAllFields\(root, state/, 'line save/update actions must commit current inputs before action');

const runtime = readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
assert.match(runtime, /__tcPlatformCollectionContext = \{ collections, state \}/, 'collection context must refresh state per module mount');
assert.match(runtime, /const activeState = context\.state \|\| state/, 'collection handlers must use active module state instead of stale closure state');
assert.match(runtime, /platform:collection:\$\{name\}:pre-add/, 'collection add must commit fields before add');
assert.match(runtime, /preservePlatformUx\(root, \(\) => activeState\.set/, 'collection add/delete must preserve mobile UX and scroll');

const css = readFileSync('css/components.css', 'utf8');
assert.match(css, /Phase 35E: main overflow menu cards/, 'menu scroll hardening must be documented in components.css');
assert.match(css, /overflow-y: auto/, 'main menu must be scrollable for oversized cards');
assert.match(css, /white-space: normal/, 'main menu card text must be able to wrap');

console.log('phase35e save/collection/navigation/menu regression ok');
