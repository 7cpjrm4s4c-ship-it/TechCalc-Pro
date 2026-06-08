import { calculate, CONSUMERS, BUILDING_TYPES } from './logic.js';
import { fmt } from '../../utils/calculations.js';
import { buildDrinkingWaterResultModel } from './results.js';

export function consumerOptions() {
  return CONSUMERS.map(c => ({ value: c.id, label: `${c.label} · ${fmt(c.vr, 2)} l/s${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}` }));
}

export function createDrinkingWaterViewModel(s = {}, result = calculate(s)){
  return {
    state: s,
    result,
    savedUsageUnits: (result.usageUnits || []).filter(unit => !unit.transient),
    savedSingleGroups: (result.singleGroups || []).filter(group => !group.transient),
    accent: 'blue',
    buildingOptions: BUILDING_TYPES.map(t => ({ value:t.id, label:t.label })),
    consumerOptions: consumerOptions(),
    resultModel: buildDrinkingWaterResultModel(s, result, 'blue')
  };
}

export default createDrinkingWaterViewModel;
