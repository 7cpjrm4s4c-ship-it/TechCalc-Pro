import assert from 'node:assert/strict';

import { assessChargeLimit } from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from '../modules/en-378-safety-check/installationSafetyRequirements.js';
import { calculate } from '../modules/en-378-safety-check/logic.js';
import { getEN378SafetyData } from '../core/data/refrigerants.js';

// EN 378-3:2016+A1:2020, 5.14.3.4 "Türen und Öffnungen": Maschinenräume, in denen die
// Kältemittel-Füllmenge über dem praktischen Grenzwert für den Rauminhalt liegt
// (praktischer Grenzwert kg/m³ × Raumvolumen V), benötigen eine Tür direkt oder über einen
// Vorraum mit selbstschließenden dichten Türen zu einem Notausgang ins Freie.
// Der praktische Grenzwert stammt aus EN 378-1:2016+A1:2020, Anhang E, Tabelle E.1
// (R-717: 0,00035 kg/m³). Der Faktor 26 × LFL (m2, EN 378-1 Tabelle C.2) ist für diese
// Prüfung NICHT maßgeblich.

const DOOR_ID = 'machinery-room.r717-door-to-emergency-exit';

const r717 = getEN378SafetyData('R-717');
assert.equal(r717.standardNumber, '717');
assert.equal(r717.practicalLimitKgM3, 0.00035, 'R-717 practical limit per EN 378-1 Annex E table E.1');

const baseState = {
  refrigerantId: 'R-717',
  chargeKg: '1',
  roomVolumeM3: '100',
  installationLocation: 'machinery-room',
  installationClass: 'III',
  accessArea: 'authorized-access',
  accessCategory: 'c',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasMachineryRoom: 'yes',
  machineryRoomRiskAnalysisStatus: 'present',
  machineryRoomRiskAnalysisResult: 'yes',
  machineryRoomOccupied: 'yes',
  machineryRoomRequiredAirChangeAchievable: 'yes',
  machineryRoomLargestSystemChargeKg: '1',
  hasMechanicalVentilation: 'yes',
  hasEmergencyVentilation: 'yes',
  hasEmergencyVentilationControlOutside: 'yes',
  hasEmergencyVentilationControlInside: 'yes',
  machineryRoomEmergencyFanSuitable: 'yes',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes',
  hasExplosionProtectedElectricalEquipment: 'yes',
  machineryRoomR717ContainmentProvided: 'yes',
  machineryRoomR717EyeWashProvided: 'yes',
  machineryRoomR717EmergencyShowerProvided: '',
  machineryRoomR717SprinklerInstalled: 'no',
  machineryRoomR717SprinklerConditionsConfirmed: ''
};

const findDoor = state =>
  calculate(state).installationSafetyAssessment.requirements.find(item => item.id === DOOR_ID);

// Normative Schwelle: 0,00035 kg/m³ × 100 m³ = 0,035 kg.
// Fall 1: Füllmenge 0,05 kg > 0,035 kg -> Notausgangstür muss ausgelöst werden.
const aboveState = { ...baseState, chargeKg: '0.05', roomVolumeM3: '100' };
const doorAbove = findDoor(aboveState);
assert.ok(doorAbove, '5.14.3.4 door requirement must trigger above practical limit × room volume');
assert.equal(doorAbove.status, 'required');
assert.equal(doorAbove.source.sourcePart, 'EN 378-3');
assert.equal(doorAbove.source.sourceSection, '5.14.3.4');
assert.equal(doorAbove.details.practicalLimitKg, 0.035);
assert.equal(doorAbove.details.practicalLimitKgM3, 0.00035);
assert.match(doorAbove.requirement, /praktischen Grenzwert/);
assert.match(doorAbove.measure, /0,00035|0\.00035/);
assert.match(doorAbove.measure, /5\.14\.3\.4/);
console.log('✓ Test: R-717 charge 0.05 kg > 0.00035 kg/m³ × 100 m³ = 0.035 kg triggers door to emergency exit (EN 378-3 5.14.3.4)');

// Direkter Aufruf der Bewertungsfunktion (ohne Gesamt-calculate) für denselben Fall.
const directAbove = assessInstallationSafetyRequirements(aboveState, assessChargeLimit(aboveState));
assert.ok(directAbove.requirements.some(item => item.id === DOOR_ID), 'direct assessment must also trigger the door requirement');
console.log('✓ Test: direct assessInstallationSafetyRequirements triggers the door requirement');

// Fall 2: Füllmenge 0,03 kg < 0,035 kg -> Türprüfung darf NICHT auslösen.
const belowState = { ...baseState, chargeKg: '0.03', roomVolumeM3: '100' };
assert.ok(!findDoor(belowState), '5.14.3.4 door requirement must NOT trigger below practical limit × room volume');
const directBelow = assessInstallationSafetyRequirements(belowState, assessChargeLimit(belowState));
assert.ok(!directBelow.requirements.some(item => item.id === DOOR_ID), 'direct assessment must not trigger the door requirement below the threshold');
console.log('✓ Test: R-717 charge 0.03 kg <= 0.035 kg does not trigger the door requirement');

// Regressionsschutz gegen die alte fehlerhafte Schwelle 26 × LFL × V (= 301,6 kg bei V = 100 m³):
// Eine Füllmenge knapp über dem normativen Grenzwert (z. B. 0,05 kg) darf auf keinen Fall
// unter der alten m2-Schwelle liegen.
assert.ok(0.05 < 26 * r717.lflKgM3 * 100, 'sanity: old m2-based threshold would have missed the 0.05 kg case');
console.log('✓ Test: old 26 × LFL × V threshold (301.6 kg) would NOT have triggered at 0.05 kg - regression covered');

console.log('EN 378 R-717 door check (EN 378-3 5.14.3.4) tests passed.');
