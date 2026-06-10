import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const dynamicRendererSource = fs.readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');

assert.match(dynamicRendererSource, /createHeatingCoolingDynamicRenderer/, 'platform dynamic renderer factory must exist.');
assert.match(dynamicRendererSource, /function setInputValue/, 'dynamic input synchronization must live in platform renderer.');
assert.match(dynamicRendererSource, /function updateSegment/, 'segment state synchronization must live in platform renderer.');
assert.match(dynamicRendererSource, /lineSectionController\?\.updateControls/, 'saved-line dynamic updates must be delegated through platform line controller.');
assert.match(moduleSource, /createHeatingCoolingDynamicRenderer/, 'heating/cooling must delegate dynamic updates to platform renderer.');
assert.match(moduleSource, /heatingCoolingDynamicRenderer\.update/, 'module adapter must call the centralized dynamic renderer.');
assert.doesNotMatch(moduleSource, /function setInner\(/, 'module must no longer own generic DOM setInner helper.');
assert.doesNotMatch(moduleSource, /function updateCardAccent\(/, 'module must no longer own generic card accent helper.');

console.log('heating-cooling phase18b3 dynamic-renderer regression ok');
