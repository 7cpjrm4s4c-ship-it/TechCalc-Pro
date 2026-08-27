import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { createRegulatoryContext, evaluateRegulations } from '../js/utils/refrigerants/index.js';

const splitHeatPump = {
  applicationType: 'heat-pump',
  installationType: 'stationary',
  productCategory: 'split-ac-heat-pump',
  constructionType: 'split',
  splitType: 'air-water',
  ratedCapacityKw: '10',
  refrigerantId: 'R32',
  chargeKg: '2.5',
  assessmentDate: '2027-01-02',
  plannedActivity: 'installation',
  siteSafetyRestrictionStatus: 'no',
  nationalSafetyStandardRestrictionStatus: 'no',
  coolingBelowMinus50Status: 'no',
  cascadePrimaryCircuitStatus: 'no',
  personCertificationStatus: 'verified',
  companyCertificationStatus: 'verified'
};

const splitResult = calculate(splitHeatPump);
assert.equal(splitResult.gwp, 675);
assert.equal(splitResult.checks.placingOnMarket, 'prohibited');
assert.ok(splitResult.regulationEvaluation.some(entry => entry.rule.id === 'AIV-009B' && entry.status === 'matched'));

const splitWithSafetyException = calculate({ ...splitHeatPump, siteSafetyRestrictionStatus: 'yes' });
assert.equal(splitWithSafetyException.checks.placingOnMarket, 'exception-applies');
assert.ok(splitWithSafetyException.regulationEvaluation.some(entry => entry.rule.id === 'AIV-009B' && entry.status === 'exception-applies'));

const reclaimedService = calculate({
  applicationType: 'refrigeration',
  productCategory: 'other-refrigeration-system',
  refrigerantId: 'R-404A',
  chargeKg: '5',
  assessmentDate: '2026-08-27',
  plannedActivity: 'maintenance',
  refrigerantOrigin: 'reclaimed',
  coolingBelowMinus50Status: 'no',
  siteSafetyRestrictionStatus: 'no'
});
assert.equal(reclaimedService.checks.service, 'allowed-under-exception');

const newGasService = calculate({
  applicationType: 'refrigeration',
  productCategory: 'other-refrigeration-system',
  refrigerantId: 'R-404A',
  chargeKg: '5',
  assessmentDate: '2026-08-27',
  plannedActivity: 'maintenance',
  refrigerantOrigin: 'new',
  coolingBelowMinus50Status: 'no',
  siteSafetyRestrictionStatus: 'no'
});
assert.equal(newGasService.checks.service, 'prohibited');

const chillerContext = createRegulatoryContext({
  applicationType: 'refrigeration',
  installationType: 'stationary',
  productCategory: 'stationary-chiller',
  ratedCapacityKw: '20',
  refrigerantId: 'R32',
  chargeKg: '4',
  assessmentDate: '2027-01-02',
  siteSafetyRestrictionStatus: 'no'
});
const chillerEvaluation = evaluateRegulations(chillerContext);
assert.ok(chillerEvaluation.some(entry => entry.rule.id === 'AIV-007D' && entry.status === 'manual-review'));
assert.equal(calculate(chillerContext).checks.placingOnMarket, 'manual-review');

const missingDateEvaluation = evaluateRegulations(createRegulatoryContext({ refrigerantId: 'R32' }));
assert.ok(missingDateEvaluation.every(entry => entry.status === 'unresolved'));

console.log('F-Gases rule engine tests passed.');
