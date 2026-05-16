import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  systemType: 'heating',
  holdingType: 'mag',
  includeServitec: 'false',
  connectionType: 'suction',
  heatPowerKw: '',
  waterContentMode: 'known',
  specificWaterContent: '20',
  systemVolumeL: '',
  additionalVolumeL: '',
  tMaxC: '80',
  tMinC: '10',
  frostMode: 'water',
  staticHeightM: '',
  staticPressureBar: '',
  pumpPressureBar: '',
  safetyValveBar: '3',
  safetyValveType: 'heating',
  dynamicType: 'reflexomat',
  plantName: '',
  savedPlants: []
});
