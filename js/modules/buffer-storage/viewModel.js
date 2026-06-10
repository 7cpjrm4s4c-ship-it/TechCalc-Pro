import { fmt, fmtInput } from '../../utils/calculations.js';
import { calculate } from './logic.js';
import { buildBufferStorageResultModel, mediumLabel, modeLabel } from './results.js';

export const BUFFER_ACCENT = 'cyan';

export const bufferModeOptions = [
  { value: 'runtime', label: 'Mindestlaufzeit' },
  { value: 'defrost', label: 'Abtauung' },
  { value: 'reserve', label: 'Wasservorlage' },
  { value: 'compare', label: 'Vergleich' }
];

export const mediumOptions = [
  { value: 'water', label: 'Wasser' },
  { value: 'glycol', label: 'Wasser-Glykol-Gemisch' }
];

export const glycolTypeOptions = [
  { value: 'ethylene', label: 'Ethylenglykol' },
  { value: 'propylene', label: 'Propylenglykol' }
];

export function glycolConcentrationOptions(s = {}) {
  const concentrations = s.glycolType === 'propylene'
    ? ['25', '30', '35', '40', '45', '50']
    : ['20', '25', '30', '35', '40', '45', '50'];
  return concentrations.map(value => ({ value, label: `${value} %` }));
}

export function inputModeFlags(s = {}) {
  return {
    isRuntimeMode: s.calculationMode === 'runtime',
    isDefrostMode: s.calculationMode === 'defrost',
    isReserveMode: s.calculationMode === 'reserve',
    isCompareMode: s.calculationMode === 'compare'
  };
}

export function runtimeFieldModels(s = {}) {
  return [
    { id: 'qMaxKw', label: 'QMax · max. Geräte-/Kälte-/Heizleistung', value: fmtInput(s.qMaxKw, 2), unit: 'kW' },
    { id: 'compressorRunTimeMin', label: 'TLaufzeit · Mindestlaufzeit Verdichter', value: fmtInput(s.compressorRunTimeMin, 2), unit: 'min' },
    { id: 'qLoadKw', label: 'QLast · konstante Lastabnahme', value: fmtInput(s.qLoadKw, 2), unit: 'kW' },
    { id: 'partLoadFactor', label: 'Teillast · kleinste Teillaststufe', value: fmtInput(s.partLoadFactor, 3), unit: '%' },
    { id: 'controllerDeltaT', label: 'ΔT Hydraulikkreislauf', value: fmtInput(s.controllerDeltaT, 2), unit: 'K' },
    { id: 'existingSystemVolumeL', label: 'vorhandener Systeminhalt abziehen', value: fmtInput(s.existingSystemVolumeL, 1), unit: 'Liter' }
  ];
}

export function defrostFieldModels(s = {}) {
  return [
    { id: 'qConsumerKw', label: 'QVerbraucher · Heizleistung aktive Verbraucher', value: fmtInput(s.qConsumerKw, 2), unit: 'kW' },
    { id: 'qDefrostKw', label: 'QKälte · Kälteleistung bei Abtauung', value: fmtInput(s.qDefrostKw, 2), unit: 'kW' },
    { id: 'qHeatingCircuitKw', label: 'QHeiz · Heizleistung verbleibender Kreis', value: fmtInput(s.qHeatingCircuitKw, 2), unit: 'kW' },
    { id: 'maxDefrostTimeMin', label: 'TMaxAbtauung · maximale Abtauzeit', value: fmtInput(s.maxDefrostTimeMin, 2), unit: 'min' },
    { id: 'hydraulicDeltaT', label: 'ΔT Hydraulikkreislauf', value: fmtInput(s.hydraulicDeltaT, 2), unit: 'K' },
    { id: 'existingSystemVolumeL', label: 'vorhandener Systeminhalt abziehen', value: fmtInput(s.existingSystemVolumeL, 1), unit: 'Liter' }
  ];
}

export function reserveFieldModels(s = {}) {
  return [
    { id: 'consumerFlowM3h', label: 'Volumenstrom Verbraucher', value: fmtInput(s.consumerFlowM3h, 3), unit: 'm³/h' },
    { id: 'bridgeTimeMin', label: 'Überbrückungszeit', value: fmtInput(s.bridgeTimeMin, 2), unit: 'min' }
  ];
}

export function createBufferStorageViewModel(s = {}, r = calculate(s), accent = BUFFER_ACCENT) {
  const flags = inputModeFlags(s);
  return {
    state: s,
    result: r,
    accent,
    ...flags,
    modeLabel: modeLabel(s.calculationMode),
    mediumLabel: mediumLabel(s),
    factorLabel: fmt(r?.factor || 0, 2),
    bufferModeOptions,
    mediumOptions,
    glycolTypeOptions,
    glycolConcentrationOptions: glycolConcentrationOptions(s),
    runtimeFields: runtimeFieldModels(s),
    defrostFields: defrostFieldModels(s),
    reserveFields: reserveFieldModels(s),
    resultModel: buildBufferStorageResultModel(s, r, accent)
  };
}

export default createBufferStorageViewModel;
