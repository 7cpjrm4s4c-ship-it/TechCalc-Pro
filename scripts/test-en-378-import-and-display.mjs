import assert from 'node:assert/strict';

import { createFGasesSystemSnapshot } from '../js/shared/fGasesSystemSnapshot.js';
import { state as fGasesState } from '../js/modules/f-gases-check/state.js';
import { buildFGasesImportOptions, buildFGasesImportPatch, hasAnyFGasesSavedSystem, hasMultipleFGasesSavedSystems } from '../js/modules/en-378-safety-check/importController.js';
import { calculate } from '../js/modules/en-378-safety-check/logic.js';
import { buildEN378SafetyCheckResultModel } from '../js/modules/en-378-safety-check/results.js';
import { fieldLabel, validationIssueLabel } from '../js/modules/en-378-safety-check/displayLabels.js';

fGasesState.set({
  savedSystems: [
    {
      id: 'system-1',
      name: 'Wärmepumpe Dachzentrale',
      systemSnapshot: createFGasesSystemSnapshot({ systemName: 'Wärmepumpe Dachzentrale', refrigerantId: 'R-32', chargeKg: '2,5' }, { generatedAt: '2026-09-01T00:00:00.000Z' })
    },
    {
      id: 'system-2',
      name: 'Kaltwassersatz Technikraum',
      systemSnapshot: createFGasesSystemSnapshot({ systemName: 'Kaltwassersatz Technikraum', refrigerantId: 'R-134a', chargeKg: '5' }, { generatedAt: '2026-09-01T00:00:00.000Z' })
    }
  ]
}, { notify: false });

assert.equal(hasAnyFGasesSavedSystem(), true);
assert.equal(hasMultipleFGasesSavedSystems(), true);
assert.equal(buildFGasesImportOptions().length, 3);
assert.equal(fieldLabel('qlmvKgM3'), 'Grenzwert QLMV für Mindestlüftung');
assert.equal(fieldLabel('qlavKgM3'), 'Grenzwert QLAV für zusätzliche Lüftung');

const patch = buildFGasesImportPatch({ fGasesSnapshotId: 'system-1' });
assert.equal(patch.importStatus, 'imported');
assert.equal(patch.importStatusMessage, 'Anlage wurde importiert. Die Angaben wurden als Kopie übernommen.');
assert.equal(patch.importedSystemName, 'Wärmepumpe Dachzentrale');
assert.equal(patch.refrigerantId, 'R-32');
assert.equal(patch.chargeKg, '2.5');

const calculation = calculate({
  ...patch,
  roomVolumeM3: '50',
  installationLocation: 'occupied-space',
  installationClass: 'I',
  accessArea: 'general-access',
  accessCategory: 'a',
  usageType: 'commercial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  hasGasWarningSystem: 'yes',
  hasMachineryRoom: 'no',
  hasDetector: 'yes',
  hasAlarm: 'yes',
  hasIndependentAlarmPower: 'yes'
});
const resultModel = buildEN378SafetyCheckResultModel({ ...patch, installationLocation: 'occupied-space', accessCategory: 'a' }, calculation);
assert.equal(resultModel.primary.primary.value, 'Anforderungen nach aktuellem Prüfstand erfüllt');
assert.equal(validationIssueLabel('refrigerantId:required'), 'Kältemittel fehlt.');
assert.equal(resultModel.groups.some(group => JSON.stringify(group).includes('not-assessed')), false);
assert.equal(resultModel.groups.some(group => JSON.stringify(group).includes('refrigerantId:required')), false);

const r513aCalculation = calculate({
  refrigerantId: 'R-513A',
  chargeKg: '24.4',
  roomVolumeM3: '6000',
  installationLocation: 'technical-room',
  installationClass: 'I',
  accessArea: 'authorized-access',
  accessCategory: 'c',
  usageType: 'industrial',
  applicationType: 'other',
  locationLevel: 'other',
  ventilationType: 'mechanical',
  usesAlternativeRiskManagement: 'no'
});
assert.equal(r513aCalculation.status, 'acceptable');
assert.equal(r513aCalculation.plannerGuidance.missingInputs.includes('Grenzwert QLMV für Mindestlüftung'), false);
assert.equal(r513aCalculation.plannerGuidance.missingInputs.includes('Grenzwert QLAV für zusätzliche Lüftung'), false);

console.log('EN 378 import and display tests passed.');
