import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  calculationMode: 'runtime',
  plantName: '',
  mediumMode: 'water',
  glycolType: 'ethylene',
  glycolConcentration: '35',
  qMaxKw: '',
  partLoadFactor: '0.25',
  qLoadKw: '0',
  compressorRunTimeMin: '1',
  controllerDeltaT: '5',
  existingSystemVolumeL: '0',
  qConsumerKw: '',
  qDefrostKw: '',
  qHeatingCircuitKw: '0',
  maxDefrostTimeMin: '5',
  hydraulicDeltaT: '5',
  consumerFlowM3h: '',
  bridgeTimeMin: '10',
  savedCalculations: []
});
