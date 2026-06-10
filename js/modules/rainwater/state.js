import { createModuleState } from '../../core/state.js';

export const initialState = {
  surfaceMode: 'roof',
  calculationType: 'roof',
  roofRainIntensity: '300',
  propertyRainIntensity: '300',
  rainIntensity: '300',
  rainHundredIntensity: '500',
  emergencyEnabled: 'yes',
  emergencyType: 'rect',
  emergencyHead: '35',
  emergencyWidth: '300',
  emergencyDiameter: '100',
  emergencyCapacity: '',
  emergencyManufacturerDn: '',
  emergencySafetyFactor: '1,0',
  areaType: 'metal-roof',
  areaName: '',
  areaSize: '100',
  customCs: '',
  customCm: '',
  fillRatio: '0.7',
  slopeCmM: '1,0',
  drainSize: 'DN 100',
  drainSizeManual: 'DN 100',
  drainCapacity: '4,5',
  drainHead: '35',
  roofDrainCapacity: '4,5',
  stackCount: '1',
  activeSurfaceId: null,
  expandedSurfaceResultId: null,
  surfaces: []
};

export const state = createModuleState(initialState);
