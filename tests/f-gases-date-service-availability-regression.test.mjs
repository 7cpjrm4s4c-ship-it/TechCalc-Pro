import assert from 'node:assert/strict';
import schema from '../js/modules/f-gases-check/schema.js';
import { initialState } from '../js/modules/f-gases-check/state.js';
import { hydrateFGasesSavedRecord } from '../js/modules/f-gases-check/savedRecords.js';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
const stockField = schema.fields.find(field => field.key === 'stockAssessmentDate');
assert.equal(initialState.plannedActivity, 'installation');
assert.equal(stockField.visibleWhen({ plannedActivity: 'installation' }), false);
assert.equal(stockField.visibleWhen({ plannedActivity: '' }), false);
assert.equal(stockField.visibleWhen({ plannedActivity: 'maintenance' }), true);
assert.equal(hydrateFGasesSavedRecord({ inputState: { plannedActivity: '' } }).plannedActivity, 'installation');
const base = {
  applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'self-contained-ac-heat-pump', constructionType: 'self-contained', ratedCapacityKw: '20',
  refrigerantId: 'R-513A', chargeKg: '24.4', placedOnMarketDate: '01.01.2028', commissioningDate: '01.06.2028', stockAssessmentDate: '01.06.2029', plannedActivity: 'maintenance',
  refrigerantOrigin: 'new', hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no', specificRefrigerantLossPercent: '0', personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
const current = buildFGasesResultModel(base, calculate(base));
const serviceRows = current.groups.find(group => group.title === 'Wartung und Instandhaltung').rows;
assert.equal(serviceRows.find(row => row.label === 'Gesamtbewertung').value, 'Keine Einschränkungen');
assert.equal(serviceRows.find(row => row.label === 'Servicekältemittel: neu').value, 'Verwendung möglich · HFKW-Quote begrenzt');
assert.equal(serviceRows.find(row => row.label === 'Servicekältemittel: aufgearbeitet').value, 'Verwendung möglich');
assert.equal(serviceRows.find(row => row.label === 'Servicekältemittel: recycelt').value, 'Verwendung möglich');
assert.ok(serviceRows.some(row => row.label === 'Rechtsgrundlage HFKW-Neuware' && row.value.includes('Art. 17')));
const afterQuota = { ...base, stockAssessmentDate: '01.06.2050' };
const afterQuotaRows = buildFGasesResultModel(afterQuota, calculate(afterQuota)).groups.find(group => group.title === 'Wartung und Instandhaltung').rows;
assert.equal(afterQuotaRows.find(row => row.label === 'Gesamtbewertung').value, 'Keine Einschränkungen');
assert.equal(afterQuotaRows.find(row => row.label === 'Servicekältemittel: neu').value, 'Verwendung eingeschränkt möglich');
assert.equal(afterQuotaRows.find(row => row.label === 'Servicekältemittel: aufgearbeitet').value, 'Verwendung möglich');
assert.equal(afterQuotaRows.find(row => row.label === 'Servicekältemittel: recycelt').value, 'Verwendung möglich');
console.log('F-Gases date visibility and HFC availability regression passed.');
