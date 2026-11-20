import assert from 'node:assert/strict';

import {
  assessAlternativeRiskManagementC3,
  assessChargeLimit,
  calculateC21Trigger,
  calculateComfortChargeLimit,
  calculateFlammabilityMassLimits,
  calculateMinimumComfortFloorArea,
  effectiveRoomVolumeForC3,
  isC22Applicable
} from '../modules/en-378-safety-check/chargeLimitCalculation.js';
import { getEN378SafetyData } from '../core/data/refrigerants.js';

// Regressionstests für die Rechenbeispiele aus EN 378-1, Anhang H
// (H.1/H.2: C.2.1 mit R-290; H.3: C.3 mit R-134a, 90 kg, 300 m³; H.4: C.3 mit R-410A, beide Volumina).
// Kältemitteldaten nach Anhang E (en378-safety-data.js): R-290 LFL = 0,038 kg/m³, M = 44 g/mol.

const r290 = getEN378SafetyData('R-290');
const r134a = getEN378SafetyData('R-134a');
const r410a = getEN378SafetyData('R-410A');
assert.equal(r290.safetyClass, 'A3');
assert.equal(r290.lflKgM3, 0.038);
assert.equal(r290.molarMassKgKmol, 44);

// m1 = 4 m³ × LFL, m2 = 26 m³ × LFL, m3 = 130 m³ × LFL (EN 378-1, C.1/C.2)
assert.deepEqual(calculateFlammabilityMassLimits(0.038), { m1Kg: 0.152, m2Kg: 0.988, m3Kg: 4.9399999999999995 });

// H.1 (C.2.1, R-290, Bodenmontage h0 = 0,6, A = 25 m²):
// m_max = 2,5 × LFL^1,25 × h0 × A^0,5 = 2,5 × 0,038^1,25 × 0,6 × 5 ≈ 0,126 kg
assert.ok(Math.abs(calculateComfortChargeLimit({ lflKgM3: 0.038, floorAreaM2: 25, mountingType: 'floor' }) - 0.12583190141272665) < 1e-9);
// A_min = m² / (2,5 × LFL^1,25 × h0)² für m = 0,5 kg ≈ 394,73 m²
assert.ok(Math.abs(calculateMinimumComfortFloorArea({ chargeKg: 0.5, lflKgM3: 0.038, mountingType: 'floor' }) - 394.72851342149664) < 1e-6);

// H.2 (C.2.1, R-290, Wandmontage h0 = 1,8, A = 20 m²):
// m_max = 2,5 × 0,038^1,25 × 1,8 × √20 ≈ 0,338 kg; A_min für m = 0,5 kg ≈ 43,86 m²
assert.ok(Math.abs(calculateComfortChargeLimit({ lflKgM3: 0.038, floorAreaM2: 20, mountingType: 'wall' }) - 0.3376424223562904) < 1e-9);
assert.ok(Math.abs(calculateMinimumComfortFloorArea({ chargeKg: 0.5, lflKgM3: 0.038, mountingType: 'wall' }) - 43.85872371349963) < 1e-6);

// C.2.1-Auslöseschwelle: 1,5 × m1 (2L) bzw. m1 (Klassen 2 und 3); Gleichungen nur oberhalb der Schwelle
const trigger2L = calculateC21Trigger({ flammabilityClass: '2L', lflKgM3: 0.307, chargeKg: 2.5 });
assert.equal(trigger2L.m1Kg, 1.228);
assert.equal(trigger2L.triggerKg, 1.842);
assert.equal(trigger2L.exceeded, true);
assert.equal(calculateC21Trigger({ flammabilityClass: '3', lflKgM3: 0.038, chargeKg: 0.1 }).exceeded, false);
assert.equal(calculateC21Trigger({ flammabilityClass: '3', lflKgM3: 0.038, chargeKg: 0.5 }).exceeded, true);

// C.2.2-Anwendbarkeit: 4 × LFL < m ≤ 8 × LFL (R-290: 0,152 kg < m ≤ 0,304 kg)
assert.equal(isC22Applicable({ lflKgM3: 0.038, chargeKg: 0.2 }), true);
assert.equal(isC22Applicable({ lflKgM3: 0.038, chargeKg: 0.1 }), false);
assert.equal(isC22Applicable({ lflKgM3: 0.038, chargeKg: 0.4 }), false);

// C.2.1 im Assessment: unter der Schwelle keine Gleichungsanwendung, darüber Gleichung + Deckel (Klasse 3: 1,5 kg)
const comfortBase = {
  refrigerantId: 'R-290',
  chargeKg: '0.1',
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'human-comfort',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  floorAreaM2: '25',
  isFactorySealed: 'no',
  mountingType: 'floor'
};
const belowTrigger = assessChargeLimit(comfortBase);
const flammabilityBelow = belowTrigger.checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(flammabilityBelow.rule, 'c2-1-trigger-not-exceeded');
assert.equal(flammabilityBelow.status, 'passed');
assert.equal(flammabilityBelow.maximumChargeKg, 0.152);

const aboveTrigger = assessChargeLimit({ ...comfortBase, chargeKg: '0.5' });
const flammabilityAbove = aboveTrigger.checks.find(check => check.id === 'charge-limit.flammability');
assert.equal(flammabilityAbove.rule, 'comfort-application-c2-or-c3');
assert.equal(flammabilityAbove.details.exceeded, true);
assert.equal(flammabilityAbove.details.equationApplies, true, 'R-290: M = 44 g/mol > 42 g/mol, Gleichung (C.1)/(C.2) anwendbar');
assert.equal(flammabilityAbove.details.capKg, 1.5, 'Klasse 3: Deckel 1,5 kg nach Tabelle C.2');
assert.ok(Math.abs(flammabilityAbove.details.comfortChargeLimitKg - 0.12583190141272665) < 1e-9);
assert.equal(flammabilityAbove.maximumChargeKg, 0.12583190141272665, 'min(Gleichung, 1,5 kg) = Gleichungswert');

// H.3 (C.3, R-134a, 90 kg, 300 m³): Konzentration 0,3 kg/m³; QLMV = 0,28, QLAV = 0,58 (Tabelle C.3)
// 0,28 < 0,3 ≤ 0,58 -> 1 zusätzliche Maßnahme; ohne Maßnahmen max. 0,28 × 300 = 84 kg, mit QLAV 0,58 × 300 = 174 kg
const h3 = assessAlternativeRiskManagementC3({ safetyData: r134a, chargeKg: 90, roomVolumeM3: 300, locationLevel: 'other' });
assert.equal(h3.concentrationKgM3, 0.3);
assert.equal(h3.status, 'failed');
assert.equal(h3.rule, 'between-qlmv-and-qlav');
assert.equal(h3.details.qlmvKgM3, 0.28);
assert.equal(h3.details.qlavKgM3, 0.58);
assert.ok(h3.requirements.some(item => item.includes('Mindestens 1 zus\u00e4tzliche Sicherheitsma\u00dfnahme')));

// H.4 (C.3, R-410A, beide Volumina): RCL = 0,39, QLMV = QLAV = 0,42 (Tabelle C.3)
// 130 kg in 300 m³ -> 0,433 kg/m³ > QLAV -> nicht beherrschbar; 130 kg in 1000 m³ -> 0,13 ≤ QLMV -> ohne Zusatzmaßnahmen
const h4Small = assessAlternativeRiskManagementC3({ safetyData: r410a, chargeKg: 130, roomVolumeM3: 300, locationLevel: 'other' });
const h4Large = assessAlternativeRiskManagementC3({ safetyData: r410a, chargeKg: 130, roomVolumeM3: 1000, locationLevel: 'other' });
assert.equal(h4Small.rule, 'concentration-above-qlav');
assert.equal(h4Small.status, 'failed');
assert.equal(h4Large.rule, 'concentration-not-above-qlmv');
assert.equal(h4Large.status, 'passed');

// C.3.2.1-Grundflächendeckel: über 250 m² wird mit dem Volumen auf Basis von 250 m² gerechnet
assert.equal(effectiveRoomVolumeForC3({ roomVolumeM3: 1000, floorAreaM2: 400 }), 625);
assert.equal(effectiveRoomVolumeForC3({ roomVolumeM3: 1000, floorAreaM2: 200 }), 1000);
const capped = assessAlternativeRiskManagementC3({ safetyData: r134a, chargeKg: 200, roomVolumeM3: 1000, floorAreaM2: 400, locationLevel: 'other' });
const uncapped = assessAlternativeRiskManagementC3({ safetyData: r134a, chargeKg: 200, roomVolumeM3: 1000, locationLevel: 'other' });
assert.equal(capped.rule, 'between-qlmv-and-qlav', 'mit 250-m²-Deckel: 200/625 = 0,32 > QLMV 0,28');
assert.equal(uncapped.rule, 'concentration-not-above-qlmv', 'ohne Deckel: 200/1000 = 0,2 ≤ QLMV');
assert.equal(capped.details.effectiveRoomVolumeM3, 625);

// QLAV/QLMV-Fallback außerhalb Tabelle C.3 (R-290): QLAV = min(ODL, 50 % LFL) = 0,019; QLMV = 20 % LFL = 0,0076
const fallback = assessAlternativeRiskManagementC3({ safetyData: r290, chargeKg: 0.5, roomVolumeM3: 50, locationLevel: 'other' });
assert.equal(fallback.details.qlavKgM3, 0.019);
assert.equal(fallback.details.qlmvKgM3, 0.0076);
assert.equal(fallback.details.qlmvQlavFallback, true);
assert.equal(fallback.details.rclKgM3, 0.008);
assert.equal(fallback.rule, 'between-qlmv-and-qlav', '0,5/50 = 0,01 kg/m³ liegt zwischen QLMV und QLAV');

console.log('EN 378 Annex H example regression tests passed.');
