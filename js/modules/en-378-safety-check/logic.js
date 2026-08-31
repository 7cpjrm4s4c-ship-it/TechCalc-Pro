import { getDataVersions, getRefrigerant, getSafetyClass } from '../../utils/refrigerants/index.js';

const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValue = value => String(value ?? '').trim().length > 0;

const addRequiredTextIssue = (issues, currentState, key) => {
  if (!hasValue(currentState[key])) issues.push(`${key}:required`);
};

const addPositiveNumberIssue = (issues, currentState, key) => {
  const value = numberOrNull(currentState[key]);
  if (value === null) {
    issues.push(`${key}:required`);
    return;
  }
  if (value <= 0) issues.push(`${key}:positive-number-required`);
};

export function validateAssessmentInput(currentState = {}) {
  const issues = [];

  addRequiredTextIssue(issues, currentState, 'refrigerantId');
  addPositiveNumberIssue(issues, currentState, 'chargeKg');
  addPositiveNumberIssue(issues, currentState, 'roomVolumeM3');
  addRequiredTextIssue(issues, currentState, 'installationLocation');
  addRequiredTextIssue(issues, currentState, 'accessArea');
  addRequiredTextIssue(issues, currentState, 'usageType');
  addRequiredTextIssue(issues, currentState, 'ventilationType');

  return Object.freeze({
    isValid: issues.length === 0,
    issues: Object.freeze(issues)
  });
}

export function hasRequiredAssessmentInput(currentState = {}) {
  return validateAssessmentInput(currentState).isValid;
}

export function calculate(currentState = {}) {
  const refrigerant = currentState.refrigerantId ? getRefrigerant(currentState.refrigerantId) : null;
  const safetyClass = refrigerant?.safetyClassRef ? getSafetyClass(refrigerant.safetyClassRef) : null;
  const chargeKg = numberOrNull(currentState.chargeKg);
  const roomVolumeM3 = numberOrNull(currentState.roomVolumeM3);
  const inputValidation = validateAssessmentInput(currentState);
  const hasImportError = currentState.importStatus === 'rejected';

  return Object.freeze({
    status: hasImportError ? 'import-rejected' : inputValidation.isValid ? 'ready-for-assessment' : 'incomplete',
    inputComplete: inputValidation.isValid,
    inputValidation,
    refrigerant: refrigerant ? Object.freeze({ ...refrigerant }) : null,
    safetyClass: safetyClass ? Object.freeze({ ...safetyClass }) : null,
    chargeKg,
    roomVolumeM3,
    importedSnapshotVersion: currentState.importedSnapshotVersion || null,
    requiredMeasures: Object.freeze([]),
    notices: Object.freeze([]),
    dataVersions: currentState.dataVersions || getDataVersions()
  });
}

export default calculate;
