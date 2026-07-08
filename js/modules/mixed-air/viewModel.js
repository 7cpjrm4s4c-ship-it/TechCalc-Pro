import { fmtInput } from '../../utils/calculations.js';
import { calculate } from './logic.js';
import { buildHeatRecoveryResultModel, formulaText, modeLabel } from '../heat-recovery/results.js';

export const MIXED_AIR_ACCENT = 'cyan';

function fieldModel(id, label, value, unit, extra = {}){
  return { id, label, value: fmtInput(value, extra.digits ?? 2), unit, ...extra };
}

export function mixingInputGroups(s = {}){
  return {
    outdoor: {
      title: 'Außenluft',
      volume: fieldModel('mixingOutdoorVolumeFlowM3h', 'Volumenstrom V̇', s.mixingOutdoorVolumeFlowM3h, 'm³/h'),
      temp: fieldModel('mixingOutdoorTemp', 'Temperatur', s.mixingOutdoorTemp, '°C', { signed: true }),
      rh: fieldModel('mixingOutdoorRh', 'rel. Feuchte', s.mixingOutdoorRh, '%')
    },
    recirc: {
      title: 'Umluft / Raumluft',
      volume: fieldModel('mixingRecircVolumeFlowM3h', 'Volumenstrom V̇', s.mixingRecircVolumeFlowM3h, 'm³/h'),
      temp: fieldModel('mixingRecircTemp', 'Temperatur', s.mixingRecircTemp, '°C'),
      rh: fieldModel('mixingRecircRh', 'rel. Feuchte', s.mixingRecircRh, '%')
    }
  };
}

export function createMixedAirViewModel(s = {}, r = calculate(s), accent = MIXED_AIR_ACCENT){
  const state = { ...s, mode: 'mixing' };
  return {
    state,
    result: r,
    accent,
    isMixing: true,
    isWrg: false,
    modeLabel: modeLabel('mixing'),
    formula: formulaText(state),
    resultModel: buildHeatRecoveryResultModel(state, r, accent),
    mixing: mixingInputGroups(s)
  };
}

export default createMixedAirViewModel;
