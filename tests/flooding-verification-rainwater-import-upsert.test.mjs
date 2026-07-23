import test from 'node:test';
import assert from 'node:assert/strict';
import { state as rainwaterState } from '../js/modules/rainwater/state.js';
import { importRainwater } from '../js/modules/flooding-verification/controller.js';

const roof = (id, name, area = '100') => ({
  id,
  name,
  state: { surfaceMode: 'roof', areaType: 'metal-roof', areaSize: area, customCs: '1', customCm: '0,9' },
  result: { mode: 'roof', area: Number(area), areaType: 'metal-roof', cs: 1, cm: 0.9 }
});

const property = (id, name, area = '200') => ({
  id,
  name,
  state: { surfaceMode: 'property', areaType: 'concrete-asphalt', areaSize: area, customCs: '1', customCm: '0,9' },
  result: { mode: 'property', area: Number(area), areaType: 'concrete-asphalt', cs: 1, cm: 0.9 }
});

test('imports every saved rainwater surface, not only the first roof', () => {
  rainwaterState.set({ surfaces: [roof('r1', 'Dach 1'), roof('r2', 'Dach 2'), property('p1', 'Hof')] }, { notify: false });
  const patch = importRainwater({ current: { surfaces: [] } });
  assert.equal(patch.surfaces.length, 3);
  assert.deepEqual(new Set(patch.surfaces.map(item => item.sourceId)), new Set(['r1', 'r2', 'p1']));
});

test('updates unchanged imported copies and adds newly saved source surfaces', () => {
  rainwaterState.set({ surfaces: [roof('r1', 'Dach 1 geändert', '150'), roof('r2', 'Dach 2')] }, { notify: false });
  const current = {
    surfaces: [{
      id: 'local-r1', sourceId: 'r1', sourceModule: 'rainwater', origin: 'imported',
      modifiedAfterImport: false, name: 'Dach 1', category: 'roof', areaType: 'metal-roof', area: '100', cs: '1', cm: '0,9'
    }]
  };
  const patch = importRainwater({ current });
  assert.equal(patch.surfaces.length, 2);
  const updated = patch.surfaces.find(item => item.sourceId === 'r1');
  assert.equal(updated.id, 'local-r1');
  assert.equal(updated.name, 'Dach 1 geändert');
  assert.equal(updated.area, '150');
  assert.ok(patch.surfaces.some(item => item.sourceId === 'r2'));
});

test('does not overwrite locally modified imported copies', () => {
  rainwaterState.set({ surfaces: [roof('r1', 'Quelle geändert', '300')] }, { notify: false });
  const local = {
    id: 'local-r1', sourceId: 'r1', sourceModule: 'rainwater', origin: 'imported',
    modifiedAfterImport: true, name: 'Lokal bearbeitet', category: 'roof', areaType: 'metal-roof', area: '125', cs: '1', cm: '0,9'
  };
  const patch = importRainwater({ current: { surfaces: [local] } });
  assert.equal(patch.surfaces.length, 1);
  assert.equal(patch.surfaces[0].name, 'Lokal bearbeitet');
  assert.match(patch.importStatus, /nicht überschrieben/);
});
