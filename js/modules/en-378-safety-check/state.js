import { createModuleState } from '../../core/state.js';
import { getDataVersions } from '../../utils/refrigerants/index.js';

export const EN_378_SAFETY_CHECK_SCHEMA_VERSION = 1;

export const initialState = Object.freeze({
  schemaVersion: EN_378_SAFETY_CHECK_SCHEMA_VERSION,
  importedSnapshot: null,
  importedSnapshotId: '',
  importedSnapshotVersion: '',
  importedAt: '',
  importStatus: '',
  importErrors: Object.freeze([]),
  importStatusMessage: '',
  fGasesSnapshotId: '',
  sourceModuleId: '',
  sourceModuleVersion: '',
  importedSystemName: '',
  refrigerantId: '',
  chargeKg: '',
  roomVolumeM3: '',
  installationLocation: '',
  installationClass: '',
  accessArea: '',
  accessCategory: '',
  usageType: '',
  applicationType: '',
  locationLevel: '',
  occupantDensityBelowOnePer10m2: '',
  hasEmergencyExits: '',
  isPermanentlySealedSorptionSystem: '',
  usesAlternativeRiskManagement: '',
  floorAreaM2: '',
  mountingType: '',
  isFactorySealed: '',
  ventilationType: '',
  hasGasWarningSystem: '',
  hasMachineryRoom: '',
  hasMechanicalVentilation: '',
  hasEmergencyVentilation: '',
  hasEmergencyStopInside: '',
  hasEmergencyStopOutside: '',
  hasEmergencyLighting: '',
  hasDetector: '',
  hasAlarm: '',
  hasIndependentAlarmPower: '',
  hasSafetyShutoffValves: '',
  hasVentilationOpenings: '',
  hasExplosionProtectedElectricalEquipment: '',
  isOutdoorPublicAccessible: '',
  additionalSafetyMeasures: '',
  dataVersions: getDataVersions()
});

export const state = createModuleState(initialState, { moduleId: 'en-378-safety-check' });
export default state;
