import { getDataVersions, getEN378SafetyData, getRefrigerant, getSafetyClass } from '../../utils/refrigerants/index.js';
import { assessChargeLimit } from './chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from './installationSafetyRequirements.js';

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

function deriveStatus({ hasImportError, inputValidation, chargeLimitAssessment, installationSafetyAssessment }) {
  if (hasImportError) return 'import-rejected';
  if (!inputValidation.isValid) return 'incomplete';
  if (chargeLimitAssessment.status === 'failed' || installationSafetyAssessment.status === 'failed') return 'measures-required';
  if (chargeLimitAssessment.status === 'passed' && installationSafetyAssessment.status === 'passed') return 'acceptable';
  return 'ready-for-assessment';
}

export function calculate(currentState = {}) {
  const refrigerant = currentState.refrigerantId ? getRefrigerant(currentState.refrigerantId) : null;
  const safetyClass = refrigerant?.safetyClassRef ? getSafetyClass(refrigerant.safetyClassRef) : null;
  const refrigerantSafetyData = currentState.refrigerantId ? getEN378SafetyData(currentState.refrigerantId) : null;
  const chargeKg = numberOrNull(currentState.chargeKg);
  const roomVolumeM3 = numberOrNull(currentState.roomVolumeM3);
  const inputValidation = validateAssessmentInput(currentState);
  const hasImportError = currentState.importStatus === 'rejected';
  const chargeLimitAssessment = assessChargeLimit(currentState);
  const installationSafetyAssessment = assessInstallationSafetyRequirements(currentState, chargeLimitAssessment);

  return Object.freeze({
    status: deriveStatus({ hasImportError, inputValidation, chargeLimitAssessment, installationSafetyAssessment }),
    inputComplete: inputValidation.isValid,
    inputValidation,
    refrigerant: refrigerant ? Object.freeze({ ...refrigerant }) : null,
    safetyClass: safetyClass ? Object.freeze({ ...safetyClass }) : null,
    refrigerantSafetyData: refrigerantSafetyData ? Object.freeze({ ...refrigerantSafetyData }) : null,
    chargeKg,
    roomVolumeM3,
    importedSnapshotVersion: currentState.importedSnapshotVersion || null,
    chargeLimitAssessment,
    installationSafetyAssessment,
    requiredMeasures: Object.freeze([
      ...(chargeLimitAssessment.requiredMeasures || []),
      ...(installationSafetyAssessment.requiredMeasures || [])
    ]),
    notices: Object.freeze([]),
    dataVersions: currentState.dataVersions || getDataVersions()
  });
}

export default calculate;
