import { fmt } from '../../utils/calculations.js';

export function targetLabel(target) {
  return target === 'power' ? 'Leistung' : target === 'massFlow' ? 'Massenstrom' : 'Temperaturspreizung';
}

export function targetMain(target, r = {}) {
  if (target === 'power') return { label: 'Berechnete Leistung', value: fmt(r.powerKw), unit: 'kW' };
  if (target === 'massFlow') return { label: 'Berechneter Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' };
  return { label: 'Berechnete Temperaturspreizung', value: fmt(r.deltaT), unit: 'K' };
}

export function mediumRows(medium = {}) {
  const rows = [
    { label: 'Dichte ρ', value: fmt(medium.density, 0), unit: 'kg/m³' },
    { label: 'cₚ', value: fmt(medium.cpWhKgK, 3), unit: 'Wh/(kg·K)' }
  ];
  if (medium.frostC !== null && medium.frostC !== undefined) {
    rows.push({ label: 'Frostschutz', value: fmt(medium.frostC, 0), unit: '°C' });
  }
  return rows;
}

export function resultRows(active = {}, r = {}) {
  return [
    { label: 'Leistung', value: fmt(r.powerKw), unit: 'kW' },
    { label: 'Massenstrom', value: fmt(r.massFlowKgh), unit: 'kg/h' },
    { label: 'Volumenstrom', value: fmt(r.volumeFlowM3h, 3), unit: 'm³/h' },
    { label: 'ΔT', value: fmt(r.deltaT), unit: 'K' },
    { label: 'Medium', value: r.medium?.label || '—' },
    { label: 'Dichte', value: fmt(r.medium?.density, 0), unit: 'kg/m³' }
  ].filter(item => item.label !== targetLabel(active.calcTarget));
}

export function pipeRows(r = {}) {
  if (!r.pipe || r.pipe.noDimension) return [];
  return [
    { label: 'Material', value: r.pipe.system?.label || '—' },
    { label: 'Geschwindigkeit', value: fmt(r.pipe.velocity), unit: 'm/s' },
    { label: 'Druckverlust', value: fmt(r.pipe.pressureLoss), unit: 'Pa/m' },
    { label: 'Norm', value: r.pipe.norm || '—' }
  ];
}

export function buildHeatingCoolingResultModel(active = {}, r = {}, accent = 'orange') {
  return {
    primary: {
      title: `Ergebnis — ${targetLabel(active.calcTarget)}`,
      primary: targetMain(active.calcTarget, r),
      rows: resultRows(active, r),
      accent
    }
  };
}

export function buildPipeRecommendationModel(r = {}) {
  if (!r.pipe) {
    return {
      title: 'Rohrdimensionsempfehlung',
      emptyText: 'Massenstrom berechnen oder eingeben →<br>Rohrdimensionierung',
      accent: 'blue'
    };
  }
  if (r.pipe.noDimension) {
    return {
      title: 'Rohrdimensionsempfehlung',
      emptyText: 'Keine Dimensionierung möglich!',
      accent: 'blue'
    };
  }
  return {
    title: 'Rohrdimensionsempfehlung',
    primary: { label: 'Empfohlene Dimension', value: `DN ${r.pipe.dn}` },
    rows: pipeRows(r),
    accent: 'blue'
  };
}

export default {
  targetLabel,
  targetMain,
  mediumRows,
  resultRows,
  pipeRows,
  buildHeatingCoolingResultModel,
  buildPipeRecommendationModel
};
