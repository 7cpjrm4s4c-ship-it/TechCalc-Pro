import { readFileSync } from 'node:fs';

const moduleSource = readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const pipelineSource = readFileSync('js/core/eventPipeline.js', 'utf8');
const lineSectionSource = readFileSync('js/platform/lineSectionController/index.js', 'utf8');
const runtimeSource = readFileSync('js/platform/moduleRuntime/index.js', 'utf8');
const dynamicRendererSource = readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');

const requiredModuleSnippets = [
  'export default createPlatformModule',
  'createHeatingCoolingDynamicRenderer',
  'createLineSectionController',
  'data-hc-dynamic',
  'bindHeatingCoolingPlatform',
  'dynamicUpdate: updateHeatingCoolingDynamic'
];

for (const snippet of requiredModuleSnippets) {
  if (!moduleSource.includes(snippet)) throw new Error(`Heating/cooling platform integration missing required snippet: ${snippet}`);
}

const requiredPlatformSnippets = [
  "'line:save'",
  "'line:update'",
  "'saved:load'",
  "'saved:delete'",
  "'saved:toggle'",
  'hydrateRecord',
  'currentExpanded'
];
for (const snippet of requiredPlatformSnippets) {
  if (!lineSectionSource.includes(snippet)) throw new Error(`Line section controller missing required snippet: ${snippet}`);
}

const forbiddenModuleSnippets = [
  'function bindHeatingCoolingInteractionAdapter',
  'bindHeatingCoolingInteractionAdapter(root)',
  'bindSavedRecordList(root',
  'function mountHeatingCooling(root)'
];
for (const snippet of forbiddenModuleSnippets) {
  if (moduleSource.includes(snippet)) throw new Error(`Heating/cooling must not keep legacy interaction snippet: ${snippet}`);
}

const requiredPipelineSnippets = [
  'const commitSegment =',
  "add(root, 'pointerup', onPointerSegment, true)",
  "add(root, 'touchend', onPointerSegment",
  "add(root, 'click', onClick, true)"
];
for (const snippet of requiredPipelineSnippets) {
  if (!pipelineSource.includes(snippet)) throw new Error(`Central event pipeline missing segment commit support: ${snippet}`);
}

if (!runtimeSource.includes('bindCommonInputs(root, state)')) throw new Error('platform runtime must own common input binding for migrated custom-view modules.');
if (!dynamicRendererSource.includes('root.__tcHeatingCoolingDynamic')) throw new Error('platform dynamic renderer must own heating/cooling dynamic state cache.');

console.log('heating-cooling global interaction regression ok');
