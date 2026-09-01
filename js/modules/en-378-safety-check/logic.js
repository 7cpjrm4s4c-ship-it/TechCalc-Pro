import { getDataVersions, getEN378SafetyData, getRefrigerant, getSafetyClass } from '../../utils/refrigerants/index.js';
import { assessChargeLimit } from './chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from './installationSafetyRequirements.js';
import { buildEN378PlannerGuidance } from './plannerGuidance.js';

const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValue = value => String(value ?? '').trim().length > 0;
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

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

function isOptionalC3OpenCheck(check = {}, currentState = {}) {
  if (currentState.usesAlternativeRiskManagement === 'yes') return false;
  if (check.id !== 'charge-limit.alternative-risk-management') return false;
  if (check.status !== 'not-assessed') return false;
  const missing = check.missingInputs || [];
  return missing.includes('qlmvKgM3') || missing.includes('qlavKgM3');
}

function normalizeChargeLimitAssessment(assessment = {}, currentState = {}) {
  const checks = assessment.checks || [];
  const filteredChecks = checks.filter(check => !isOptionalC3OpenCheck(check, currentState));
  if (filteredChecks.length === checks.length) return assessment;

  const failedChecks = filteredChecks.filter(check => check.status === 'failed');
  const openChecks = filteredChecks.filter(check => check.status === 'not-assessed');
  const requiredMeasures = failedChecks.flatMap(check => check.measures || []);
  const missingInputs = [...new Set(openChecks.flatMap(check => check.missingInputs || []))];
  const status = failedChecks.length ? 'failed' : openChecks.length ? 'not-assessed' : 'passed';

  return Object.freeze({
    ...clone(assessment),
    status,
    checks: Object.freeze(filteredChecks.map(check => Object.freeze(check))),
    requiredMeasures: Object.freeze([...new Set(requiredMeasures)]),
    missingInputs: Object.freeze(missingInputs)
  });
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
  const chargeLimitAssessment = normalizeChargeLimitAssessment(assessChargeLimit(currentState), currentState);
  const installationSafetyAssessment = assessInstallationSafetyRequirements(currentState, chargeLimitAssessment);
  const status = deriveStatus({ hasImportError, inputValidation, chargeLimitAssessment, installationSafetyAssessment });
  const plannerGuidance = buildEN378PlannerGuidance(currentState, {
    status,
    inputValidation,
    chargeLimitAssessment,
    installationSafetyAssessment
  });

  return Object.freeze({
    status,
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
    plannerGuidance,
    requiredMeasures: Object.freeze(plannerGuidance.requiredMeasures || []),
    notices: Object.freeze([]),
    dataVersions: currentState.dataVersions || getDataVersions()
  });
}

export default calculate;
