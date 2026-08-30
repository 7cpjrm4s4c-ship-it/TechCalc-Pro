import { createModuleState } from '../../core/state.js';
import { getDataVersions } from '../../utils/refrigerants/index.js';

export const EN_378_SAFETY_CHECK_SCHEMA_VERSION = 1;

export const initialState = Object.freeze({
  schemaVersion: EN_378_SAFETY_CHECK_SCHEMA_VERSION,
  importedSnapshot: null,
  importedSnapshotId: '',
  importedSnapshotVersion: '',
  importedAt: '',
  sourceModuleId: '',
  sourceModuleVersion: '',
  importedSystemName: '',
  refrigerantId: '',
  chargeKg: '',
  roomVolumeM3: '',
  installationLocation: '',
  accessArea: '',
  usageType: '',
  ventilationType: '',
  hasGasWarningSystem: '',
  hasMachineryRoom: '',
  additionalSafetyMeasures: '',
  dataVersions: getDataVersions()
});

export const state = createModuleState(initialState, { moduleId: 'en-378-safety-check' });
export default state;
