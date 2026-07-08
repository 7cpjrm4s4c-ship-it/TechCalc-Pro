import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  mixingOutdoorVolumeFlowM3h: '',
  mixingOutdoorTemp: '',
  mixingOutdoorRh: '',
  mixingRecircVolumeFlowM3h: '',
  mixingRecircTemp: '',
  mixingRecircRh: ''
});

export default state;
