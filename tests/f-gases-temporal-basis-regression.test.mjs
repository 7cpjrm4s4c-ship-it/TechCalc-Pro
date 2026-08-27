import assert from 'node:assert/strict';
import schema from '../js/modules/f-gases-check/schema.js';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { F_GASES_SCHEMA_VERSION } from '../js/modules/f-gases-check/state.js';
import { createFGasesSystemSnapshot, F_GASES_SYSTEM_SNAPSHOT_VERSION } from '../js/shared/fGasesSystemSnapshot.js';

assert.equal(F_GASES_SCHEMA_VERSION, 5);
assert.equal(F_GASES_SYSTEM_SNAPSHOT_VERSION, 5);
const dateGroup = schema.groups.find(group => group.title === 'Zeitliche Bewertungsgrundlage und Tätigkeit');
assert.deepEqual(dateGroup.fields.slice(0, 3), ['placedOnMarketDate', 'commissioningDate', 'stockAssessmentDate']);
const stockField = schema.fields.find(field => field.key === 'stockAssessmentDate');
assert.equal(stockField.visibleWhen({ plannedActivity: 'installation' }), false);
assert.equal(stockField.visibleWhen({ plannedActivity: 'maintenance' }), true);

const base = {
  schemaVersion: 5, systemName: 'WP', applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'split-ac-heat-pump', constructionType: 'split', splitType: 'air-water', ratedCapacityKw: '10', refrigerantId: 'R32', chargeKg: '8',
  placedOnMarketDate: '31.12.2026', commissioningDate: '02.01.2027', stockAssessmentDate: '01.02.2028', plannedActivity: 'maintenance', refrigerantOrigin: 'new',
  leakDetectionSystemStatus: 'no', hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no', coolingBelowMinus50Status: 'no', siteSafetyRestrictionStatus: 'no', nationalSafetyStandardRestrictionStatus: 'no', cascadePrimaryCircuitStatus: 'no', specificRefrigerantLossPercent: '0', personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
const result = calculate(base);
assert.equal(result.regulatoryContext.assessmentDate, '2028-02-01');
assert.equal(result.regulatoryContext.commissioningDate, '2027-01-02');
assert.equal(result.placingOnMarketRegulatoryContext.assessmentDate, '2026-12-31');

const installation = calculate({ ...base, plannedActivity: 'installation', stockAssessmentDate: '' });
assert.equal(installation.regulatoryContext.assessmentDate, '2027-01-02');

const legacy = calculate({ ...base, commissioningDate: '', stockAssessmentDate: '', installedAtSiteDate: '02.01.2027', assessmentDate: '01.02.2028' });
assert.equal(legacy.regulatoryContext.commissioningDate, '2027-01-02');
assert.equal(legacy.regulatoryContext.stockAssessmentDate, '2028-02-01');

const snapshot = createFGasesSystemSnapshot(base, { generatedAt: '2028-02-01T12:00:00.000Z' });
assert.equal(snapshot.system.commissioningDate, '02.01.2027');
assert.equal(snapshot.system.stockAssessmentDate, '01.02.2028');
assert.equal('installedAtSiteDate' in snapshot.system, false);
assert.equal('assessmentDate' in snapshot.system, false);

console.log('F-Gases temporal basis regression passed.');
