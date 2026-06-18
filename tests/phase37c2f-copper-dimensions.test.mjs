import assert from 'node:assert/strict';
import { pipeSystems } from '../js/utils/pipes.js';

const copper = pipeSystems.find(system => system.id === 'copper');
assert.ok(copper, 'Copper pipe system must exist.');

const expected = new Map([
  [65, { dimension: '76,1 × 2,0', di: 72.1 }],
  [80, { dimension: '88,9 × 2,0', di: 84.9 }],
  [100, { dimension: '108 × 2,0', di: 104 }]
]);

for (const [dn, value] of expected) {
  const row = copper.dimensions.find(item => item.dn === dn);
  assert.ok(row, `Copper DN${dn} must exist.`);
  assert.equal(row.dimension, value.dimension, `Copper DN${dn} dimension must match corrected large-diameter table.`);
  assert.equal(row.di, value.di, `Copper DN${dn} inside diameter must match corrected large-diameter table.`);
}

console.log('phase37c2f copper dimension correction guard passed');
