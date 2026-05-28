import { readFileSync } from 'node:fs';

const source = readFileSync('js/modules/heating-cooling/index.js', 'utf8');

const requiredSnippets = [
  'function bindHeatingCoolingInteractionAdapter',
  "fieldEl.matches('select')",
  "event.key !== 'Enter'",
  "event.target?.closest?.('[data-segment]')",
  "event.target?.closest?.('[data-line-select]')",
  'savedLineSectionPatch(item, state.get())',
  'bindHeatingCoolingInteractionAdapter(root);'
];

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    throw new Error(`Heating/cooling interaction adapter missing required snippet: ${snippet}`);
  }
}

console.log('heating-cooling interaction adapter regression ok');
