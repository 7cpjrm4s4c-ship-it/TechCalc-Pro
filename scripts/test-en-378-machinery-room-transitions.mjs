import assert from 'node:assert/strict';

import { normalizeEN378StateTransition } from '../modules/en-378-safety-check/stateTransitions.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { MACHINERY_ROOM_5_1_TO_5_14_FIELDS } from '../modules/en-378-safety-check/machineryRoomRiskAnalysis.js';

// Base state for machinery room calculations
const baseMachineryRoomState = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'machinery-room',
  installationClass: 'III',
  accessArea: 'authorized-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasMachineryRoom: 'yes',
  machineryRoomRiskAnalysisStatus: '',
  machineryRoomRiskAnalysisResult: '',
  machineryRoomRiskAnalysisNotes: '',
  isBasementLocation: ''
};

const baseState = {
  refrigerantId: 'R-32',
  chargeKg: '8',
  roomVolumeM3: '80',
  installationLocation: 'machinery-room',
  installationClass: 'III',
  accessArea: 'authorized-access',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasMachineryRoom: 'yes',
  machineryRoomRiskAnalysisStatus: '',
  machineryRoomRiskAnalysisResult: '',
  machineryRoomRiskAnalysisNotes: '',
  isBasementLocation: '',
  // Set some 5.1-5.14 fields to non-empty values
  machineryRoomLargestSystemChargeKg: '8',
  hasEmergencyVentilation: 'yes',
  hasEmergencyVentilationControlInside: 'yes',
  hasEmergencyVentilationControlOutside: 'yes'
};

// Test 1: Status 'present' neu gewählt - Result auf '' setzen
console.log('Test 1: Status present neu gewählt - Result auf empty setzen...');
const test1 = normalizeEN378StateTransition(baseState, { machineryRoomRiskAnalysisStatus: 'present' }, { action: 'field:input:select' });
assert.equal(test1.machineryRoomRiskAnalysisStatus, 'present');
assert.equal(test1.machineryRoomRiskAnalysisResult, '');
// Check that 5.1-5.14 fields are reset
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test1[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 1 passed');

// Test 2: Status von 'present' auf '' gewählt - Result und Notes leeren, 5.1-5.14 Felder zurücksetzen
console.log('Test 2: Status von present auf empty - Result, Notes und 5.1-5.14 Felder zurücksetzen...');
const test2Current = {
  ...baseState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomRiskAnalysisNotes: 'Testnotiz',
  machineryRoomLargestSystemChargeKg: '8'
};
const test2 = normalizeEN378StateTransition(test2Current, { machineryRoomRiskAnalysisStatus: '' }, { action: 'field:input:select' });
assert.equal(test2.machineryRoomRiskAnalysisStatus, '');
assert.equal(test2.machineryRoomRiskAnalysisResult, '');
assert.equal(test2.machineryRoomRiskAnalysisNotes, '');
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test2[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 2 passed');

// Test 3: Result 'yes' neu gewählt - 5.1-5.14 Felder zurücksetzen
console.log('Test 3: Result yes neu gewählt - 5.1-5.14 Felder zurücksetzen...');
const test3Current = {
  ...baseState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: '',
  machineryRoomLargestSystemChargeKg: '8'
};
const test3 = normalizeEN378StateTransition(test3Current, { machineryRoomRiskAnalysisResult: 'yes' }, { action: 'field:input:select' });
assert.equal(test3.machineryRoomRiskAnalysisResult, 'yes');
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test3[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 3 passed');

// Test 4: Result 'no' neu gewählt - 5.1-5.14 Felder zurücksetzen
console.log('Test 4: Result no neu gewählt - 5.1-5.14 Felder zurücksetzen...');
const test4Current = {
  ...baseState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: '',
  machineryRoomLargestSystemChargeKg: '8'
};
const test4 = normalizeEN378StateTransition(test4Current, { machineryRoomRiskAnalysisResult: 'no' }, { action: 'field:input:select' });
assert.equal(test4.machineryRoomRiskAnalysisResult, 'no');
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test4[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 4 passed');

// Test 5: Result von 'yes' auf 'no' - 5.1-5.14 Felder zurücksetzen
console.log('Test 5: Result von yes auf no - 5.1-5.14 Felder zurücksetzen...');
const test5Current = {
  ...baseState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomLargestSystemChargeKg: '8'
};
const test5 = normalizeEN378StateTransition(test5Current, { machineryRoomRiskAnalysisResult: 'no' }, { action: 'field:input:select' });
assert.equal(test5.machineryRoomRiskAnalysisResult, 'no');
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test5[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 5 passed');

// Test 6: Auslöser-Feld ändern (refrigerantId) - Result auf '' setzen, Notes bleiben, 5.1-5.14 Felder leeren
console.log('Test 6: Auslöser-Feld refrigerantId ändern - Result auf empty, Notes bleiben, 5.1-5.14 Felder leeren...');
const test6Current = {
  ...baseState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomRiskAnalysisNotes: 'Testnotiz',
  machineryRoomLargestSystemChargeKg: '8'
};
const test6 = normalizeEN378StateTransition(test6Current, { refrigerantId: 'R-717' }, { action: 'field:input:select' });
assert.equal(test6.machineryRoomRiskAnalysisResult, '');
// Notes remain means they are not in the patch (not reset to empty)assert.equal(test6.machineryRoomRiskAnalysisNotes, undefined, 'Notes should not be in patch (remain unchanged)');
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test6[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 6 passed');

// Test 7: locationLevel ändern - isBasementLocation auf '' setzen
console.log('Test 7: locationLevel ändern - isBasementLocation auf empty setzen...');
const test7Current = {
  ...baseState,
  locationLevel: 'upper-no-emergency-exit-or-basement',
  isBasementLocation: 'yes'
};
const test7 = normalizeEN378StateTransition(test7Current, { locationLevel: 'other' }, { action: 'field:input:select' });
assert.equal(test7.isBasementLocation, '');
console.log('✓ Test 7 passed');

// Test 8: installationLocation weg von 'machinery-room' - alle 4.3-Felder zurücksetzen
console.log('Test 8: installationLocation weg von machinery-room - alle 4.3-Felder zurücksetzen...');
const test8Current = {
  ...baseState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomRiskAnalysisNotes: 'Testnotiz',
  isBasementLocation: 'yes',
  machineryRoomLargestSystemChargeKg: '8'
};
const test8 = normalizeEN378StateTransition(test8Current, { installationLocation: 'outdoor' }, { action: 'field:input:select' });
assert.equal(test8.machineryRoomRiskAnalysisStatus, '');
assert.equal(test8.machineryRoomRiskAnalysisResult, '');
assert.equal(test8.machineryRoomRiskAnalysisNotes, '');
assert.equal(test8.isBasementLocation, '');
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test8[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 8 passed');

// Test 9: locationLevel auf 'upper-no-emergency-exit-or-basement' ändern - isBasementLocation nicht automatisch gesetzt
console.log('Test 9: locationLevel auf upper-no-emergency-exit-or-basement ändern...');
const test9Current = {
  ...baseState,
  locationLevel: 'other',
  isBasementLocation: ''
};
const test9 = normalizeEN378StateTransition(test9Current, { locationLevel: 'upper-no-emergency-exit-or-basement' }, { action: 'field:input:select' });
assert.equal(test9.locationLevel, 'upper-no-emergency-exit-or-basement');
// isBasementLocation should be reset to empty when locationLevel changes
assert.equal(test9.isBasementLocation, '');
console.log('✓ Test 9 passed');

// Test 10: Keine Änderungen bei nicht-Field-Selection-Commit
console.log('Test 10: Keine Änderungen bei nicht-Field-Selection-Commit...');
const test10 = normalizeEN378StateTransition(baseState, { machineryRoomRiskAnalysisStatus: 'present' }, { action: 'hydration' });
assert.equal(test10.machineryRoomRiskAnalysisStatus, 'present', 'Should return patch unchanged on non-field-selection action');
console.log('✓ Test 10 passed');


// Test 11: isBasementLocation ändern - Result auf empty setzen, Notes bleiben, 5.1-5.14 Felder leeren
console.log('Test 11: isBasementLocation ändern - Result auf empty, Notes bleiben, 5.1-5.14 Felder leeren...');
const test11Current = {
  ...baseState,
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomRiskAnalysisNotes: 'Testnotiz',
  isBasementLocation: 'no',
  machineryRoomLargestSystemChargeKg: '8'
};
const test11 = normalizeEN378StateTransition(test11Current, { isBasementLocation: 'yes' }, { action: 'field:input:select' });
assert.equal(test11.machineryRoomRiskAnalysisResult, '');
// Notes should remain (not in patch)
assert.equal(test11.machineryRoomRiskAnalysisNotes, undefined, 'Notes should not be in patch');
for (const field of MACHINERY_ROOM_5_1_TO_5_14_FIELDS) {
  assert.equal(test11[field], '', `Field ${field} should be reset`);
}
console.log('✓ Test 11 passed');


// Test 12: Check erscheint nicht bei installationLocation 'outdoor'
console.log('Test 12: Check erscheint nicht bei installationLocation outdoor...');
const test12 = calculate({
  ...baseMachineryRoomState,
  installationLocation: 'outdoor',
  locationLevel: 'underground',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes'
});
assert.equal(test12.belowGradeDetectorAlarm, null, 'Check should not appear for outdoor location');
console.log('✓ Test 12 passed');

// Test 13: Check erscheint nicht bei installationLocation 'occupied-space'
console.log('Test 13: Check erscheint nicht bei installationLocation occupied-space...');
const test13 = calculate({
  ...baseMachineryRoomState,
  installationLocation: 'occupied-space',
  locationLevel: 'underground',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes'
});
assert.equal(test13.belowGradeDetectorAlarm, null, 'Check should not appear for occupied-space location');
console.log('✓ Test 13 passed');

// Test 14: Check erscheint nicht bei offenem Ergebnis (Status '')
console.log('Test 14: Check erscheint nicht bei offenem Ergebnis (Status empty)...');
const test14 = calculate({
  ...baseMachineryRoomState,
  locationLevel: 'underground',
  machineryRoomRiskAnalysisStatus: '',
  machineryRoomRiskAnalysisResult: ''
});
assert.equal(test14.belowGradeDetectorAlarm, null, 'Check should not appear when status is empty');
console.log('✓ Test 14 passed');

// Test 15: Check erscheint nicht bei offenem Ergebnis (Result '')
console.log('Test 15: Check erscheint nicht bei offenem Ergebnis (Result empty)...');
const test15 = calculate({
  ...baseMachineryRoomState,
  locationLevel: 'underground',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: ''
});
assert.equal(test15.belowGradeDetectorAlarm, null, 'Check should not appear when result is empty');
console.log('✓ Test 15 passed');

console.log('\n✅ Alle Machinery Room Transition Tests bestanden!');
