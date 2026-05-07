import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  mode: 'wrg',
  // WRG
  wrgVolumeFlowM3h: '5000',
  outdoorTemp: '-16',
  outdoorRh: '80',
  extractTemp: '22',
  extractRh: '50',
  efficiency: '78',
  bypassPercent: '0',
  // Mischluft
  mixingOutdoorVolumeFlowM3h: '1500',
  mixingOutdoorTemp: '-16',
  mixingOutdoorRh: '80',
  mixingRecircVolumeFlowM3h: '3500',
  mixingRecircTemp: '22',
  mixingRecircRh: '50'
});
