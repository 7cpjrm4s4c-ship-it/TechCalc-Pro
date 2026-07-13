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
  manualRainDuration: '10',
  manualRainDurationReason: '',
  meanSlopePercent: '1,0',
  rainR2Duration5: '',
  rainR2Duration10: '',
  rainR2Duration15: '',
  rainR30Duration5: '',
  rainR30Duration10: '',
  rainR30Duration15: '',
  rainR100Duration5: '',
  rainSourceDataset: '',
  rainSourceLocation: '',
  rainSourceVersion: '',
  rainEntryMode: 'manual',
  dischargeMode: 'table-existing-pipe',
  pipeNominalDiameterDn: 'DN 100',
  pipeSlopePermille: '10',
  manualFullFlowLs: '',
  manualFullFlowSource: '',
  authorityLimitLs: '',
  authorityName: '',
  authorityReference: '',
  authorityDate: '',
  authoritySourceNote: '',
  activeSurfaceId: null,
  surfaces: [],
  importedRainwaterSnapshot: null,
  importStatus: '',
  results: null
};

export const state = createModuleState(initialState);