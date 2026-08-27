import assert from 'node:assert/strict';
import schema from '../js/modules/f-gases-check/schema.js';
import { initialState, F_GASES_SCHEMA_VERSION } from '../js/modules/f-gases-check/state.js';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { createFGasesSystemSnapshot, F_GASES_SYSTEM_SNAPSHOT_VERSION } from '../js/shared/fGasesSystemSnapshot.js';
import { getDataStatus, getDataVersions, listRefrigerants, listRegulations, listSafetyClasses } from '../js/utils/refrigerants/index.js';

assert.equal(F_GASES_SCHEMA_VERSION, 2);
assert.equal(schema.version, 2);
assert.ok(schema.fields.some(field => field.key === 'assessmentDate'));
assert.ok(schema.fields.some(field => field.key === 'productCategory'));
assert.ok(schema.fields.some(field => field.key === 'siteSafetyRestrictionStatus'));
assert.equal(initialState.siteSafetyRestrictionStatus, '');

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
  applicationType: 'refrigeration',
  installationType: 'stationary',
  productCategory: 'stationary-chiller',
  constructionType: 'other',
  ratedCapacityKw: '18,5',
  refrigerantId: '',
  chargeKg: '12,5',
  assessmentDate: '2026-08-27',
  placedOnMarketDate: '2026-01-01',
  plannedActivity: 'maintenance',
  refrigerantOrigin: 'reclaimed',
  leakDetectionSystemStatus: 'yes',
  hermeticallySealedStatus: 'no',
  hermeticallySealedLabelStatus: 'no',
  coolingBelowMinus50Status: 'no',
  siteSafetyRestrictionStatus: '',
  nationalSafetyStandardRestrictionStatus: '',
  cascadePrimaryCircuitStatus: 'no',
  specificRefrigerantLossPercent: '1,5',
  personCertificationStatus: 'verified',
  companyCertificationStatus: 'verified',
  dataVersions: getDataVersions()
};
const snapshot = createFGasesSystemSnapshot(source, { generatedAt: '2026-08-27T00:00:00.000Z' });
assert.equal(snapshot.snapshotVersion, F_GASES_SYSTEM_SNAPSHOT_VERSION);
assert.equal(F_GASES_SYSTEM_SNAPSHOT_VERSION, 2);
assert.equal(snapshot.system.chargeKg, 12.5);
assert.equal(snapshot.system.ratedCapacityKw, 18.5);
assert.equal(snapshot.system.specificRefrigerantLossPercent, 1.5);
assert.equal(snapshot.system.productCategory, 'stationary-chiller');
assert.equal(snapshot.system.siteSafetyRestrictionStatus, '');
source.systemName = 'Geändert';
assert.equal(snapshot.system.systemName, 'Testanlage');

const result = calculate({ refrigerantId: '', chargeKg: '12,5' });
assert.equal(result.status, 'not-specified');
assert.equal(result.gwp, null);
assert.equal(result.co2EquivalentTonnes, null);
assert.equal(result.checks.service, 'not-specified');

console.log('F-Gases skeleton tests passed.');
