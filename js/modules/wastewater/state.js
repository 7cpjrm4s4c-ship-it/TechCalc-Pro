import { createModuleState } from '../../core/state.js';

export const initialState = {
  name: '',
  activeCalculationId: null,
  usageType: 'residential',
  kValue: '0.5',
  lineType: 'single-unvented',
  fixtureType: 'washbasin',
  fixtureQuantity: '1',
  fixtureCustomName: '',
  fixtureCustomDu: '',
  fixtureCustomDn: '',
  fillRatio: '0.5',
  slopeCmM: '1,0',
  pipeLengthM: '',
  heightDifferenceM: '',
  bends90: '0',
  branchType: 'with-radius',
  hasWc: 'no',
  largestDu: '0',
  continuousFlow: '0',
  pumpFlow: '0',
  rainFlow: '0',
  ventilationType: 'single-main',
  fixtures: [],
  savedCalculations: []
};

export const state = createModuleState(initialState);
