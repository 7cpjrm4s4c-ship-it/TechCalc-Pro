import assert from 'node:assert/strict';
import { calculate } from '../js/modules/f-gases-check/logic.js';
import { buildFGasesReportDto } from '../js/modules/f-gases-check/reportAdapter.js';
import { buildFGasesSavedRecord, hydrateFGasesSavedRecord, buildFGasesSavedRecordsModel } from '../js/modules/f-gases-check/savedRecords.js';
import { buildFGasesReportSections } from '../js/core/pdf/fGasesReportSections.js';
import { reportSections } from '../js/core/pdf/pdfDataMapping.js';

const state = {
  schemaVersion: 4,
  systemName: 'WP Nord', applicationType: 'heat-pump', installationType: 'stationary', productCategory: 'split-ac-heat-pump', constructionType: 'split', splitType: 'air-water', ratedCapacityKw: '10',
  refrigerantId: 'R32', chargeKg: '8', assessmentDate: '2027-01-02', placedOnMarketDate: '2027-01-02', plannedActivity: 'installation', preChargedStatus: 'yes',
  siteSafetyRestrictionStatus: 'no', nationalSafetyStandardRestrictionStatus: 'no', hermeticallySealedStatus: 'no', hermeticallySealedLabelStatus: 'no', leakDetectionSystemStatus: 'no',
  personCertificationStatus: 'verified', companyCertificationStatus: 'verified', savedSystems: [], activeSavedSystemId: null, expandedSavedSystemId: null, savedSystemName: 'WP Nord Bestand'
};
const calculation = calculate(state);
const saved = buildFGasesSavedRecord(state, calculation);
assert.equal(saved.name, 'WP Nord Bestand');
assert.equal(saved.systemSnapshot.snapshotType, 'techcalc.f-gases.system');
assert.equal(saved.systemSnapshot.system.refrigerantId, 'R32');
assert.equal(saved.inputState.savedSystems, undefined);
assert.equal(saved.resultSummary.gwp, 675);
const hydrated = hydrateFGasesSavedRecord(saved);
assert.equal(hydrated.systemName, 'WP Nord');
assert.equal(hydrated.savedSystemName, 'WP Nord Bestand');
state.systemName = 'Geändert';
assert.equal(saved.systemSnapshot.system.systemName, 'WP Nord');
const model = buildFGasesSavedRecordsModel({ ...state, savedSystems: [{ id: 'f-gases-system-1', ...saved }] });
assert.equal(model.items.length, 1);
assert.equal(model.loadAttr, 'data-saved-load');
const dto = buildFGasesReportDto({ state: hydrated, calculation: calculate(hydrated), generatedAt: '2027-01-02T12:00:00.000Z' });
const sections = buildFGasesReportSections(dto);
assert.equal(sections.length, 8);
assert.equal(sections[0].title, '1. Regulatorische Ergebnisübersicht');
assert.ok(sections.some(section => section.title.includes('Dichtheitskontrolle')));
assert.ok(sections.some(section => section.rows.some(row => row[0] === 'Rechtsdaten')));
const mapped = reportSections({ reportSource: 'typed-dto', reportDto: dto });
assert.equal(mapped.length, 8);
assert.equal(mapped[0].title, '1. Regulatorische Ergebnisübersicht');
console.log('F-Gases PDF/saved-record tests passed.');
