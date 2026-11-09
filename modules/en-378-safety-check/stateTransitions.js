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

const isFieldSelectionCommit = action =>
  action === 'field:input:select' || action === 'field:change:immediate';

const clearFields = (patch, fields) => {
  fields.forEach(field => { patch[field] = ''; });
};

/**
 * Normalizes dependent EN 378-2, 6.2.14 inputs on interactive parent changes.
 * Hydration/import/programmatic updates deliberately bypass this transition.
 */
export function normalizeEN378StateTransition(currentState = {}, incomingPatch = {}, meta = {}) {
  const patch = { ...incomingPatch };
  if (!isFieldSelectionCommit(meta.action)) return patch;

  if (Object.hasOwn(patch, 'outdoorEN3782_6_2_14EN60335Applicable') &&
      patch.outdoorEN3782_6_2_14EN60335Applicable !== currentState.outdoorEN3782_6_2_14EN60335Applicable) {
    clearFields(patch, EN60335_SWITCH_FIELDS);
    clearFields(patch, EN60335_REGULAR_ASSESSMENT_FIELDS);
  }

  if (Object.hasOwn(patch, 'outdoorEN3782_6_2_14EN60335Compliant') &&
      patch.outdoorEN3782_6_2_14EN60335Compliant !== currentState.outdoorEN3782_6_2_14EN60335Compliant) {
    clearFields(patch, EN60335_REGULAR_ASSESSMENT_FIELDS);
  }

  return patch;
}

export const EN378_EN60335_TRANSITION_FIELDS = Object.freeze([
  ...EN60335_SWITCH_FIELDS,
  ...EN60335_REGULAR_ASSESSMENT_FIELDS
]);
