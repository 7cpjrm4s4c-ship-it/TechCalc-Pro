import { createModuleState } from '../../core/state.js';

export const state = createModuleState({
  buildingType: 'residential',
  waterHeatingMode: 'central',
  unitName: 'Bad 1',
  unitConsumerType: 'shower',
  unitCount: '1',
  unitDraftConsumers: [],
  singleName: 'Außenzapfstelle',
  singleConsumerType: 'tapDn15',
  singleCount: '1',
  singlePermanent: 'false',
  singleDraftConsumers: []
});
