import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  wrgVolumeFlowM3h: '',
  outdoorTemp: '',
  outdoorRh: '',
  extractTemp: '',
  extractRh: '',
  efficiency: '',
  bypassPercent: '',
  activeRltDeviceId: null,
  activeRltDeviceName: '',
  expandedRltDeviceId: null,
  savedRltDevices: []
});

export default state;
