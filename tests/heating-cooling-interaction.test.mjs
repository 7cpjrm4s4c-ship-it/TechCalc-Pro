import { readFileSync } from 'node:fs';

const moduleSource = readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const pipelineSource = readFileSync('js/core/eventPipeline.js', 'utf8');

const requiredModuleSnippets = [
  'registerCentralActions(root',
  "'line:save'",
  "'line:update'",
  "'saved:load'",
  "'saved:delete'",
  "'saved:toggle'",
  'hydrateLineSectionState(item, state.get())',
  'bindCommonInputs(root, state)',
  'data-hc-dynamic',
  'root.__tcHeatingCoolingDynamic',
  'updateHeatingCoolingDynamic(root, snapshot, meta)'
];

for (const snippet of requiredModuleSnippets) {
  if (!moduleSource.includes(snippet)) {
    throw new Error(`Heating/cooling global interaction path missing required snippet: ${snippet}`);
  }
}

const forbiddenModuleSnippets = [
  'function bindHeatingCoolingInteractionAdapter',
  'bindHeatingCoolingInteractionAdapter(root)',
  'bindSavedRecordList(root'
];

for (const snippet of forbiddenModuleSnippets) {
  if (moduleSource.includes(snippet)) {
    throw new Error(`Heating/cooling must not keep legacy interaction snippet: ${snippet}`);
  }
}

const requiredPipelineSnippets = [
  'const commitSegment =',
  "add(root, 'pointerup', onPointerSegment, true)",
  "add(root, 'touchend', onPointerSegment",
  "add(root, 'click', onClick, true)"
];

for (const snippet of requiredPipelineSnippets) {
  if (!pipelineSource.includes(snippet)) {
    throw new Error(`Central event pipeline missing segment commit support: ${snippet}`);
  }
}

console.log('heating-cooling global interaction regression ok');
