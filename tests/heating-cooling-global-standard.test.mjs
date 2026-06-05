import fs from 'node:fs';
import assert from 'node:assert/strict';

const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const stateSource = fs.readFileSync('js/modules/heating-cooling/state.js', 'utf8');
const schemaSource = fs.readFileSync('js/modules/heating-cooling/schema.js', 'utf8');
const rendererSource = fs.readFileSync('js/core/renderer.js', 'utf8');
const pipelineSource = fs.readFileSync('js/core/eventPipeline.js', 'utf8');
const lineSectionSource = fs.readFileSync('js/platform/lineSectionController/index.js', 'utf8');
const dynamicRendererSource = fs.readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');

assert.match(stateSource, /moduleId: 'heating-cooling'/, 'heating/cooling state must be registered under a stable module id.');
assert.match(schemaSource, /FIELD_TYPES\.SELECT/, 'medium and pipe fields must be schema select fields.');
assert.match(schemaSource, /MEDIA\.map/, 'medium master data must be exposed through schema options.');
assert.match(schemaSource, /pipeSystems\.map/, 'pipe master data must be exposed through schema options.');
assert.match(schemaSource, /layout:\s*\{[\s\S]*order:\s*\[[\s\S]*medium[\s\S]*operatingMode[\s\S]*activeInputs[\s\S]*result[\s\S]*recommendation[\s\S]*lineSections/, 'ordered platform layout must preserve the approved heating/cooling card flow.');
assert.match(rendererSource, /data-commit="\$\{esc\(commit\)\}"/, 'select fields must mark immediate commits.');
assert.match(rendererSource, /data-lookup="true"/, 'select fields must mark lookup/master-data semantics.');
assert.match(pipelineSource, /field:change:immediate/, 'central pipeline must immediately commit select changes.');
assert.match(pipelineSource, /dispatchAction\(root, state, actionEl, event, options\)/, 'central pipeline must route keyboard actions through central action handlers.');
assert.match(moduleSource, /export default createPlatformModule/, 'heating/cooling must use the platform module runtime.');
assert.doesNotMatch(moduleSource, /function mountHeatingCooling/, 'heating/cooling must not keep a module-owned mount.');
assert.match(lineSectionSource, /registerCentralActions/, 'line records must be registered through the central platform controller.');
assert.match(lineSectionSource, /'line:save'/, 'line save must be a central action.');
assert.match(lineSectionSource, /'line:update'/, 'line update must be a central action.');
assert.match(lineSectionSource, /'saved:load'/, 'saved line selection must be a central action.');
assert.match(lineSectionSource, /hydrateRecord/, 'saved line selection must hydrate complete store state.');
assert.match(dynamicRendererSource, /function setInputValue/, 'field changes must update dynamic values through the platform dynamic renderer.');
assert.ok(dynamicRendererSource.includes('root.__tcHeatingCoolingDynamic'), 'platform dynamic renderer must track previous state to avoid needless card rebuilds.');
assert.match(stateSource, /heatingMassFlowUnit/, 'heating/cooling state must expose heating mass-flow unit switching.');
assert.match(stateSource, /coolingMassFlowUnit/, 'heating/cooling state must expose cooling mass-flow unit switching.');
assert.match(fs.readFileSync('js/utils/pipes.js', 'utf8'), /DIN 16836/, 'Mepla norm must use the short/correct DIN 16836 text.');

console.log('heating-cooling global-standard regression ok');
