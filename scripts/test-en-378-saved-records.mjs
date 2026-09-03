import assert from 'node:assert/strict';

import moduleDefinition from '../js/modules/en-378-safety-check/index.js';
import {
  buildEN378SavedRecord,
  buildEN378SavedRecordsModel,
  hydrateEN378SavedRecord
} from '../js/modules/en-378-safety-check/savedRecords.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { renderSavedRecordPanel } from '../js/core/savedRecords.js';
const state = {
  importedSystemName: 'Wärmepumpe Dachzentrale',
  refrigerantId: 'R-32',
  chargeKg: '2.5',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasGasWarningSystem: 'yes',
  hasMachineryRoom: 'no',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  savedAssessments: [],
  activeSavedAssessmentId: '',
  expandedSavedAssessmentId: '',
  savedAssessmentName: ''
};
const result = calculate(state);
const record = buildEN378SavedRecord(state, result);
assert.equal(moduleDefinition.controller.savedRecords.enabled, true);
assert.equal(moduleDefinition.controller.savedRecords.listKey, 'savedAssessments');
assert.equal(moduleDefinition.controller.savedRecords.activeIdKey, 'activeSavedAssessmentId');
assert.equal(moduleDefinition.controller.savedRecords.nameKey, 'savedAssessmentName');
assert.equal(record.name, 'Wärmepumpe Dachzentrale');
assert.equal(record.inputState.savedAssessments, undefined);
assert.equal(record.inputState.activeSavedAssessmentId, undefined);
assert.equal(record.resultSummary.statusLabel, 'Anforderungen nach aktuellem Prüfstand erfüllt');
assert.equal(record.resultSummary.refrigerantId, 'R-32');
assert.equal(record.resultSummary.chargeKg, 2.5);
const hydrated = hydrateEN378SavedRecord({ id: 'saved-1', name: record.name, inputState: record.inputState });
assert.equal(hydrated.savedAssessmentName, 'Wärmepumpe Dachzentrale');
assert.equal(hydrated.refrigerantId, 'R-32');
assert.equal(hydrated.chargeKg, '2.5');
const model = buildEN378SavedRecordsModel({
  savedAssessmentName: 'Bewertung 1',
  activeSavedAssessmentId: 'saved-1',
  expandedSavedAssessmentId: 'saved-1',
  savedAssessments: [{ id: 'saved-1', ...record }]
});
assert.equal(model.enabled, true);
assert.equal(model.title, 'Gespeicherte EN-378-Bewertungen');
assert.equal(model.items.length, 1);
assert.equal(model.items[0].title, 'Wärmepumpe Dachzentrale');
assert.ok(model.items[0].subtitle.includes('R-32'));
assert.ok(model.items[0].stats.some(item => item.label === 'Status'));

const panelHtml = renderSavedRecordPanel({
  nameValue: 'Bewertung 1',
  addDisabled: true,
  updateDisabled: false,
  listHtml: '<div></div>'
});
assert.match(panelHtml, /data-line-update/);
assert.match(panelHtml, /data-line-update[^>]*>Aktualisieren<\/button>/);
assert.doesNotMatch(panelHtml, /data-line-update[^>]*action-button--secondary/);

console.log('EN 378 saved records tests passed.');
