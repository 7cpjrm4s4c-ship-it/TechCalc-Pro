import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import schema from '../js/modules/f-gases-check/schema.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';
const completeExceptionCase = {
  schemaVersion: 5,
  systemName: 'Kaskadenanlage', applicationType: 'refrigeration', installationType: 'stationary', productCategory: 'self-contained-refrigeration-system', constructionType: 'cascade', ratedCapacityKw: '774',
  refrigerantId: 'R-513A', chargeKg: '97,6', placedOnMarketDate: '20.08.2027', commissioningDate: '01.02.2028', plannedActivity: 'installation', refrigerantOrigin: 'new', preChargedStatus: 'yes',
  leakDetectionSystemStatus: 'no', hermeticallySealedStatus: 'yes', hermeticallySealedLabelStatus: 'yes', coolingBelowMinus50Status: 'no', siteSafetyRestrictionStatus: 'yes', nationalSafetyStandardRestrictionStatus: 'no', cascadePrimaryCircuitStatus: 'yes', specificRefrigerantLossPercent: '0',
  personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
const calculation = calculate(completeExceptionCase);
const model = buildFGasesResultModel(completeExceptionCase, calculation);
assert.ok(!model.notices.some(notice => notice.title === 'Unvollständige Bewertung'));
assert.equal(model.primary.rows.find(row => row.label === 'Betreiberpflichten').value, 'Pflichten erfüllt');
for (const key of ['placedOnMarketDate', 'commissioningDate', 'stockAssessmentDate']) {
  const field = schema.fields.find(item => item.key === key);
  assert.equal(field.placeholder, 'TT.MM.JJJJ');
  assert.equal(field.inputmode, undefined);
  assert.equal(field.format('2026-08-27'), '27.08.2026');
}
const emptyModel = buildFGasesResultModel({}, calculate({}));
const emptyNotice = emptyModel.notices.find(notice => notice.title === 'Unvollständige Bewertung');
assert.ok(emptyNotice);
for (const label of ['Anlagenart', 'Aufstellung', 'Produkt-/Anlagenkategorie', 'Bauform', 'Nennleistung', 'Kältemittel', 'Füllmenge', 'Erstmaliges Inverkehrbringen', 'Erstmalige Inbetriebnahme']) {
  assert.equal(emptyNotice.messages.filter(message => message.includes(`„${label}“`)).length, 1, `${label} must occur exactly once`);
}
assert.ok(!emptyNotice.messages.some(message => /EU-FGAS:|DE-CHEMKLIMA:|DE-CHEMG:/.test(message)));
const lossRequiredCase = {
  ...completeExceptionCase,
  constructionType: 'other',
  hermeticallySealedStatus: 'no',
  hermeticallySealedLabelStatus: 'no',
  specificRefrigerantLossPercent: ''
};
const lossModel = buildFGasesResultModel(lossRequiredCase, calculate(lossRequiredCase));
const lossNotice = lossModel.notices.find(notice => notice.title === 'Unvollständige Bewertung');
assert.ok(lossNotice.messages.some(message => message.includes('Spezifischer Kältemittelverlust')));
assert.equal(lossNotice.messages.filter(message => message.includes('Spezifischer Kältemittelverlust')).length, 1);
assert.ok(lossNotice.messages.find(message => message.includes('Spezifischer Kältemittelverlust')).includes('Chemikalien-Klimaschutzverordnung'));
const invalidDateModel = buildFGasesResultModel({ ...completeExceptionCase, commissioningDate: '20112020' }, calculate({ ...completeExceptionCase, commissioningDate: '20112020' }));
const invalidDateNotice = invalidDateModel.notices.find(notice => notice.title === 'Unvollständige Bewertung');
assert.equal(invalidDateNotice.messages.filter(message => message.includes('Erstmalige Inbetriebnahme')).length, 1);
assert.ok(invalidDateNotice.messages.some(message => message.includes('TT.MM.JJJJ')));
const dto = buildFGasesReportDto({ state: completeExceptionCase, calculation, generatedAt: '2026-08-27T10:00:00.000Z' });
const sections = buildFGasesReportSections(dto);
const sourceSection = sections.find(section => section.title.startsWith('8.'));
assert.equal(sourceSection.rows.find(row => row[0] === 'Erzeugt am')[1], '27.08.2026');

console.log('F-Gases completeness and date-input regression passed.');
