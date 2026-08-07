import assert from 'node:assert/strict';
import schema from '../js/modules/rainwater/schema.js';
import controller from '../js/modules/rainwater/controller.js';
import { calculate } from '../js/modules/rainwater/logic.js';

const base = {
  surfaceMode: 'roof',
  calculationType: 'roof',
  roofRainIntensity: '300',
  rainHundredIntensity: '500',
  areaType: 'metal-roof',
  areaSize: '100',
  stackCount: '1',
  fillRatio: '0.7',
  slopeCmM: '1,0',
  surfaces: []
};

const drainField = schema.fields.find(field => field.key === 'drainSize');
assert.equal(drainField.options.at(-1).value, 'manufacturer');
assert.equal(drainField.options.at(-1).label, 'Herstellerangaben');

const manufacturerPatch = controller.lookupHydration.patch('drainSize', {
  ...base,
  drainSize: 'manufacturer',
  drainManufacturer: 'Altwert',
  drainSizeManual: 'DN 100',
  drainCapacity: '4,5',
  drainHead: '35'
});
assert.deepEqual(
  {
    drainSize: manufacturerPatch.drainSize,
    drainManufacturer: manufacturerPatch.drainManufacturer,
    drainSizeManual: manufacturerPatch.drainSizeManual,
    drainCapacity: manufacturerPatch.drainCapacity,
    drainHead: manufacturerPatch.drainHead
  },
  {
    drainSize: 'manufacturer',
    drainManufacturer: '',
    drainSizeManual: '',
    drainCapacity: '',
    drainHead: ''
  }
);

const manufacturerResult = calculate({
  ...base,
  drainSize: 'manufacturer',
  drainManufacturer: 'Muster GmbH · Typ X',
  drainSizeManual: 'DN 90',
  drainCapacity: '1,2',
  drainHead: '20'
});
assert.equal(manufacturerResult.drainManufacturer, 'Muster GmbH · Typ X');
assert.equal(manufacturerResult.drainSize, 'DN 90');
assert.equal(manufacturerResult.drainCapacity, 1.2);
assert.equal(manufacturerResult.drainHead, 20);
assert.equal(manufacturerResult.requiredDrains, 3);
assert.equal(manufacturerResult.warnings.some(message => message.includes('Hersteller / Produkt')), false);

const incompleteResult = calculate({
  ...base,
  drainSize: 'manufacturer',
  drainManufacturer: '',
  drainSizeManual: '',
  drainCapacity: '',
  drainHead: ''
});
assert.equal(incompleteResult.drainCapacity, 0);
assert.equal(incompleteResult.requiredDrains, 0);
assert.equal(incompleteResult.warnings.some(message => message.includes('Hersteller / Produkt')), true);
assert.equal(incompleteResult.warnings.some(message => message.includes('Hersteller-DN')), true);
assert.equal(incompleteResult.warnings.some(message => message.includes('Hersteller-Anstauhöhe')), true);

const presetResult = calculate({
  ...base,
  drainSize: 'DN 100',
  drainSizeManual: 'DN 100',
  drainCapacity: '4,5',
  drainHead: '35'
});
assert.equal(presetResult.drainManufacturerDefined, false);
assert.equal(presetResult.drainSize, 'DN 100');
assert.equal(presetResult.drainCapacity, 4.5);
assert.equal(presetResult.requiredDrains, 1);

console.log('Rainwater manufacturer drain regression ok');
