import { createModuleState } from '../../core/state.js';

export const initialState = {
  name: '',
  activeCalculationId: null,
  calculationType: 'roof',
  lineType: 'collector',
  rainIntensity: '300',
  rainDuration: '5',
  returnPeriod: '5',
  emergencyRainIntensity: '600',
  areaType: 'metal-roof',
  areaName: '',
  areaSize: '100',
  customCs: '',
  customCm: '',
  fillRatio: '0.7',
  slopeCmM: '1,0',
  roofDrainCapacity: '4,5',
  gutterShape: 'semicircular',
  gutterNominal: '333',
  gutterLength: '10',
  directionChanges: '0',
  overflowType: 'rectangular',
  overflowWidth: '200',
  overflowDiameter: '100',
  overflowHead: '50',
  surfaces: [],
  savedCalculations: []
};

export const state = createModuleState(initialState);
