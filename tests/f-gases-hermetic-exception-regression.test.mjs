import assert from 'node:assert/strict';
import schema from '../js/modules/f-gases-check/schema.js';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';

const hermeticField = schema.fields.find(field => field.key === 'hermeticallySealedStatus');
assert.equal(hermeticField.label, 'Hermetisch geschlossene Einrichtung nach Art. 3 Nr. 9 VO (EU) 2024/573');
assert.equal(hermeticField.options.find(option => option.value === 'yes').label, 'Nachgewiesen');

const base = {
  applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'self-contained-ac-heat-pump', constructionType: 'self-contained', ratedCapacityKw: '20',
  refrigerantId: 'R-513A', chargeKg: '24.4', placedOnMarketDate: '01.01.2028', commissioningDate: '01.06.2028', stockAssessmentDate: '01.06.2029', plannedActivity: 'maintenance',
  refrigerantOrigin: 'new', hermeticallySealedStatus: 'yes', hermeticallySealedLabelStatus: 'yes', specificRefrigerantLossPercent: '5', personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
const result = calculate(base);
const loss = result.operatorDutyDetails.obligations.find(item => item.type === 'specific-refrigerant-loss');
assert.equal(loss.status, 'exception-applies');
assert.equal(loss.maximumPercent, null);
assert.equal(loss.legalSource, 'DE-CHEMKLIMA:§2(3)');
assert.equal(loss.exceptionReason, 'hermetically-sealed-and-labelled');

const operatorRows = buildFGasesResultModel(base, result).groups.find(group => group.title === 'Betreiberpflichten').rows;
assert.ok(operatorRows.some(row => row.label === 'Maximal zulässiger spezifischer Kältemittelverlust' && row.value === '§ 2 Abs. 1 nicht anwendbar'));
assert.ok(operatorRows.some(row => row.label === 'Begründung' && row.value.includes('§ 2 Abs. 3 ChemKlimaschutzV')));
assert.ok(!operatorRows.some(row => row.value === 'Ausnahme anwendbar'));

const dto = buildFGasesReportDto({ state: base, calculation: result, generatedAt: '2029-06-01T12:00:00.000Z' });
const pdfRows = buildFGasesReportSections(dto).find(section => section.title === '6. Betreiberpflichten').rows;
assert.ok(pdfRows.some(row => row[0] === 'Maximal zulässiger spezifischer Kältemittelverlust' && row[1] === '§ 2 Abs. 1 nicht anwendbar'));
assert.ok(pdfRows.some(row => row[0] === 'Rechtsgrundlage' && row[1] === '§ 2 Abs. 3 ChemKlimaschutzV'));

const nonHermetic = calculate({ ...base, hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no' });
const nonHermeticLoss = nonHermetic.operatorDutyDetails.obligations.find(item => item.type === 'specific-refrigerant-loss');
assert.equal(nonHermeticLoss.status, 'applies');
assert.equal(nonHermeticLoss.maximumPercent, 2);

console.log('F-Gases hermetic exception regression passed.');
