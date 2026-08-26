import { createModuleState } from '../../core/state.js';
import { getDataVersions } from '../../utils/refrigerants/index.js';

export const F_GASES_SCHEMA_VERSION = 1;

export const initialState = Object.freeze({
  schemaVersion: F_GASES_SCHEMA_VERSION,
  systemName: '',
  systemType: '',
  constructionType: '',
  performanceRange: '',
  refrigerantId: '',
  chargeKg: '',
  dataVersions: getDataVersions()
});

export const state = createModuleState(initialState);

export default state;
