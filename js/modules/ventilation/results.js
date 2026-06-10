import { fmt } from '../../utils/calculations.js';

export function targetLabel(target) {
  return target === 'power' ? 'Leistung' : target === 'volumeFlow' ? 'Volumenstrom' : 'Temperaturspreizung';
}

export function targetMain(target, r = {}) {
  if (target === 'power') return { label: 'Berechnete Luftleistung', value: fmt(r.powerKw), unit: 'kW' };
  if (target === 'volumeFlow') return { label: 'Berechneter Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' };
  return { label: 'Berechnete Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' };
}

export function ventilationResultRows(active = {}, r = {}) {
  return [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h), unit: 'm³/h' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));
}

export function airStatsRows(r = {}) {
  return [
    { label: 'ρL', value: fmt(r.rho, 3), unit: 'kg/m³' },
    { label: 'cₚ,L', value: fmt(r.cp, 3), unit: 'kJ/(kg·K)' },
    { label: 'ρ × cₚ / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m³·K)' }
  ];
}

export function buildVentilationResultModel(active = {}, r = {}, accent = 'cyan') {
  return {
    primary: {
      title: `Ergebnis — ${targetLabel(active.calcTarget)}`,
      primary: targetMain(active.calcTarget, r),
      rows: ventilationResultRows(active, r),
      accent
    }
  };
}

export default {
  targetLabel,
  targetMain,
  ventilationResultRows,
  airStatsRows,
  buildVentilationResultModel
};
