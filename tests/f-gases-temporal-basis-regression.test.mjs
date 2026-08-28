import assert from 'node:assert/strict';
import schema from '../js/modules/f-gases-check/schema.js';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';
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

const incompleteModel = buildFGasesResultModel({ ...base, commissioningDate: '', stockAssessmentDate: '' }, calculate({ ...base, commissioningDate: '', stockAssessmentDate: '' }));
const incompleteNotice = incompleteModel.notices.find(item => item.title === 'Unvollständige Bewertung');
assert.ok(incompleteNotice.messages.some(message => message.includes('Erstmalige Inbetriebnahme')));
assert.ok(incompleteNotice.messages.some(message => message.includes('Prüfdatum der Bestandsanlage')));
assert.ok(!incompleteNotice.messages.some(message => /Bewertungsdatum|Errichtung am Aufstellungsort/.test(message)));

const r513a = calculate({ ...base, refrigerantId: 'R-513A', stockAssessmentDate: '01.02.2032' });
assert.equal(r513a.serviceDetails.status, 'no-prohibition-found');
assert.equal(r513a.serviceDetails.marketAvailability.status, 'quota-limited');
assert.equal(r513a.serviceDetails.marketAvailability.maxTonnesCo2e, 9132097);
const r513aModel = buildFGasesResultModel({ ...base, refrigerantId: 'R-513A', stockAssessmentDate: '01.02.2032' }, r513a);
assert.ok(r513aModel.groups.find(group => group.title === 'Wartung und Instandhaltung').rows.some(row => row.label.includes('Beschaffung neues HFKW')));

const r410aHeatPump = calculate({ ...base, refrigerantId: 'R-410A', stockAssessmentDate: '25.03.2032' });
assert.equal(r410aHeatPump.gwp, 2088);
assert.equal(r410aHeatPump.serviceDetails.status, 'no-prohibition-found');
assert.equal(r410aHeatPump.serviceDetails.marketAvailability.status, 'quota-limited');
const r410aRefrigeration = calculate({ ...base, applicationType: 'refrigeration', productCategory: 'other-refrigeration-system', constructionType: 'other', refrigerantId: 'R-410A', stockAssessmentDate: '25.03.2032' });
assert.equal(r410aRefrigeration.serviceDetails.status, 'prohibited');

const dto = buildFGasesReportDto({ state: base, calculation: result, generatedAt: '2028-02-01T12:00:00.000Z' });
const systemSection = buildFGasesReportSections(dto).find(section => section.title.startsWith('2.'));
assert.ok(systemSection.rows.some(row => row[0] === 'Erstmalige Inbetriebnahme'));
assert.ok(systemSection.rows.some(row => row[0] === 'Prüfdatum der Bestandsanlage'));
assert.ok(!systemSection.rows.some(row => /Bewertungsdatum|Errichtung am Aufstellungsort/.test(row[0])));

console.log('F-Gases temporal and service regulation regression passed.');
