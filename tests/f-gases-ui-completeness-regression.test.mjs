import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import schema from '../js/modules/f-gases-check/schema.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';

const completeExceptionCase = {
  schemaVersion: 4,
  systemName: 'Kaskadenanlage', applicationType: 'refrigeration', installationType: 'stationary', productCategory: 'self-contained-refrigeration-system', constructionType: 'cascade', ratedCapacityKw: '774',
  refrigerantId: 'R-513A', chargeKg: '97,6', assessmentDate: '27.08.2026', placedOnMarketDate: '20.08.2027', installedAtSiteDate: '01.02.2028', plannedActivity: 'installation', refrigerantOrigin: 'new', preChargedStatus: 'yes',
  leakDetectionSystemStatus: 'no', hermeticallySealedStatus: 'yes', hermeticallySealedLabelStatus: 'yes', coolingBelowMinus50Status: 'no', siteSafetyRestrictionStatus: 'yes', nationalSafetyStandardRestrictionStatus: 'no', cascadePrimaryCircuitStatus: 'yes', specificRefrigerantLossPercent: '0',
  personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};

const calculation = calculate(completeExceptionCase);
assert.equal(calculation.regulatoryContext.assessmentDate, '2026-08-27');
assert.equal(calculation.regulatoryContext.placedOnMarketDate, '2027-08-20');
assert.equal(calculation.regulatoryContext.installedAtSiteDate, '2028-02-01');
assert.equal(calculation.regulatoryContext.applicableAnnexIvBanDateStatus, 'none');
assert.equal(calculation.regulatoryContext.annexIvCompliance, 'compliant');
const model = buildFGasesResultModel(completeExceptionCase, calculation);
assert.ok(!model.notices.some(notice => notice.title === 'Unvollständige Bewertung'));
assert.equal(model.primary.rows.find(row => row.label === 'Betreiberpflichten').value, 'Pflichten erfüllt');

for (const key of ['assessmentDate', 'placedOnMarketDate', 'installedAtSiteDate']) {
  const field = schema.fields.find(item => item.key === key);
  assert.equal(field.placeholder, 'TT.MM.JJJJ');
  assert.equal(field.format('2026-08-27'), '27.08.2026');
}

const emptyCalculation = calculate({});
const emptyModel = buildFGasesResultModel({}, emptyCalculation);
const emptyNotice = emptyModel.notices.find(notice => notice.title === 'Unvollständige Bewertung');
assert.ok(emptyNotice);
assert.equal(emptyNotice.messages.filter(message => message.includes('Bewertungsdatum')).length, 1);
assert.ok(!emptyNotice.messages.some(message => /EU-FGAS:|DE-CHEMKLIMA:|DE-CHEMG:/.test(message)));

const artificialIncomplete = {
  ...calculation,
  regulationEvaluation: [
    { rule: { id: 'FG-X', legalSource: 'EU-FGAS:Art.5(1)' }, status: 'unresolved', reasons: ['placedOnMarketDate'] },
    { rule: { id: 'FG-Y', legalSource: 'EU-FGAS:Art.7' }, status: 'unresolved', reasons: ['placedOnMarketDate'] }
  ],
  lifecycleRegulationEvaluation: []
};
const incompleteModel = buildFGasesResultModel({ ...completeExceptionCase, placedOnMarketDate: '' }, artificialIncomplete);
const incompleteNotice = incompleteModel.notices.find(notice => notice.title === 'Unvollständige Bewertung');
assert.equal(incompleteNotice.messages.filter(message => message.includes('Erstmaliges Inverkehrbringen')).length, 1);
assert.ok(incompleteNotice.messages[0].includes('Verordnung (EU) 2024/573'));

const dto = buildFGasesReportDto({ state: completeExceptionCase, calculation, generatedAt: '2026-08-27T10:00:00.000Z' });
const sections = buildFGasesReportSections(dto);
const sourceSection = sections.find(section => section.title.startsWith('8.'));
assert.equal(sourceSection.rows.find(row => row[0] === 'Erzeugt am')[1], '27.08.2026');

console.log('F-Gases date input and missing-field deduplication regression passed.');
