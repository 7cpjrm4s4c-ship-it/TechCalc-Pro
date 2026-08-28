import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';

const base = {
  applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'self-contained-ac-heat-pump', constructionType: 'self-contained', ratedCapacityKw: '20',
  refrigerantId: 'R-513A', chargeKg: '24.4', placedOnMarketDate: '01.01.2028', commissioningDate: '01.06.2028', stockAssessmentDate: '01.06.2029', plannedActivity: 'maintenance',
  refrigerantOrigin: 'new', hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no', personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
const result = calculate(base);
const model = buildFGasesResultModel(base, result);
assert.equal(model.primary.rows.find(row => row.label === 'Wartung / Instandhaltung').value, 'Keine Einschränkungen');
const serviceRows = model.groups.find(group => group.title === 'Wartung und Instandhaltung').rows;
assert.equal(serviceRows.find(row => row.label === 'Gesamtbewertung').value, 'Keine Einschränkungen');
assert.equal(serviceRows.find(row => row.label === 'Servicekältemittel: neu').value.includes('Verwendung möglich'), true);
assert.equal(serviceRows.find(row => row.label === 'Servicekältemittel: aufgearbeitet').value, 'Verwendung möglich');
assert.equal(serviceRows.find(row => row.label === 'Servicekältemittel: recycelt').value, 'Verwendung möglich');
const operatorRows = model.groups.find(group => group.title === 'Betreiberpflichten').rows;
assert.ok(operatorRows.some(row => row.label === 'Maximal zulässiger spezifischer Kältemittelverlust' && row.value === '2'));
assert.ok(operatorRows.some(row => row.label === 'Bewertung Kältemittelverlust' && row.value === 'Bewertung offen – spezifischer Kältemittelverlust nicht angegeben'));
assert.ok(!operatorRows.some(row => row.value === 'applies'));
console.log('F-Gases compact result labels regression passed.');
