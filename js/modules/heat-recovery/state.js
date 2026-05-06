import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  mode: 'wrg',
  volumeFlowM3h: '',
  outdoorTemp: '-10',
  extractTemp: '22',
  roomTemp: '22',
  efficiency: '75',
  targetSupplyTemp: '20',
  outdoorAirShare: '30'
});
