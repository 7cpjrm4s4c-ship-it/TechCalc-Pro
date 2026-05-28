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
assert.match(moduleSource, /state\.set\(\{ \.\.\.hydrateLineSectionState\(item, state\.get\(\)\), expandedLineSectionId: state\.get\(\)\.expandedLineSectionId \}, \{ action: 'line:select' \}\);/, 'saved line selection must hydrate through the store while preserving accordion state.');

console.log('heating-cooling global-standard regression ok');

assert.match(moduleSource, /function mountHeatingCooling/, 'heating/cooling must use the granular mount to avoid full renders on field/select actions.');
assert.match(moduleSource, /data-hc-dynamic/, 'heating/cooling must expose granular dynamic render anchors.');
assert.match(moduleSource, /isDynamicHeatingCoolingAction/, 'heating/cooling must distinguish field actions from structural line actions.');
assert.match(stateSource, /heatingMassFlowUnit/, 'heating/cooling state must expose heating mass-flow unit switching.');
assert.match(stateSource, /coolingMassFlowUnit/, 'heating/cooling state must expose cooling mass-flow unit switching.');
assert.match(fs.readFileSync('js/utils/pipes.js', 'utf8'), /DIN 16836/, 'Mepla norm must use the short/correct DIN 16836 text.');

assert.match(moduleSource, /function hydrateLineSectionState/, 'saved line selection must hydrate complete store state, not patch DOM state.');
assert.match(moduleSource, /setInputValue/, 'field changes must update dynamic values without rebuilding static cards.');
assert.ok(moduleSource.includes('root.__tcHeatingCoolingDynamic'), 'dynamic renderer must track previous state to avoid needless card rebuilds.');


// Phase 12E: line sections are store-first and dynamic updates must not rebuild the static shell.
assert.match(stateSource, /lineSections:\s*\[\]/, 'line sections must be part of the heating/cooling store state.');
assert.match(moduleSource, /const currentItems = \(\) => \{[\s\S]*lineSections/, 'line actions must read saved entries from store-first state.');
assert.match(moduleSource, /persistLineSections/, 'line actions must persist saved entries through one store-first helper.');
assert.match(moduleSource, /data-hc-dynamic="line-sections"/, 'saved line list must have a granular dynamic render anchor.');
assert.match(moduleSource, /updateSaveControls/, 'save/update buttons must update dynamically without a module reload.');
assert.match(moduleSource, /return action !== 'initial';/, 'all post-initial heating/cooling state changes must use the dynamic renderer.');
assert.match(pipelineSource, /onPointerAction/, 'central pipeline must dispatch action buttons on pointer/touch before delayed mobile click.');
assert.match(pipelineSource, /wasPointerActionHandled/, 'central pipeline must suppress duplicate pointer-plus-click actions.');

// Phase 12F: line/save structural actions must not force input-card rebuilds.
assert.doesNotMatch(moduleSource, /updateSaveControls\(root, s\);/, 'static view must not call dynamic save-control updater with an implicit/root variable.');
assert.ok(moduleSource.includes("const lineStructural = /^(line:|saved:)/.test(action);"), 'line/saved actions must be classified separately from app structural actions.');
assert.match(moduleSource, /if \(modeChanged \|\| targetChanged \|\| unitChanged \|\| appStructural\)/, 'saved line actions must not rebuild input fields unless mode/target/unit changed.');
assert.doesNotMatch(moduleSource, /modeChanged \|\| targetChanged \|\| unitChanged \|\| structural/, 'legacy structural flag must not drive input-field rebuilds.');


// Phase 12J+ UX: selection, scroll gestures and accordion state must be independent.
assert.match(moduleSource, /const currentExpanded = state\.get\(\)\.expandedLineSectionId;/, 'accordion toggle must be derived from store state, not transient DOM classes.');
assert.doesNotMatch(moduleSource, /card\.classList\.toggle\('is-collapsed'/, 'accordion state must not be mutated directly in the DOM.');
assert.match(pipelineSource, /shouldSuppressTouchAction/, 'touch-scroll gestures must not dispatch saved/save/toggle actions.');
assert.match(pipelineSource, /touchmove/, 'central pipeline must track movement to distinguish scroll from tap.');
