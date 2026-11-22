import { MACHINERY_ROOM_5_1_TO_5_14_FIELDS } from './machineryRoomRiskAnalysis.js';

const EN60335_REGULAR_ASSESSMENT_FIELDS = Object.freeze([
  'outdoorEN3782_6_2_14HazardousAreaConfirmed',
  'outdoorEN3782_6_2_14HazardousAreaEvidenceReference',
  'outdoorEN3782_6_2_14ComponentAssessmentConfirmed',
  'outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference',
  'outdoorEN3782_6_2_14ProtectionConditionsConfirmed',
  'outdoorEN3782_6_2_14ProtectionEvidenceReference',
  'outdoorEN3782_6_2_14AirflowProtectionUsed',
  'outdoorEN3782_6_2_14AirflowAvailabilityConfirmed',
  'outdoorEN3782_6_2_14AirflowInterlockConfirmed',
  'outdoorEN3782_6_2_14SurfaceTemperatureConfirmed',
  'outdoorEN3782_6_2_14HazardousAreaExceedsEquipment',
  'outdoorEN3782_6_2_14EquipmentDocumentationUpdated'
]);

const EN60335_SWITCH_FIELDS = Object.freeze([
  'outdoorEN3782_6_2_14EN60335Compliant',
  'outdoorEN3782_6_2_14EN60335EvidenceReference'
]);

// EN 378-3, 4.5: Felder des Aufstellorts "Technischer Raum" (werden beim Verlassen des
// Aufstellorts zurückgesetzt, analog zum Maschinenraum-Muster unten).
export const TECHNICAL_ROOM_TRANSITION_FIELDS = Object.freeze([
  'technicalRoomSeparatedFromOccupiedSpaces',
  'technicalRoomContainsCompressorOrPressureVessel',
  'technicalRoomComponentsHaveDetachableJoints',
  'technicalRoomAdverseConditions',
  'technicalRoomExhaustHoodFlowRateM3s',
  'technicalRoomVentilationActivatesDetector'
]);

// EN 378-3, 4.6: Felder des Aufstellorts "Belüftetes Gehäuse" (werden beim Verlassen des
// Aufstellorts zurückgesetzt).
export const VENTILATED_ENCLOSURE_TRANSITION_FIELDS = Object.freeze([
  'enclosureVolumeM3',
  'ventilatedEnclosureDuctPerManufacturerInstructions',
  'ventilatedEnclosureFreshAirSufficient',
  'ventilatedEnclosureDuctToOutdoor',
  'ventilatedEnclosureToxicityLocationClass'
]);

const isFieldSelectionCommit = action =>
  action === 'field:input:select' || action === 'field:change:immediate';

const clearFields = (patch, fields) => {
  fields.forEach(field => { patch[field] = ''; });
};

/**
 * Normalizes dependent EN 378-2, 6.2.14 inputs on interactive parent changes.
 * Also handles machinery room risk analysis transitions per EN 378-3, 4.3.
 * Hydration/import/programmatic updates deliberately bypass this transition.
 */
export function normalizeEN378StateTransition(currentState = {}, incomingPatch = {}, meta = {}) {
  const patch = { ...incomingPatch };
  if (!isFieldSelectionCommit(meta.action)) return patch;

  // ========================================================================
  // EN 378-2, 6.2.14 transitions (outdoor) - unchanged
  // ========================================================================
  if (Object.hasOwn(patch, 'outdoorEN3782_6_2_14EN60335Applicable') &&
      patch.outdoorEN3782_6_2_14EN60335Applicable !== currentState.outdoorEN3782_6_2_14EN60335Applicable) {
    clearFields(patch, EN60335_SWITCH_FIELDS);
    clearFields(patch, EN60335_REGULAR_ASSESSMENT_FIELDS);
  }

  if (Object.hasOwn(patch, 'outdoorEN3782_6_2_14EN60335Compliant') &&
      patch.outdoorEN3782_6_2_14EN60335Compliant !== currentState.outdoorEN3782_6_2_14EN60335Compliant) {
    clearFields(patch, EN60335_REGULAR_ASSESSMENT_FIELDS);
  }

  // ========================================================================
  // Machinery Room Risk Analysis transitions per EN 378-3, 4.3
  // ========================================================================

  // Track if we need to reset 5.1-5.14 fields
  let shouldResetMachineryRoomFields = false;
  let shouldClearNotes = false;

  // 1. Status 'present' neu gewählt: Result auf '' setzen
  if (Object.hasOwn(patch, 'machineryRoomRiskAnalysisStatus') &&
      patch.machineryRoomRiskAnalysisStatus === 'present' &&
      currentState.machineryRoomRiskAnalysisStatus !== 'present') {
    patch.machineryRoomRiskAnalysisResult = '';
    shouldResetMachineryRoomFields = true;
  }

  // 2. Status von 'present' auf '' gewählt: Result auf '' setzen und Notes leeren
  if (Object.hasOwn(patch, 'machineryRoomRiskAnalysisStatus') &&
      patch.machineryRoomRiskAnalysisStatus === '' &&
      currentState.machineryRoomRiskAnalysisStatus === 'present') {
    patch.machineryRoomRiskAnalysisResult = '';
    patch.machineryRoomRiskAnalysisNotes = '';
    shouldResetMachineryRoomFields = true;
    shouldClearNotes = true;
  }

  // 3. Result 'yes' neu gewählt (vorher '' oder 'no'): 5.1-5.14 Felder zurücksetzen
  if (Object.hasOwn(patch, 'machineryRoomRiskAnalysisResult') &&
      patch.machineryRoomRiskAnalysisResult === 'yes' &&
      currentState.machineryRoomRiskAnalysisResult !== 'yes') {
    shouldResetMachineryRoomFields = true;
  }

  // 4. Result 'no' neu gewählt: dieselbe Feldliste zurücksetzen
  if (Object.hasOwn(patch, 'machineryRoomRiskAnalysisResult') &&
      patch.machineryRoomRiskAnalysisResult === 'no' &&
      currentState.machineryRoomRiskAnalysisResult !== 'no') {
    shouldResetMachineryRoomFields = true;
  }

  // 5. Result von 'yes' auf 'no' oder umgekehrt: 5.1-5.14 Felder zurücksetzen
  if (Object.hasOwn(patch, 'machineryRoomRiskAnalysisResult') &&
      currentState.machineryRoomRiskAnalysisResult !== '' &&
      patch.machineryRoomRiskAnalysisResult !== '' &&
      patch.machineryRoomRiskAnalysisResult !== currentState.machineryRoomRiskAnalysisResult) {
    shouldResetMachineryRoomFields = true;
  }

  // 6. Auslöser-Felder ändern: Status bleibt 'present', Result auf '' setzen, Notes bleiben, 5.1-5.14 Felder leeren
  const triggerFields = ['refrigerantId', 'chargeKg', 'accessArea', 'locationLevel', 'isBasementLocation'];
  for (const field of triggerFields) {
    if (Object.hasOwn(patch, field) &&
        patch[field] !== currentState[field] &&
        currentState.machineryRoomRiskAnalysisStatus === 'present') {
      // Result auf '' setzen
      patch.machineryRoomRiskAnalysisResult = '';
      // 5.1-5.14 Felder zurücksetzen
      shouldResetMachineryRoomFields = true;
      // Notes bleiben erhalten (nicht zurücksetzen)
    }
  }

  // 7. locationLevel ändern: isBasementLocation auf '' setzen
  if (Object.hasOwn(patch, 'locationLevel') &&
      patch.locationLevel !== currentState.locationLevel) {
    patch.isBasementLocation = '';
  }

  // 8. installationLocation weg von 'machinery-room': alle 4.3-Felder zurücksetzen
  if (Object.hasOwn(patch, 'installationLocation') &&
      currentState.installationLocation === 'machinery-room' &&
      patch.installationLocation !== 'machinery-room') {
    patch.machineryRoomRiskAnalysisStatus = '';
    patch.machineryRoomRiskAnalysisResult = '';
    patch.machineryRoomRiskAnalysisNotes = '';
    // isBasementLocation zurücksetzen nur wenn locationLevel die Bedingung nicht mehr erfüllt
    if (patch.locationLevel !== 'upper-no-emergency-exit-or-basement') {
      patch.isBasementLocation = '';
    }
    shouldResetMachineryRoomFields = true;
    shouldClearNotes = true;
  }

  // ========================================================================
  // Aufstellort-Wechsel für die Pfade 4.5 (technischer Raum) und 4.6 (belüftetes
  // Gehäuse): beim Verlassen des jeweiligen Aufstellorts werden dessen Felder
  // zurückgesetzt, damit keine veralteten Angaben im State verbleiben.
  // ========================================================================
  if (Object.hasOwn(patch, 'installationLocation') &&
      patch.installationLocation !== currentState.installationLocation) {
    if (currentState.installationLocation === 'technical-room') {
      clearFields(patch, TECHNICAL_ROOM_TRANSITION_FIELDS);
    }
    if (currentState.installationLocation === 'ventilated-enclosure') {
      clearFields(patch, VENTILATED_ENCLOSURE_TRANSITION_FIELDS);
    }
    // Die Bestätigung zu Klasse II (EN 378-1, 5.3 c/d) ist standort- und
    // klassenabhängig; bei Aufstellort-Wechsel darf keine veraltete Bestätigung
    // erhalten bleiben (nur zurücksetzen, wenn eine vorliegt).
    if (currentState.classIiCompressorsOutsideOrMachineryRoom) {
      patch.classIiCompressorsOutsideOrMachineryRoom = '';
    }
  }

  // Wechsel von refrigerantId oder installationClass: standort-/klassenabhängige
  // Klasse-II-Bestätigung zurücksetzen (nur wenn eine vorliegt).
  for (const field of ['refrigerantId', 'installationClass']) {
    if (Object.hasOwn(patch, field) && patch[field] !== currentState[field] && currentState.classIiCompressorsOutsideOrMachineryRoom) {
      patch.classIiCompressorsOutsideOrMachineryRoom = '';
    }
  }

  // Wechsel von refrigerantId oder chargeKg: gespeicherte C.3-Auswahl
  // (usesAlternativeRiskManagement, EN 378-1, C.3.1) zurücksetzen, damit sie nicht
  // über Kältemittel- oder Füllmengenwechsel hinweg erhalten bleibt (nur wenn eine
  // vorliegt).
  for (const field of ['refrigerantId', 'chargeKg']) {
    if (Object.hasOwn(patch, field) && patch[field] !== currentState[field] && currentState.usesAlternativeRiskManagement) {
      patch.usesAlternativeRiskManagement = '';
    }
  }

  // Apply field resets
  if (shouldResetMachineryRoomFields) {
    clearFields(patch, MACHINERY_ROOM_5_1_TO_5_14_FIELDS);
  }

  return patch;
}

export const EN378_EN60335_TRANSITION_FIELDS = Object.freeze([
  ...EN60335_SWITCH_FIELDS,
  ...EN60335_REGULAR_ASSESSMENT_FIELDS
]);
