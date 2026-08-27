import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';

const base = { assessmentDate:'2027-01-02', installationType:'stationary', applicationType:'heat-pump', productCategory:'split-ac-heat-pump', constructionType:'split', splitType:'air-water', ratedCapacityKw:'10', refrigerantId:'R32', chargeKg:'8', siteSafetyRestrictionStatus:'no', nationalSafetyStandardRestrictionStatus:'no', hermeticallySealedStatus:'no', hermeticallySealedLabelStatus:'no', leakDetectionSystemStatus:'no' };
const split = calculate({ ...base, plannedActivity: 'installation', refrigerantOrigin: 'new' });
assert.equal(split.checks.placingOnMarket, 'prohibited');
assert.equal(split.checks.service, 'no-prohibition-found');
assert.equal(split.checks.leakCheck, 'required');
assert.equal(split.leakCheckDetails.intervalMonths, 12);
assert.equal(split.leakCheckDetails.leakDetectionRequired, false);
assert.equal(split.checks.documentation, 'required');
assert.ok(split.documentationDetails.obligations.some(item => item.type === 'leak-check-records' && item.retentionYears === 5));
assert.ok(split.lifecycleActivities.includes('maintenance'));
assert.ok(split.lifecycleActivities.includes('recovery'));

const hermetic = calculate({ ...base, chargeKg:'8', refrigerantId:'R32', hermeticallySealedStatus:'yes', hermeticallySealedLabelStatus:'yes' });
assert.equal(hermetic.checks.leakCheck, 'exception-applies');

const highCharge = calculate({ ...base, applicationType:'refrigeration', productCategory:'other-refrigeration-system', refrigerantId:'R-404A', chargeKg:'130', leakDetectionSystemStatus:'yes' });
assert.equal(highCharge.leakCheckDetails.required, true);
assert.equal(highCharge.leakCheckDetails.intervalMonths, 6);
assert.equal(highCharge.leakCheckDetails.leakDetectionRequired, true);

const mobileBeforeTransition = calculate({ ...base, installationType:'mobile', mobileEquipmentType:'light-refrigerated-intermodal-rail', applicationType:'refrigeration', assessmentDate:'2027-03-12' });
assert.equal(mobileBeforeTransition.checks.leakCheck, 'not-applicable');
const mobileAfterTransition = calculate({ ...mobileBeforeTransition.regulatoryContext, assessmentDate:'2027-03-13' });
assert.equal(mobileAfterTransition.checks.leakCheck, 'required');

const preBan = calculate({ ...base, assessmentDate:'2028-01-01', placedOnMarketDate:'2026-12-31' });
assert.equal(preBan.regulatoryContext.applicableAnnexIvBanDate, '2027-01-01');
assert.equal(preBan.regulatoryContext.annexIvProofRequiredFrom, '2028-01-01');
assert.ok(preBan.documentationDetails.obligations.some(item => item.type === 'pre-ban-proof'));

const germanNewPlant = calculate({ ...base, applicationType:'refrigeration', productCategory:'other-refrigeration-system', chargeKg:'20', refrigerantId:'R32', installedAtSiteDate:'2010-01-01', specificRefrigerantLossPercent:'2.5' });
const lossDuty = germanNewPlant.operatorDutyDetails.obligations.find(item => item.type === 'specific-refrigerant-loss');
assert.equal(lossDuty.maximumPercent, 2);
assert.equal(germanNewPlant.checks.operatorDuties, 'non-compliant');

const germanOldPlant = calculate({ ...germanNewPlant.regulatoryContext, installedAtSiteDate:'2004-01-01', specificRefrigerantLossPercent:'5.5' });
assert.equal(germanOldPlant.operatorDutyDetails.obligations.find(item => item.type === 'specific-refrigerant-loss').maximumPercent, 6);
assert.notEqual(germanOldPlant.checks.operatorDuties, 'non-compliant');

const installationWithHighGwp = calculate({ ...base, applicationType:'refrigeration', productCategory:'other-refrigeration-system', refrigerantId:'R-404A', assessmentDate:'2026-08-27', plannedActivity:'installation', refrigerantOrigin:'new' });
assert.equal(installationWithHighGwp.checks.service, 'prohibited');
assert.equal(installationWithHighGwp.serviceDetails.originScenarios.find(item => item.refrigerantOrigin === 'reclaimed').status, 'allowed-under-exception');
assert.equal(installationWithHighGwp.serviceDetails.originScenarios.find(item => item.refrigerantOrigin === 'recycled').status, 'allowed-under-exception');

const missingServiceOrigin = calculate({ ...installationWithHighGwp.regulatoryContext, refrigerantOrigin:'' });
assert.equal(missingServiceOrigin.checks.service, 'incomplete');

const lifecycleCertification = calculate({ ...base, plannedActivity:'installation', personCertificationStatus:'not-verified', companyCertificationStatus:'not-verified' });
assert.equal(lifecycleCertification.checks.certification, 'required-not-verified');
assert.ok(lifecycleCertification.operatorDutyDetails.obligations.some(item => item.type === 'certified-person-for-leak-check'));
assert.ok(lifecycleCertification.operatorDutyDetails.obligations.some(item => item.type === 'certified-person-for-recovery'));

console.log('F-Gases complete rule engine tests passed.');
