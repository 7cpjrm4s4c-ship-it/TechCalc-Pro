import config from './config.js';
import { buildEN378SafetyCheckResultModel } from './results.js';
import { EN_378_SAFETY_CHECK_SCHEMA_VERSION } from './state.js';

export const EN_378_SAFETY_CHECK_REPORT_DTO_VERSION = 1;

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export function buildEN378SafetyCheckReportDto({
  state = {},
  calculation = {},
  generatedAt = new Date().toISOString()
} = {}) {
  const reportState = calculation.effectiveState || state;
  const resultModel = buildEN378SafetyCheckResultModel(reportState, calculation);

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
      chargeKg: calculation.chargeKg ?? null,
      roomVolumeM3: calculation.roomVolumeM3 ?? null,
      installationLocation: reportState.installationLocation || '',
      installationClass: reportState.installationClass || '',
      accessArea: reportState.accessArea || '',
      accessCategory: reportState.accessCategory || '',
      usageType: reportState.usageType || '',
      applicationType: reportState.applicationType || '',
      locationLevel: reportState.locationLevel || '',
      occupantDensityBelowOnePer10m2: reportState.occupantDensityBelowOnePer10m2 || '',
      hasEmergencyExits: reportState.hasEmergencyExits || '',
      isPermanentlySealedSorptionSystem: reportState.isPermanentlySealedSorptionSystem || '',
      usesAlternativeRiskManagement: reportState.usesAlternativeRiskManagement || '',
      floorAreaM2: reportState.floorAreaM2 || '',
      mountingType: reportState.mountingType || '',
      isFactorySealed: reportState.isFactorySealed || '',
      ventilationType: reportState.ventilationType || '',
      hasGasWarningSystem: reportState.hasGasWarningSystem || '',
      hasMachineryRoom: reportState.hasMachineryRoom || '',
      hasMechanicalVentilation: reportState.hasMechanicalVentilation || '',
      hasEmergencyVentilation: reportState.hasEmergencyVentilation || '',
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
      installationSafety: clone(calculation.installationSafetyAssessment || {}),
      plannerGuidance: clone(calculation.plannerGuidance || {}),
      requiredMeasures: clone(calculation.requiredMeasures || []),
      notices: clone(calculation.notices || [])
    },
    plannerGuidance: clone(calculation.plannerGuidance || {}),
    resultGroups: clone(resultModel.groups || []),
    notices: clone(resultModel.notices || []),
    dataVersions: clone(calculation.dataVersions || state.dataVersions || {})
  });
}

export default buildEN378SafetyCheckReportDto;
