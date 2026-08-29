import assert from 'node:assert/strict';
import schema from '../js/modules/f-gases-check/schema.js';
import { initialState, F_GASES_SCHEMA_VERSION } from '../js/modules/f-gases-check/state.js';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { createFGasesSystemSnapshot, F_GASES_SYSTEM_SNAPSHOT_VERSION } from '../js/shared/fGasesSystemSnapshot.js';
import { getDataStatus, getDataVersions, getGwp, getRefrigerant, listRefrigerants, listRegulations, listSafetyClasses } from '../js/utils/refrigerants/index.js';

assert.equal(F_GASES_SCHEMA_VERSION, 5);
assert.equal(schema.version, 5);
assert.ok(schema.fields.some(field => field.key === 'splitType'));
assert.ok(schema.fields.some(field => field.key === 'preChargedStatus'));
assert.equal(initialState.splitType, '');
assert.equal(initialState.preChargedStatus, '');

assert.ok(listRefrigerants().length >= 30);
assert.deepEqual(listSafetyClasses().map(item => item.id), ['A1', 'A2L', 'A2', 'A3', 'B1', 'B2L', 'B2', 'B3']);
assert.deepEqual(getDataVersions(), {
  refrigerants: '1.1.0',
  gwp: '1.0.0',
  regulations: '1.0.2',
  safetyClasses: null
});
assert.equal(getDataStatus().refrigerants, 'specified');
assert.equal(getDataStatus().gwp, 'specified');
assert.equal(getGwp('R32'), 675);
assert.equal(getGwp('R-32'), 675);
assert.equal(getRefrigerant('R32').id, 'HFKW-32');
assert.ok(listRefrigerants().some(item => item.aliases?.includes('R32')));
assert.equal(getGwp('R-404A'), 3922);
assert.equal(getGwp('R-454B'), 465);
assert.equal(getGwp('R-744'), 1);
assert.equal(getRefrigerant('HFKW-32').regulatory.annexIGroup1Content, true);
assert.equal(getRefrigerant('HFKW-1234yf').regulatory.annexIIGroup1Content, true);
assert.equal(getRefrigerant('R-290').regulatory.fluorinatedGreenhouseGas, false);

const regulations = listRegulations();
assert.ok(regulations.some(rule => rule.id === 'AIV-009B' && rule.conditions.some(condition => condition.field === 'splitType')));

const source = {
  systemName: 'Testanlage',
  applicationType: 'heat-pump',
  installationType: 'stationary',
  productCategory: 'split-ac-heat-pump',
  constructionType: 'split',
  splitType: 'air-water',
  ratedCapacityKw: '10',
  refrigerantId: 'R32',
  chargeKg: '2,5',
  assessmentDate: '2027-01-02',
  placedOnMarketDate: '2027-01-02',
  plannedActivity: 'installation',
  refrigerantOrigin: 'new',
  preChargedStatus: 'yes',
  leakDetectionSystemStatus: 'no',
  hermeticallySealedStatus: 'no',
  hermeticallySealedLabelStatus: 'no',
  coolingBelowMinus50Status: 'no',
  siteSafetyRestrictionStatus: 'no',
  nationalSafetyStandardRestrictionStatus: 'no',
  cascadePrimaryCircuitStatus: 'no',
  specificRefrigerantLossPercent: '',
  personCertificationStatus: 'verified',
  companyCertificationStatus: 'verified',
  dataVersions: getDataVersions()
};
const snapshot = createFGasesSystemSnapshot(source, { generatedAt: '2026-08-27T00:00:00.000Z' });
assert.equal(F_GASES_SYSTEM_SNAPSHOT_VERSION, 5);
assert.equal(snapshot.system.splitType, 'air-water');
assert.equal(snapshot.system.preChargedStatus, 'yes');
assert.equal(snapshot.system.refrigerantId, 'R32');
source.splitType = 'air-air';
assert.equal(snapshot.system.splitType, 'air-water');

const result = calculate({ refrigerantId: 'R32', chargeKg: '2,5' });
assert.equal(result.status, 'calculated');
assert.equal(result.gwp, 675);
assert.equal(result.co2EquivalentTonnes, 1.6875);
assert.equal(result.checks.service, 'incomplete');

console.log('F-Gases skeleton tests passed.');
