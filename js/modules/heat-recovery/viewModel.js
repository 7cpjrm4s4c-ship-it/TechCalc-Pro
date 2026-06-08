import { fmtInput } from '../../utils/calculations.js';
import { calculate } from './logic.js';
import { buildHeatRecoveryResultModel, formulaText, modeLabel } from './results.js';

export const HEAT_RECOVERY_ACCENT = 'cyan';

export const modeOptions = [
  { value: 'wrg', label: 'WRG' },
  { value: 'mixing', label: 'Mischluft' }
];

function fieldModel(id, label, value, unit, extra = {}){
  return { id, label, value: fmtInput(value, extra.digits ?? 2), unit, ...extra };
}

export function wrgInputGroups(s = {}){
  return {
    outdoor: {
      title: 'Außenluft',
      temp: fieldModel('outdoorTemp', 'Temperatur', s.outdoorTemp, '°C', { signed: true }),
      rh: fieldModel('outdoorRh', 'rel. Feuchte', s.outdoorRh, '%')
    },
    extract: {
      title: 'Abluft',
      temp: fieldModel('extractTemp', 'Temperatur', s.extractTemp, '°C'),
      rh: fieldModel('extractRh', 'rel. Feuchte', s.extractRh, '%')
    },
    heatRecovery: [
      fieldModel('wrgVolumeFlowM3h', 'Anlagenvolumenstrom V̇', s.wrgVolumeFlowM3h, 'm³/h'),
      fieldModel('efficiency', 'WRG-Wirkungsgrad', s.efficiency, '%'),
      fieldModel('bypassPercent', 'Bypass-Anteil β', s.bypassPercent, '%')
    ]
  };
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

export function createHeatRecoveryViewModel(s = {}, r = calculate(s), accent = HEAT_RECOVERY_ACCENT){
  const isMixing = s.mode === 'mixing';
  return {
    state: s,
    result: r,
    accent,
    isMixing,
    isWrg: !isMixing,
    modeOptions,
    modeLabel: modeLabel(s.mode),
    formula: formulaText(s),
    resultModel: buildHeatRecoveryResultModel(s, r, accent),
    wrg: wrgInputGroups(s),
    mixing: mixingInputGroups(s)
  };
}

export default createHeatRecoveryViewModel;
