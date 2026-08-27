import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';

const completeExceptionCase = {
  schemaVersion: 4,
  systemName: 'Kaskadenanlage',
  applicationType: 'refrigeration',
  installationType: 'stationary',
  productCategory: 'self-contained-refrigeration-system',
  constructionType: 'cascade',
  ratedCapacityKw: '774',
  refrigerantId: 'R-513A',
  chargeKg: '97,6',
  assessmentDate: '2026-08-27',
  placedOnMarketDate: '2027-08-20',
  installedAtSiteDate: '2028-02-01',
  plannedActivity: 'installation',
  refrigerantOrigin: 'new',
  preChargedStatus: 'yes',
  leakDetectionSystemStatus: 'no',
  hermeticallySealedStatus: 'yes',
  hermeticallySealedLabelStatus: 'yes',
  coolingBelowMinus50Status: 'no',
  siteSafetyRestrictionStatus: 'yes',
  nationalSafetyStandardRestrictionStatus: 'no',
  cascadePrimaryCircuitStatus: 'yes',
  specificRefrigerantLossPercent: '0',
  personCertificationStatus: 'verified',
  companyCertificationStatus: 'verified'
};

const calculation = calculate(completeExceptionCase);
assert.equal(calculation.regulatoryContext.applicableAnnexIvBanDateStatus, 'none');
assert.equal(calculation.regulatoryContext.annexIvCompliance, 'compliant');
assert.ok(!calculation.regulationEvaluation.some(entry => entry.rule.id === 'FG-047' && entry.status === 'unresolved'));

const model = buildFGasesResultModel(completeExceptionCase, calculation);
assert.ok(!model.notices.some(notice => notice.title === 'Unvollständige Bewertung'));
const refrigerantGroup = model.groups.find(group => group.title === 'Kältemittel und Klimawirkung');
assert.ok(refrigerantGroup.rows.some(row => row.value.includes('Umweltbundesamt')));
assert.ok(!refrigerantGroup.rows.some(row => /interner (Datenstand|Rechtsdatenstand)/i.test(row.value)));

const dto = buildFGasesReportDto({ state: completeExceptionCase, calculation, generatedAt: '2026-08-27T10:00:00.000Z' });
const sections = buildFGasesReportSections(dto);
const sourceSection = sections.find(section => section.title.includes('Quellen'));
assert.ok(sourceSection);
assert.ok(!sourceSection.rows.some(row => ['Kältemitteldaten', 'GWP-Daten', 'Rechtsdaten', 'Report-Version', 'Modul-Schema'].includes(row[0])));

console.log('F-Gases UI completeness regression passed.');
