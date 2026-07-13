import { createModuleState } from '../../core/state.js';

export const FLOODING_VERIFICATION_SCHEMA_VERSION = 2;

export const initialState = {
  schemaVersion: FLOODING_VERIFICATION_SCHEMA_VERSION,
  featureEnabled: true,
  projectName: '',
  calculationMode: 'flooding',
  surfaceCategory: 'roof',
  surfaceName: '',
  surfaceAreaType: 'metal-roof',
  surfaceArea: '100',
  surfaceCs: '1,0',
  surfaceCm: '0,9',
  rainDurationMode: 'automatic',
  manualRainDuration: '5',
  rainIntensity5: '',
  rainIntensity10: '',
  rainIntensity15: '',
  activeSurfaceId: null,
  surfaces: [],
  importedRainwaterSnapshot: null,
  importStatus: '',
  results: null
};

export const state = createModuleState(initialState);
