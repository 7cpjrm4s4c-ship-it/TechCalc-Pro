import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';

const completeExceptionCase = {
  schemaVersion: 4,
  systemName: 'Kaskadenanlage', applicationType: 'refrigeration', installationType: 'stationary', productCategory: 'self-contained-refrigeration-system', constructionType: 'cascade', ratedCapacityKw: '774',
  refrigerantId: 'R-513A', chargeKg: '97,6', assessmentDate: '2026-08-27', placedOnMarketDate: '2027-08-20', installedAtSiteDate: '2028-02-01', plannedActivity: 'installation', refrigerantOrigin: 'new', preChargedStatus: 'yes',
  leakDetectionSystemStatus: 'no', hermeticallySealedStatus: 'yes', hermeticallySealedLabelStatus: 'yes', coolingBelowMinus50Status: 'no', siteSafetyRestrictionStatus: 'yes', nationalSafetyStandardRestrictionStatus: 'no', cascadePrimaryCircuitStatus: 'yes', specificRefrigerantLossPercent: '0',
  personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};

const calculation = calculate(completeExceptionCase);
assert.equal(calculation.regulatoryContext.applicableAnnexIvBanDateStatus, 'none');
assert.equal(calculation.regulatoryContext.annexIvCompliance, 'compliant');
assert.ok(!calculation.regulationEvaluation.some(entry => entry.rule.id === 'FG-047' && entry.status === 'unresolved'));
const model = buildFGasesResultModel(completeExceptionCase, calculation);
assert.ok(!model.notices.some(notice => notice.title === 'Unvollständige Bewertung'));
assert.equal(model.primary.rows.find(row => row.label === 'Betreiberpflichten').value, 'Pflichten erfüllt');
const refrigerantGroup = model.groups.find(group => group.title === 'Kältemittel und Klimawirkung');
assert.ok(refrigerantGroup.rows.some(row => row.value.includes('Umweltbundesamt')));
assert.ok(!refrigerantGroup.rows.some(row => /interner (Datenstand|Rechtsdatenstand)/i.test(row.value)));

const artificialIncomplete = {
  ...calculation,
  regulationEvaluation: [
    { rule: { id: 'FG-X', legalSource: 'Verordnung (EU) 2024/573, Art. X' }, status: 'unresolved', reasons: ['placedOnMarketDate'] },
    { rule: { id: 'FG-Y', legalSource: 'Verordnung (EU) 2024/573, Art. Y' }, status: 'unresolved', reasons: ['leakCheckIntervalMonths'] }
  ],
  lifecycleRegulationEvaluation: []
};
const incompleteModel = buildFGasesResultModel({ ...completeExceptionCase, placedOnMarketDate: '' }, { ...artificialIncomplete, regulatoryContext: { ...calculation.regulatoryContext, leakCheckIntervalMonths: null } });
const incompleteNotice = incompleteModel.notices.find(notice => notice.title === 'Unvollständige Bewertung');
assert.ok(incompleteNotice.messages.some(message => message.includes('Eingabefeld „Erstmaliges Inverkehrbringen“')));
assert.ok(incompleteNotice.messages.some(message => message.includes('abgeleitetes Prüfintervall der Dichtheitskontrolle')));
assert.ok(!incompleteNotice.messages.some(message => /plannedActivity|installationType|leakCheckIntervalMonths/.test(message)));

const dto = buildFGasesReportDto({ state: completeExceptionCase, calculation, generatedAt: '2026-08-27T10:00:00.000Z' });
const sections = buildFGasesReportSections(dto);
const documentation = sections.find(section => section.title.startsWith('5.'));
const operatorDuties = sections.find(section => section.title.startsWith('6.'));
const regulations = sections.find(section => section.title.startsWith('7.'));
const sourceSection = sections.find(section => section.title.startsWith('8.'));
assert.ok(documentation.rows.every(row => !/leak-check-records|pre-ban-proof|german-pre-ban-declaration/.test(row.join(' '))));
assert.ok(operatorDuties.rows.every(row => !/specific-refrigerant-loss|access-to-detachable-connections|contractor-certification|certified-person/.test(row.join(' '))));
assert.ok(operatorDuties.rows.some(row => row.join(' ').includes('Chemikalien-Klimaschutzverordnung')));
assert.ok(regulations.rows.every(row => !/EU-FGAS:|DE-CHEMKLIMA:|DE-CHEMG:/.test(row.join(' '))));
assert.equal(sourceSection.rows.find(row => row[0] === 'Erzeugt am')[1], '27.08.2026');

console.log('F-Gases UI/PDF language and completeness regression passed.');
