import { createModuleState } from '../../core/state/index.js';

export const state = createModuleState({
  mixingOutdoorVolumeFlowM3h: '',
  mixingOutdoorTemp: '',
  mixingOutdoorRh: '',
  mixingRecircVolumeFlowM3h: '',
  mixingRecircTemp: '',
  mixingRecircRh: '',
  activeMixedAirId: null,
  activeMixedAirName: '',
  expandedMixedAirId: null,
  savedMixedAirStates: []
});

export default state;
