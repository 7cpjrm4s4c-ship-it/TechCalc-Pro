import assert from 'node:assert/strict';
import { deriveCombinedStorage } from '../js/modules/flooding-verification/calculationAdapter.js';

const dinGoverns = deriveCombinedStorage({
  flooding: { governing: { valueM3: 143.23 } },
  retention: { calculated: true, governing: { volumeM3: 16.59 } }
}, true);
assert.equal(dinGoverns.planningVolumeM3, 143.23);
assert.equal(dinGoverns.governingSource, 'din-1986-100');
assert.equal(dinGoverns.requiresDwaCheck, true);

const dwaGoverns = deriveCombinedStorage({
  flooding: { governing: { valueM3: 40 } },
  retention: { calculated: true, governing: { volumeM3: 55 } }
}, true);
assert.equal(dwaGoverns.planningVolumeM3, 55);
assert.equal(dwaGoverns.governingSource, 'dwa-a-117');

const equal = deriveCombinedStorage({
  flooding: { governing: { valueM3: 25 } },
  retention: { calculated: true, governing: { volumeM3: 25 } }
}, true);
assert.equal(equal.planningVolumeM3, 25);
assert.equal(equal.governingSource, 'both');

const noAuthority = deriveCombinedStorage({
  flooding: { governing: { valueM3: 30 } },
  retention: { calculated: true, governing: { volumeM3: 80 } }
}, false);
assert.equal(noAuthority.planningVolumeM3, 30);
assert.equal(noAuthority.governingSource, 'din-1986-100');

console.log('flooding-verification-combined-storage: ok');
