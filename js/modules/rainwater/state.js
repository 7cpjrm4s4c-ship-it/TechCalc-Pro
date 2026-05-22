import { createModuleState } from '../../core/state.js';

export const initialState = {
  name: '',
  activeCalculationId: null,
  surfaceMode: 'roof',
  calculationType: 'roof',
  rainIntensity: '300',
  rainHundredIntensity: '500',
  areaType: 'metal-roof',
  areaName: '',
  areaSize: '100',
  customCs: '',
  customCm: '',
  fillRatio: '0.7',
  slopeCmM: '1,0',
  drainSize: 'DN 100',
  drainCapacity: '4,5',
  roofDrainCapacity: '4,5',
  stackCount: '1',
  surfaces: [],
  savedCalculations: []
};

export const state = createModuleState(initialState);
