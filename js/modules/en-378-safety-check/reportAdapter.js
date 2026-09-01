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
  const resultModel = buildEN378SafetyCheckResultModel(state, calculation);

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
      refrigerantId: state.refrigerantId || '',
      chargeKg: calculation.chargeKg ?? null,
      roomVolumeM3: calculation.roomVolumeM3 ?? null,
      installationLocation: state.installationLocation || '',
      installationClass: state.installationClass || '',
      accessArea: state.accessArea || '',
      accessCategory: state.accessCategory || '',
      usageType: state.usageType || '',
      applicationType: state.applicationType || '',
      locationLevel: state.locationLevel || '',
      occupantDensityBelowOnePer10m2: state.occupantDensityBelowOnePer10m2 || '',
      hasEmergencyExits: state.hasEmergencyExits || '',
      isPermanentlySealedSorptionSystem: state.isPermanentlySealedSorptionSystem || '',
      usesAlternativeRiskManagement: state.usesAlternativeRiskManagement || '',
      floorAreaM2: state.floorAreaM2 || '',
      mountingType: state.mountingType || '',
      isFactorySealed: state.isFactorySealed || '',
      ventilationType: state.ventilationType || '',
      hasGasWarningSystem: state.hasGasWarningSystem || '',
      hasMachineryRoom: state.hasMachineryRoom || '',
      hasMechanicalVentilation: state.hasMechanicalVentilation || '',
      hasEmergencyVentilation: state.hasEmergencyVentilation || '',
      hasEmergencyStopOutside: state.hasEmergencyStopOutside || '',
      hasEmergencyStopInside: state.hasEmergencyStopInside || '',
      hasEmergencyLighting: state.hasEmergencyLighting || '',
      hasDetector: state.hasDetector || '',
      hasAlarm: state.hasAlarm || '',
      hasIndependentAlarmPower: state.hasIndependentAlarmPower || '',
      hasSafetyShutoffValves: state.hasSafetyShutoffValves || '',
      hasVentilationOpenings: state.hasVentilationOpenings || '',
      hasExplosionProtectedElectricalEquipment: state.hasExplosionProtectedElectricalEquipment || '',
      isOutdoorPublicAccessible: state.isOutdoorPublicAccessible || '',
      additionalSafetyMeasures: state.additionalSafetyMeasures || ''
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
