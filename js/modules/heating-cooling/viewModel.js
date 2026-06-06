import { fmtInput } from '../../utils/calculations.js';
import { field } from '../../core/renderer.js';
import {
  activeCalculationState,
  activeMassFlowUnit,
  activeValue,
  formatMassFlowInput,
  key
} from './controller.js';

function massFlowField(s = {}) {
  const unit = activeMassFlowUnit(s);
  return field({
    id: key(s, 'MassFlowKgh'),
    label: 'Massenstrom ṁ',
    unit,
    unitField: key(s, 'MassFlowUnit'),
    unitOptions: [
      { value: 'kg/h', label: 'kg/h' },
      { value: 'm3/h', label: 'm³/h' }
    ],
    value: formatMassFlowInput(activeValue(s, 'MassFlowKgh'), unit, s.mediumId)
  });
}

function powerField(s = {}) {
  const unit = activeValue(s, 'PowerUnit') || 'W';
  return field({
    id: key(s, 'PowerW'),
    label: 'Leistung Q',
    unit,
    unitField: key(s, 'PowerUnit'),
    unitOptions: [
      { value: 'W', label: 'W' },
      { value: 'kW', label: 'kW' }
    ],
    value: fmtInput(activeValue(s, 'PowerW'), 2)
  });
}

export function inputFields(s = {}, active = activeCalculationState(s)) {
  if (active.calcTarget === 'power') {
    return [
      massFlowField(s),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2) })
    ];
  }
  if (active.calcTarget === 'massFlow') {
    return [
      powerField(s),
      field({ id: key(s, 'DeltaT'), label: 'ΔT Temperatur', unit: 'K', value: fmtInput(active.deltaT, 2) })
    ];
  }
  return [
    powerField(s),
    massFlowField(s)
  ];
}

export default { inputFields };
