import { formatNumber, parseNumber } from '../../core/numberService.js';
import { calculate } from './logic.js';
import { buildHeatRecoveryResultModel, formulaText, modeLabel } from './results.js';

export const HEAT_RECOVERY_ACCENT = 'cyan';

export const modeOptions = [
  { value: 'wrg', label: 'WRG' }
];

const fmtInput = (value, digits = 2) => {
  if (value === '' || value === null || value === undefined) return '';
  const n = parseNumber(value, { fallback: 0 });
  if (!n) return String(value);
  return formatNumber(n, { maximumFractionDigits: digits });
};

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
export function createHeatRecoveryViewModel(s = {}, r = calculate(s), accent = HEAT_RECOVERY_ACCENT){
  return {
    state: s,
    result: r,
    accent,
    isMixing: false,
    isWrg: true,
    modeOptions,
    modeLabel: modeLabel('wrg'),
    formula: formulaText({ ...s, mode: 'wrg' }),
    resultModel: buildHeatRecoveryResultModel({ ...s, mode: 'wrg' }, r, accent),
    wrg: wrgInputGroups(s)
  };
}

export default createHeatRecoveryViewModel;
