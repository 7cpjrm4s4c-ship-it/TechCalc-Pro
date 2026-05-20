import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  mode: 'heating',

  heatingSupplyTemp: '40',
  heatingRoomTemp: '20',
  heatingCalcTarget: 'power',
  heatingPowerW: '',
  heatingPowerUnit: 'W',
  heatingVolumeFlowM3h: '',
  heatingDeltaT: '',

  coolingSupplyTemp: '16',
  coolingRoomTemp: '26',
  coolingCalcTarget: 'power',
  coolingPowerW: '',
  coolingPowerUnit: 'W',
  coolingVolumeFlowM3h: '',
  coolingDeltaT: ''
});
