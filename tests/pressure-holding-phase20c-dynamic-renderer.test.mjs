import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPressureHoldingDynamicRenderer } from '../core/ui/dynamicRenderer.js';
import pressureHoldingModule from '../modules/pressure-holding/index.js';

globalThis.document = { activeElement: null };
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexSource = fs.readFileSync(path.join(rootDir, 'modules/pressure-holding/index.js'), 'utf8');
const viewSource = fs.readFileSync(path.join(rootDir, 'modules/pressure-holding/view.js'), 'utf8');
const dynamicSource = fs.readFileSync(path.join(rootDir, 'core/ui/dynamicRenderer.js'), 'utf8');
assert.match(dynamicSource, /createPressureHoldingDynamicRenderer/);
assert.match(indexSource, /createPressureHoldingDynamicRenderer/);
assert.match(viewSource, /data-ph-dynamic="basis"/);
assert.match(viewSource, /data-ph-dynamic="volume-fields"/);
assert.match(viewSource, /data-ph-dynamic="pressure-fields"/);
assert.match(viewSource, /data-ph-dynamic="holding-options"/);
assert.match(viewSource, /data-ph-dynamic="saved-records"/);
assert.match(viewSource, /data-ph-dynamic="result"/);
assert.match(indexSource, /dynamicUpdate: updatePressureHoldingDynamic/);
assert.match(indexSource, /isDynamicAction: isDynamicPressureHoldingAction/);
assert.equal(typeof createPressureHoldingDynamicRenderer, 'function');
assert.equal(typeof pressureHoldingModule.mount, 'function');

let rendered = [];
const fakeRoot = {
  __tcPressureHoldingDynamic: {},
  querySelector(selector) {
    return {
      innerHTML: '',
      value: '',
      closest: () => null,
      classList: { add(){}, remove(){}, [Symbol.iterator]: function* () {} },
      setAttribute(){},
      dataset: {}
    };
  },
  querySelectorAll() { return []; }
};

const renderer = createPressureHoldingDynamicRenderer({
  calculate: () => ({ selectedVolume: 1 }),
  fmtInput: value => String(value ?? ''),
  renderBasis: () => { rendered.push('basis'); return 'basis'; },
  renderVolumeFields: () => { rendered.push('volume'); return 'volume'; },
  renderPressureFields: () => { rendered.push('pressure'); return 'pressure'; },
  renderHoldingOptions: () => { rendered.push('holding'); return 'holding'; },
  renderAccessories: () => { rendered.push('accessories'); return 'accessories'; },
  renderSavedPanel: () => { rendered.push('saved'); return 'saved'; },
  renderResult: () => { rendered.push('result'); return 'result'; }
});

renderer.update(fakeRoot, {
  systemType: 'heating',
  holdingType: 'mag',
  connectionType: 'suction',
  waterContentMode: 'known',
  includeServitec: 'false',
  frostMode: 'water',
  dynamicType: 'reflexomat',
  plantName: '',
  savedPlants: []
}, { action: 'initial', changed: [] });

assert.deepEqual(rendered, ['basis', 'volume', 'pressure', 'holding', 'result']);
rendered = [];
renderer.update(fakeRoot, {
  systemType: 'heating',
  holdingType: 'mag',
  connectionType: 'pressure',
  waterContentMode: 'known',
  includeServitec: 'false',
  frostMode: 'water',
  dynamicType: 'reflexomat',
  plantName: '',
  savedPlants: []
}, { action: 'field:change', changed: ['connectionType'] });

assert.ok(rendered.includes('basis'));
assert.ok(rendered.includes('pressure'));
assert.ok(rendered.includes('result'));

console.log('pressure-holding-phase20c-dynamic-renderer ok');
rendered = [];
renderer.update(fakeRoot, {
  systemType: 'heating',
  holdingType: 'mag',
  connectionType: 'pressure',
  waterContentMode: 'known',
  includeServitec: 'false',
  frostMode: 'water',
  dynamicType: 'reflexomat',
  plantName: 'Neue Anlagenbezeichnung',
  savedPlants: []
}, { action: 'field:change', changed: ['plantName'] });

assert.deepEqual(rendered, ['result']);
assert.doesNotMatch(dynamicSource, /const savedFields = \[[^\]]*plantName/);

// Test useServitec change triggers holding-options re-render
rendered = [];
renderer.update(fakeRoot, {
  systemType: 'heating',
  holdingType: 'mag',
  connectionType: 'suction',
  waterContentMode: 'known',
  useServitec: 'true',
  feedType: 'manual',
  waterTreatmentMethod: 'softening',
  includeServitec: 'false',
  frostMode: 'water',
  dynamicType: 'reflexomat',
  plantName: '',
  savedPlants: []
}, { action: 'field:change', changed: ['useServitec'] });

assert.ok(rendered.includes('holding'), 'useServitec change triggers holding-options re-render');

// Test accessories rendering
rendered = [];
const stateWithAccessories = {
  systemType: 'heating',
  holdingType: 'mag',
  connectionType: 'suction',
  waterContentMode: 'known',
  useServitec: 'true',
  feedType: 'manual',
  waterTreatmentMethod: 'softening',
  includeServitec: 'false',
  frostMode: 'water',
  dynamicType: 'reflexomat',
  plantName: '',
  savedPlants: []
};
renderer.update(fakeRoot, stateWithAccessories, { action: 'field:change', changed: ['feedType'] });
assert.ok(rendered.includes('accessories'), 'accessories field change triggers re-render');

// Test that syncFields handles useServitec and feedType without errors
const stateWithServitec = {
  systemType: 'heating',
  holdingType: 'mag',
  connectionType: 'suction',
  waterContentMode: 'known',
  useServitec: 'true',
  feedType: 'manual',
  waterTreatmentMethod: 'softening',
  includeServitec: 'false',
  frostMode: 'water',
  dynamicType: 'reflexomat',
  plantName: '',
  savedPlants: []
};
renderer.update(fakeRoot, stateWithServitec, { action: 'field:change', changed: ['feedType'] });
assert.ok(true, 'syncFields handles feedType without errors');

console.log('pressure-holding-phase20c-dynamic-renderer ok');
