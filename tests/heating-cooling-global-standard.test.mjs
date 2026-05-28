import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const stateSource = fs.readFileSync('js/modules/heating-cooling/state.js', 'utf8');
const schemaSource = fs.readFileSync('js/modules/heating-cooling/schema.js', 'utf8');
const rendererSource = fs.readFileSync('js/core/renderer.js', 'utf8');
const pipelineSource = fs.readFileSync('js/core/eventPipeline.js', 'utf8');

assert.match(stateSource, /moduleId: 'heating-cooling'/, 'heating/cooling state must be registered under a stable module id.');
assert.match(schemaSource, /FIELD_TYPES\.SELECT/, 'medium and pipe fields must be schema select fields.');
assert.match(schemaSource, /MEDIA\.map/, 'medium master data must be exposed through schema options.');
assert.match(schemaSource, /pipeSystems\.map/, 'pipe master data must be exposed through schema options.');
assert.match(rendererSource, /data-commit="\$\{esc\(commit\)\}"/, 'select fields must mark immediate commits.');
assert.match(rendererSource, /data-lookup="true"/, 'select fields must mark lookup/master-data semantics.');
assert.match(pipelineSource, /field:change:immediate/, 'central pipeline must immediately commit select changes.');
assert.match(pipelineSource, /dispatchAction\(root, state, actionEl, event, options\)/, 'central pipeline must route keyboard actions through central action handlers.');
assert.match(moduleSource, /registerCentralActions/, 'heating/cooling must use central actions for line records.');
assert.match(moduleSource, /'line:save'/, 'line save must be a central action.');
assert.match(moduleSource, /'line:update'/, 'line update must be a central action.');
assert.match(moduleSource, /'saved:load'/, 'saved line selection must be a central action.');
assert.match(moduleSource, /state\.set\(savedLineSectionPatch\(item, state\.get\(\)\), \{ action: 'line:select' \}\)/, 'saved line selection must update store through a structural action.');

console.log('heating-cooling global-standard regression ok');

assert.match(moduleSource, /function mountHeatingCooling/, 'heating/cooling must use the granular mount to avoid full renders on field/select actions.');
assert.match(moduleSource, /data-hc-dynamic/, 'heating/cooling must expose granular dynamic render anchors.');
assert.match(moduleSource, /isDynamicHeatingCoolingAction/, 'heating/cooling must distinguish field actions from structural line actions.');
assert.match(stateSource, /heatingMassFlowUnit/, 'heating/cooling state must expose heating mass-flow unit switching.');
assert.match(stateSource, /coolingMassFlowUnit/, 'heating/cooling state must expose cooling mass-flow unit switching.');
assert.match(fs.readFileSync('js/utils/pipes.js', 'utf8'), /DIN 16836/, 'Mepla norm must use the short/correct DIN 16836 text.');
