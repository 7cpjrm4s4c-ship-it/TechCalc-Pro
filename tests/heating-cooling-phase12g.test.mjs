import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const configSource = fs.readFileSync('js/modules/heating-cooling/config.js', 'utf8');
const pipelineSource = fs.readFileSync('js/core/eventPipeline.js', 'utf8');

assert.match(configSource, /phase-12(?:g-globalized|h-final-globalized)/, 'heating/cooling config must identify the phase 12G/12H globalized state.');
assert.match(moduleSource, /function updateHeatingCoolingDynamic/, 'heating/cooling must use granular dynamic updates after initial mount.');
assert.match(moduleSource, /return action !== 'initial';/, 'post-initial actions must stay on the dynamic render path.');
assert.match(moduleSource, /updateSaveControls\(root, s, meta\)/, 'saved-entry selection must refresh save/update controls without a full module render.');
assert.match(moduleSource, /data-hc-dynamic="result"/, 'result area must have its own dynamic island.');
assert.match(moduleSource, /data-hc-dynamic="input-fields"/, 'input fields must have their own dynamic island.');
assert.match(moduleSource, /data-hc-dynamic="line-sections"/, 'saved entries must have their own dynamic island.');
assert.match(moduleSource, /lineStructural[\s\S]*updateSaveControls[\s\S]*renderLineSectionRows/, 'line actions must update saved controls/list without rebuilding static cards.');
assert.doesNotMatch(moduleSource, /bindSavedRecordList\(root/, 'legacy saved-record binding must stay removed.');
assert.match(pipelineSource, /add\(root, 'pointerup', onPointerSegment, true\)/, 'mobile pointer path must stay in the central event pipeline.');
assert.match(pipelineSource, /add\(root, 'touchend', onPointerSegment/, 'mobile touch path must stay in the central event pipeline.');

console.log('heating-cooling phase12g regression ok');
