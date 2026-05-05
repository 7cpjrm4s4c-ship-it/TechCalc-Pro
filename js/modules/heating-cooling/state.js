import { createModuleState } from '../../core/state.js';
export const state = createModuleState({
  mode: 'heating',
  calcTarget: 'power',
  mediumId: 'water',
  pipeSystemId: 'steel',
  powerW: '',
  powerUnit: 'W',
  massFlowKgh: '',
  deltaT: '10'
});
