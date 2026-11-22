import config from './config.js';
import { buildEN378SafetyCheckResultModel } from './results.js';
import { EN_378_SAFETY_CHECK_SCHEMA_VERSION } from './state.js';
import { getEN378SafetyData, getRefrigerant } from '../../core/data/index.js';

export const EN_378_SAFETY_CHECK_REPORT_DTO_VERSION = 1;

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
// Display form "R" + standardNumber (R32, R717, R290, R1234yf); aliases such as
// R-32 / HFKW-32 resolve through the existing catalog lookup.
const refrigerantLabel = refrigerantId => {
  if (!refrigerantId) return '';
  const safetyData = getEN378SafetyData(refrigerantId);
  if (safetyData?.standardNumber) return `R${safetyData.standardNumber}`;
  return getRefrigerant(refrigerantId)?.name || String(refrigerantId);
};
export function buildEN378SafetyCheckReportDto({
  state = {},
  calculation = {},
  resultModel = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const reportState = calculation.effectiveState || state;
  const reportResultModel = resultModel || buildEN378SafetyCheckResultModel(reportState, calculation);
  return Object.freeze({
    metadata: {
      dtoType: 'techcalc.en-378-safety-check.report',
      dtoVersion: EN_378_SAFETY_CHECK_REPORT_DTO_VERSION,
      moduleId: config.id,
      moduleTitle: config.title,
      reportHeading: 'Sicherheitsbericht',
      schemaVersion: state.schemaVersion ?? EN_378_SAFETY_CHECK_SCHEMA_VERSION,
      generatedAt
    },
    importedSnapshot: clone(state.importedSnapshot),
    input: clone({
      importedSystemName: state.importedSystemName || '',
      importStatus: state.importStatus || '',
      importStatusMessage: state.importStatusMessage || '',
      refrigerantId: reportState.refrigerantId || '',
      refrigerantLabel: refrigerantLabel(reportState.refrigerantId),
      chargeKg: calculation.chargeKg ?? null,
      roomVolumeM3: calculation.roomVolumeM3 ?? null,
      installationLocation: reportState.installationLocation || '',
      installationClass: reportState.installationClass || '',
      accessArea: reportState.accessArea || '',
      accessCategory: reportState.accessCategory || '',
      usageType: reportState.usageType || '',
      applicationType: reportState.applicationType || '',
      locationLevel: reportState.locationLevel || '',
      isBasementLocation: reportState.isBasementLocation || '',
      occupantDensityBelowOnePer10m2: reportState.occupantDensityBelowOnePer10m2 || '',
      hasEmergencyExits: reportState.hasEmergencyExits || '',
      isPermanentlySealedSorptionSystem: reportState.isPermanentlySealedSorptionSystem || '',
      usesAlternativeRiskManagement: reportState.usesAlternativeRiskManagement || '',
      ventilatedEnclosureToxicityLocationClass: reportState.ventilatedEnclosureToxicityLocationClass || '',
      floorAreaM2: reportState.floorAreaM2 || '',
      mountingType: reportState.mountingType || '',
      isFactorySealed: reportState.isFactorySealed || '',
      ventilationType: reportState.ventilationType || '',
      hasGasWarningSystem: reportState.hasGasWarningSystem || '',
      hasMechanicalVentilation: reportState.hasMechanicalVentilation || '',
      isOutdoorDefinitionConfirmed: reportState.isOutdoorDefinitionConfirmed || '',
      outdoorSafeArrangement: reportState.outdoorSafeArrangement || '',
      outdoorPreventBuildingEntry: reportState.outdoorPreventBuildingEntry || '',
      hasOutdoorProtectiveCover: reportState.hasOutdoorProtectiveCover || '',
      outdoorCoverVentilated: reportState.outdoorCoverVentilated || '',
      outdoorRefrigerantAccumulationPossible: reportState.outdoorRefrigerantAccumulationPossible || '',
      outdoorEN3782_6_2_14EN60335Applicable: reportState.outdoorEN3782_6_2_14EN60335Applicable || '',
      outdoorEN3782_6_2_14EN60335Compliant: reportState.outdoorEN3782_6_2_14EN60335Compliant || '',
      outdoorEN3782_6_2_14EN60335EvidenceReference: reportState.outdoorEN3782_6_2_14EN60335EvidenceReference || '',
      outdoorEN3782_6_2_14HazardousAreaConfirmed: reportState.outdoorEN3782_6_2_14HazardousAreaConfirmed || '',
      outdoorEN3782_6_2_14HazardousAreaEvidenceReference: reportState.outdoorEN3782_6_2_14HazardousAreaEvidenceReference || '',
      outdoorEN3782_6_2_14ComponentAssessmentConfirmed: reportState.outdoorEN3782_6_2_14ComponentAssessmentConfirmed || '',
      outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference: reportState.outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference || '',
      outdoorEN3782_6_2_14ProtectionConditionsConfirmed: reportState.outdoorEN3782_6_2_14ProtectionConditionsConfirmed || '',
      outdoorEN3782_6_2_14ProtectionEvidenceReference: reportState.outdoorEN3782_6_2_14ProtectionEvidenceReference || '',
      outdoorEN3782_6_2_14AirflowProtectionUsed: reportState.outdoorEN3782_6_2_14AirflowProtectionUsed || '',
      outdoorEN3782_6_2_14AirflowAvailabilityConfirmed: reportState.outdoorEN3782_6_2_14AirflowAvailabilityConfirmed || '',
      outdoorEN3782_6_2_14AirflowInterlockConfirmed: reportState.outdoorEN3782_6_2_14AirflowInterlockConfirmed || '',
      outdoorEN3782_6_2_14SurfaceTemperatureConfirmed: reportState.outdoorEN3782_6_2_14SurfaceTemperatureConfirmed || '',
      outdoorEN3782_6_2_14HazardousAreaExceedsEquipment: reportState.outdoorEN3782_6_2_14HazardousAreaExceedsEquipment || '',
      outdoorEN3782_6_2_14EquipmentDocumentationUpdated: reportState.outdoorEN3782_6_2_14EquipmentDocumentationUpdated || '',
      outdoorVentilationGeneralConfirmed: reportState.outdoorVentilationGeneralConfirmed || '',
      outdoorVentilationNationalRulesConfirmed: reportState.outdoorVentilationNationalRulesConfirmed || '',
      outdoorMechanicalVentilationOpeningsConfirmed: reportState.outdoorMechanicalVentilationOpeningsConfirmed || '',
      hasEmergencyVentilation: reportState.hasEmergencyVentilation || '',
      machineryRoomRiskAnalysisStatus: reportState.machineryRoomRiskAnalysisStatus || '',
      machineryRoomRiskAnalysisResult: reportState.machineryRoomRiskAnalysisResult || '',
      machineryRoomRiskAnalysisNotes: reportState.machineryRoomRiskAnalysisNotes || '',
      machineryRoomOccupied: reportState.machineryRoomOccupied || '',
      machineryRoomRequiredAirChangeAchievable: reportState.machineryRoomRequiredAirChangeAchievable || '',
      machineryRoomEmergencyFanSuitable: reportState.machineryRoomEmergencyFanSuitable || '',
      machineryRoomLargestSystemChargeKg: reportState.machineryRoomLargestSystemChargeKg || '',
      hasEmergencyVentilationControlInside: reportState.hasEmergencyVentilationControlInside || '',
      hasEmergencyVentilationControlOutside: reportState.hasEmergencyVentilationControlOutside || '',
      hasEmergencyStopOutside: reportState.hasEmergencyStopOutside || '',
      hasEmergencyStopInside: reportState.hasEmergencyStopInside || '',
      hasEmergencyLighting: reportState.hasEmergencyLighting || '',
      hasDetector: reportState.hasDetector || '',
      hasAlarm: reportState.hasAlarm || '',
      hasIndependentAlarmPower: reportState.hasIndependentAlarmPower || '',
      hasSafetyShutoffValves: reportState.hasSafetyShutoffValves || '',
      hasVentilationOpenings: reportState.hasVentilationOpenings || '',
      hasExplosionProtectedElectricalEquipment: reportState.hasExplosionProtectedElectricalEquipment || '',
      isOutdoorPublicAccessible: reportState.isOutdoorPublicAccessible || '',
      additionalSafetyMeasures: reportState.additionalSafetyMeasures || ''
    }),
    summary: {
      status: calculation.status || 'incomplete',
      inputComplete: Boolean(calculation.inputComplete),
      inputIssues: clone(calculation.inputValidation?.issues || []),
      plannerGuidanceHeadline: calculation.plannerGuidance?.headline || ''
    },
    assessment: {
      status: calculation.status || 'not-assessed',
      chargeLimit: clone(calculation.chargeLimitAssessment || {}),
      alternativeRiskMeasures: clone(calculation.alternativeRiskMeasuresAssessment || {}),
      stateConsistency: clone(calculation.stateConsistencyAssessment || {}),
      installationSafety: clone(calculation.installationSafetyAssessment || {}),
      plannerGuidance: clone(calculation.plannerGuidance || {}),
      requiredMeasures: clone(calculation.requiredMeasures || []),
      notices: clone(calculation.notices || [])
    },
    plannerGuidance: clone(calculation.plannerGuidance || {}),
    checklistAcknowledged: clone(reportState.en378ChecklistAcknowledged || {}),
    resultGroups: clone(reportResultModel.groups || []),
    notices: clone(reportResultModel.notices || []),
    dataVersions: clone(calculation.dataVersions || state.dataVersions || {})
  });
}
export default buildEN378SafetyCheckReportDto;
