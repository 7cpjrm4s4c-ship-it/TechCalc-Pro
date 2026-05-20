import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  mode: 'heating',
  mediumId: 'water',
  pipeSystemId: 'steel',

  heatingCalcTarget: 'power',
  heatingPowerW: '',
  heatingPowerUnit: 'W',
  heatingMassFlowKgh: '',
  heatingDeltaT: '10',

  coolingCalcTarget: 'power',
  coolingPowerW: '',
  coolingPowerUnit: 'W',
  coolingMassFlowKgh: '',
  coolingDeltaT: '10',
  activeLineSectionId: null,
  activeLineSectionName: ''
});
