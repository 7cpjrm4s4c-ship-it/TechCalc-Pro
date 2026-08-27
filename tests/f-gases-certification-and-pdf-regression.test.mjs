import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';

const base = {
  schemaVersion: 4,
  systemName: 'WP 01', applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'split-ac-heat-pump', constructionType: 'split', splitType: 'air-water', ratedCapacityKw: '20',
  refrigerantId: 'R32', chargeKg: '8', assessmentDate: '27.08.2026', placedOnMarketDate: '27.08.2026', installedAtSiteDate: '27.08.2026', plannedActivity: 'installation', refrigerantOrigin: 'new', preChargedStatus: 'yes',
  leakDetectionSystemStatus: 'no', hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no', coolingBelowMinus50Status: 'no', siteSafetyRestrictionStatus: 'no', nationalSafetyStandardRestrictionStatus: 'no', cascadePrimaryCircuitStatus: 'no', specificRefrigerantLossPercent: '0'
};

const companyMissing = calculate({ ...base, personCertificationStatus: 'verified', companyCertificationStatus: 'not-verified' });
assert.equal(companyMissing.checks.certification, 'required-not-verified');
assert.equal(companyMissing.checks.operatorDuties, 'non-compliant');

const personMissing = calculate({ ...base, personCertificationStatus: 'not-verified', companyCertificationStatus: 'verified' });
assert.equal(personMissing.checks.certification, 'required-not-verified');
assert.equal(personMissing.checks.operatorDuties, 'non-compliant');

const bothVerified = calculate({ ...base, personCertificationStatus: 'verified', companyCertificationStatus: 'verified' });
assert.equal(bothVerified.checks.certification, 'verified');
assert.equal(bothVerified.checks.operatorDuties, 'requirements-identified');

const dto = buildFGasesReportDto({ state: { ...base, personCertificationStatus: 'verified', companyCertificationStatus: 'verified' }, calculation: bothVerified, generatedAt: '2026-08-27T12:00:00.000Z' });
const sections = buildFGasesReportSections(dto);
const documentation = sections.find(section => section.title === '5. Dokumentationspflichten');
assert.ok(documentation.rows.some(row => row[0] === 'Aufzeichnungen zu Dichtheitskontrollen' && /^\d+ Jahre$/.test(row[1])));
assert.ok(documentation.rows.some(row => row[0] === 'Rechtsgrundlage' && row[1].includes('VO (EU) 2024/573')));
assert.ok(documentation.rows.every(row => !/Aufbewahrung.*VO \(EU\)/.test(row[1])));

console.log('F-Gases certification/operator-duty and PDF documentation regression passed.');
