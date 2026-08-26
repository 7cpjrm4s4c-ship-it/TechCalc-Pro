import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { createFGasesSystemSnapshot, F_GASES_SYSTEM_SNAPSHOT_VERSION } from '../js/shared/fGasesSystemSnapshot.js';
import { getDataStatus, getDataVersions, listRefrigerants, listRegulations, listSafetyClasses } from '../js/utils/refrigerants/index.js';

assert.deepEqual(listRefrigerants(), []);
assert.deepEqual(listRegulations(), []);
assert.deepEqual(listSafetyClasses().map(item => item.id), ['A1', 'A2L', 'A2', 'A3', 'B1', 'B2L', 'B2', 'B3']);
assert.deepEqual(getDataVersions(), {
  refrigerants: null,
  gwp: null,
  regulations: null,
  safetyClasses: null
});
assert.equal(getDataStatus().regulations, 'not-specified');

const source = {
  systemName: 'Testanlage',
  refrigerantId: '',
  chargeKg: '12,5',
  dataVersions: getDataVersions()
};
const snapshot = createFGasesSystemSnapshot(source, { generatedAt: '2026-08-26T00:00:00.000Z' });
assert.equal(snapshot.snapshotVersion, F_GASES_SYSTEM_SNAPSHOT_VERSION);
assert.equal(snapshot.system.chargeKg, 12.5);
source.systemName = 'Geändert';
assert.equal(snapshot.system.systemName, 'Testanlage');

const result = calculate({ refrigerantId: '', chargeKg: '12,5' });
assert.equal(result.status, 'not-specified');
assert.equal(result.gwp, null);
assert.equal(result.co2EquivalentTonnes, null);
assert.equal(result.checks.service, 'not-specified');

console.log('F-Gases skeleton tests passed.');
