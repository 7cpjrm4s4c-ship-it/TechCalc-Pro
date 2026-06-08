import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  mode: 'wrg',
  // WRG
  wrgVolumeFlowM3h: '',
  outdoorTemp: '',
  outdoorRh: '',
  extractTemp: '',
  extractRh: '',
  efficiency: '',
  bypassPercent: '',
  // Mischluft
  mixingOutdoorVolumeFlowM3h: '',
  mixingOutdoorTemp: '',
  mixingOutdoorRh: '',
  mixingRecircVolumeFlowM3h: '',
  mixingRecircTemp: '',
  mixingRecircRh: '',
  // Saved records
  activeRltDeviceId: null,
  activeRltDeviceName: '',
  expandedRltDeviceId: null,
  savedRltDevices: []
});

export default state;
