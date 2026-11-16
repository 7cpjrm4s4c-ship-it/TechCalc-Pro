import { getDataVersions, getEN378SafetyData, getRefrigerant, getSafetyClass } from '../../core/data/index.js';
import { assessChargeLimit } from './chargeLimitCalculation.js';
import { assessInstallationSafetyRequirements } from './installationSafetyRequirements.js';
import {
  applyAlternativeRiskMeasuresToChargeLimitAssessment,
  assessAlternativeRiskMeasures,
  mergeAlternativeRiskMeasuresAssessment
} from './alternativeRiskMeasures.js';
import { assessStateConsistency, mergeStateConsistencyAssessment } from './stateConsistency.js';
import { buildEN378PlannerGuidance } from './plannerGuidance.js';
import {
  assessMachineryRoomRiskAnalysis,
  assessBelowGradeDetectorAlarm,
  HINWEIS_A,
  HINWEIS_B,
  MACHINERY_ROOM_NOTICE
} from './machineryRoomRiskAnalysis.js';
const ACCESS_CATEGORY_BY_ACCESS_AREA = Object.freeze({
  'general-access': 'a',
  'supervised-access': 'b',
  'authorized-access': 'c'
});

const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};
const hasValue = value => String(value ?? '').trim().length > 0;
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const isHumanComfortApplication = state => state.applicationType === 'human-comfort';
const requiresMountingType = state => isHumanComfortApplication(state) && state.isFactorySealed === 'no';
export function deriveAccessCategory(currentState = {}) {
  const derived = ACCESS_CATEGORY_BY_ACCESS_AREA[currentState.accessArea];
  if (derived) return derived;
  return hasValue(currentState.accessCategory) ? String(currentState.accessCategory) : '';
}
export function normalizeEN378AssessmentState(currentState = {}) {
  return Object.freeze({
    ...currentState,
    accessCategory: deriveAccessCategory(currentState),
    hasMachineryRoom: currentState.installationLocation === 'machinery-room' ? 'yes' : currentState.hasMachineryRoom
  });
}
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
  const effectiveState = normalizeEN378AssessmentState(currentState);
  const issues = [];
  addRequiredTextIssue(issues, effectiveState, 'refrigerantId');
  addPositiveNumberIssue(issues, effectiveState, 'chargeKg');
  addPositiveNumberIssue(issues, effectiveState, 'roomVolumeM3');
  addRequiredTextIssue(issues, effectiveState, 'installationLocation');
  addRequiredTextIssue(issues, effectiveState, 'accessArea');
  addRequiredTextIssue(issues, effectiveState, 'usageType');
  addRequiredTextIssue(issues, effectiveState, 'ventilationType');
  if (isHumanComfortApplication(effectiveState)) {
    addPositiveNumberIssue(issues, effectiveState, 'floorAreaM2');
    addRequiredTextIssue(issues, effectiveState, 'isFactorySealed');
    if (requiresMountingType(effectiveState)) addRequiredTextIssue(issues, effectiveState, 'mountingType');
  }

  return Object.freeze({
    isValid: issues.length === 0,
    issues: Object.freeze(issues),
    effectiveState
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
  const effectiveState = normalizeEN378AssessmentState(currentState);
  const refrigerant = effectiveState.refrigerantId ? getRefrigerant(effectiveState.refrigerantId) : null;
  const safetyClass = refrigerant?.safetyClassRef ? getSafetyClass(refrigerant.safetyClassRef) : null;
  const refrigerantSafetyData = effectiveState.refrigerantId ? getEN378SafetyData(effectiveState.refrigerantId) : null;
  const chargeKg = numberOrNull(effectiveState.chargeKg);
  const roomVolumeM3 = numberOrNull(effectiveState.roomVolumeM3);
  const inputValidation = validateAssessmentInput(effectiveState);
  const hasImportError = effectiveState.importStatus === 'rejected';
  const rawChargeLimitAssessment = normalizeChargeLimitAssessment(assessChargeLimit(effectiveState), effectiveState);
  const alternativeRiskMeasuresAssessment = assessAlternativeRiskMeasures(effectiveState, rawChargeLimitAssessment);
  const chargeLimitAssessment = applyAlternativeRiskMeasuresToChargeLimitAssessment(rawChargeLimitAssessment, alternativeRiskMeasuresAssessment, effectiveState);
  const baseInstallationSafetyAssessment = assessInstallationSafetyRequirements(effectiveState, rawChargeLimitAssessment);
  const alternativeInstallationSafetyAssessment = mergeAlternativeRiskMeasuresAssessment(baseInstallationSafetyAssessment, alternativeRiskMeasuresAssessment);
  const stateConsistencyAssessment = assessStateConsistency(effectiveState);
  const installationSafetyAssessment = mergeStateConsistencyAssessment(alternativeInstallationSafetyAssessment, stateConsistencyAssessment);
  
  // Machinery Room Risk Analysis per EN 378-3, 4.3
  const machineryRoomRiskAnalysis = assessMachineryRoomRiskAnalysis(effectiveState);
  const belowGradeDetectorAlarm = assessBelowGradeDetectorAlarm(effectiveState);
  
  // Merge below-grade check into installation safety assessment if applicable
  const installationSafetyWithMachineryRoom = mergeMachineryRoomChecks(
    installationSafetyAssessment,
    machineryRoomRiskAnalysis,
    belowGradeDetectorAlarm
  );
  
  const status = deriveStatus({ hasImportError, inputValidation, chargeLimitAssessment, installationSafetyAssessment: installationSafetyWithMachineryRoom });
  const plannerGuidance = buildEN378PlannerGuidance(effectiveState, {
    status,
    inputValidation,
    chargeLimitAssessment,
    installationSafetyAssessment: installationSafetyWithMachineryRoom,
    machineryRoomRiskAnalysis
  });
  return Object.freeze({
    status,
    inputComplete: inputValidation.isValid,
    inputValidation,
    effectiveState,
    refrigerant: refrigerant ? Object.freeze({ ...refrigerant }) : null,
    safetyClass: safetyClass ? Object.freeze({ ...safetyClass }) : null,
    refrigerantSafetyData: refrigerantSafetyData ? Object.freeze({ ...refrigerantSafetyData }) : null,
    chargeKg,
    roomVolumeM3,
    importedSnapshotVersion: effectiveState.importedSnapshotVersion || null,
    chargeLimitAssessment,
    rawChargeLimitAssessment,
    alternativeRiskMeasuresAssessment,
    stateConsistencyAssessment,
    installationSafetyAssessment: installationSafetyWithMachineryRoom,
    machineryRoomRiskAnalysis,
    belowGradeDetectorAlarm,
    plannerGuidance,
    requiredMeasures: Object.freeze(plannerGuidance.requiredMeasures || []),
    notices: Object.freeze([]),
    dataVersions: effectiveState.dataVersions || getDataVersions()
  });
}

/**
 * Merge machinery room specific checks into installation safety assessment
 */
function mergeMachineryRoomChecks(installationSafetyAssessment = {}, machineryRoomRiskAnalysis = {}, belowGradeDetectorAlarm = null) {
  const requirements = [...(installationSafetyAssessment.requirements || [])];
  
  // Add below-grade detector alarm check if applicable and not already present
  if (belowGradeDetectorAlarm && !requirements.some(r => r.id === belowGradeDetectorAlarm.id)) {
    requirements.push(Object.freeze({ ...belowGradeDetectorAlarm }));
  }
  
  // Recalculate status
  const failed = requirements.filter(item => item.status === 'failed');
  const notAssessed = requirements.filter(item => item.status === 'not-assessed');
  const requiredMeasures = requirements
    .filter(item => ['required', 'failed', 'not-assessed'].includes(item.status))
    .map(item => item.measure)
    .filter(Boolean);
  const missingInputs = [...new Set(notAssessed.flatMap(item => item.missingInputs || []))];
  
  const status = failed.length ? 'failed' : notAssessed.length ? 'not-assessed' : installationSafetyAssessment.status || 'passed';
  
  return Object.freeze({
    ...installationSafetyAssessment,
    status,
    requirements: Object.freeze(requirements),
    requiredMeasures: Object.freeze([...new Set(requiredMeasures)]),
    missingInputs: Object.freeze(missingInputs)
  });
}
export default calculate;
