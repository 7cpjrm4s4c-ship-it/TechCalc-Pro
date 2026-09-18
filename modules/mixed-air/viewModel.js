import { formatNumber, parseNumber } from '../../core/numberService.js';
import { calculate } from './logic.js';
import { buildMixedAirResultModel, formulaText, modeLabel } from './results.js';

export const MIXED_AIR_ACCENT = 'cyan';

const fmtInput = (value, digits = 2) => {
  if (value === '' || value === null || value === undefined) return '';
  const n = parseNumber(value, { fallback: 0 });
  if (!n) return String(value);
  return formatNumber(n, { maximumFractionDigits: digits });
};

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
    resultModel: buildMixedAirResultModel(state, r, accent),
    mixing: mixingInputGroups(s)
  };
}

export default createMixedAirViewModel;
