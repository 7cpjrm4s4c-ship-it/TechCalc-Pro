import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesResultModel } from '../js/modules/f-gases-check/results.js';
import { buildFGasesReportDto, F_GASES_REPORT_DTO_VERSION } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesSavedRecord, buildFGasesSavedRecordsModel } from '../js/modules/f-gases-check/savedRecords.js';

const state = {
  schemaVersion: 4,
  systemName: 'WP 01', applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'split-ac-heat-pump', constructionType: 'split', splitType: 'air-water', ratedCapacityKw: '10',
  refrigerantId: 'R32', chargeKg: '8', assessmentDate: '2027-01-02', placedOnMarketDate: '2027-01-02', plannedActivity: 'installation', refrigerantOrigin: 'new', preChargedStatus: 'yes',
  siteSafetyRestrictionStatus: 'no', nationalSafetyStandardRestrictionStatus: 'no', hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no', leakDetectionSystemStatus: 'no',
  personCertificationStatus: 'verified', companyCertificationStatus: 'verified'
};
const calculation = calculate(state);
const model = buildFGasesResultModel(state, calculation);
assert.equal(model.primary.primary.value, 'Inverkehrbringen unzulässig');
assert.ok(model.primary.rows.some(row => row.label === 'Wartung / Instandhaltung' && !row.value.includes('nicht anwendbar')));
assert.ok(model.primary.rows.some(row => row.label === 'Dichtheitskontrolle' && row.value.includes('erforderlich')));
assert.ok(model.groups.some(group => group.title === 'Wartung und Instandhaltung'));
assert.ok(model.groups.some(group => group.title === 'Dichtheitskontrolle'));
const refrigerantGroup = model.groups.find(group => group.title === 'Kältemittel und Klimawirkung');
assert.ok(refrigerantGroup.rows.some(row => row.label === 'Kältemitteldaten – Quelle' && row.value.includes('Umweltbundesamt')));
assert.ok(refrigerantGroup.rows.some(row => row.label === 'Rechtsgrundlagen' && row.value.includes('Verordnung (EU) 2024/573')));
assert.ok(refrigerantGroup.rows.some(row => row.label === 'Rechtsgrundlagen' && row.value.includes('Chemikalien-Klimaschutzverordnung')));

const savedRecord = buildFGasesSavedRecord({ ...state, savedSystemName: 'Test' }, calculation);
const savedModel = buildFGasesSavedRecordsModel({ savedSystems: [{ id: 'test-1', ...savedRecord }] });
assert.equal(savedModel.items[0].stats[0].value, 'unzulässig');
assert.notEqual(savedModel.items[0].stats[1].value, 'not-applicable');

const dto = buildFGasesReportDto({ state, calculation, generatedAt: '2027-01-02T12:00:00.000Z' });
assert.equal(F_GASES_REPORT_DTO_VERSION, 2);
assert.equal(dto.metadata.dtoType, 'techcalc.f-gases-check.report');
assert.equal(dto.summary.gwp, 675);
assert.equal(dto.summary.co2EquivalentTonnes, 5.4);
assert.equal(dto.systemSnapshot.system.refrigerantId, 'R32');
assert.ok(dto.resultGroups.length >= 6);
assert.ok(dto.sources.some(source => source.id === 'EU-FGAS'));
assert.ok(dto.applicableRegulations.some(rule => rule.id === 'AIV-009B'));

console.log('F-Gases UI/report model tests passed.');
