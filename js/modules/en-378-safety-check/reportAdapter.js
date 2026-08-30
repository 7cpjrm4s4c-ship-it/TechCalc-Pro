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
      accessArea: state.accessArea || '',
      usageType: state.usageType || '',
      ventilationType: state.ventilationType || '',
      hasGasWarningSystem: state.hasGasWarningSystem || '',
      hasMachineryRoom: state.hasMachineryRoom || '',
      additionalSafetyMeasures: state.additionalSafetyMeasures || ''
    }),
    summary: {
      status: calculation.status || 'incomplete',
      inputComplete: Boolean(calculation.inputComplete)
    },
    resultGroups: clone(resultModel.groups || []),
    notices: clone(resultModel.notices || []),
    dataVersions: clone(calculation.dataVersions || state.dataVersions || {})
  });
}

export default buildEN378SafetyCheckReportDto;
