import { createModuleState } from '../../core/state.js';

export const initialState = {
  name: '',
  activeCalculationId: null,
  rainDuration: '5',
  rainThirty: '',
  rainTwo: '',
  roofArea: '',
  roofCs: '1,0',
  pavedArea: '',
  pavedCs: '1,0',
  totalImperviousArea: '',
  existingVolume: '',
  allowedDischarge: '',
  drainableDischarge: '',
  savedCalculations: []
};

export const state = createModuleState(initialState);
