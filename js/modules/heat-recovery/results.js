import { fmt } from '../../utils/calculations.js';

export function modeLabel(mode){
  return mode === 'mixing' ? 'Mischluft' : 'WRG';
}

export function formatAirPoint(point = {}, { includeVolume = false, includeMass = true } = {}){
  const rows = [];
  if (includeVolume) rows.push({ label: 'Volumenstrom V̇', value: fmt(point.volumeFlowM3h, 0), unit: 'm³/h' });
  if (includeMass) rows.push({ label: 'Massenstrom ṁ', value: fmt(point.massFlowKgh, 2), unit: 'kg/h' });
  rows.push({ label: 'Temperatur', value: fmt(point.tempC, 2), unit: '°C' });
  rows.push({ label: 'rel. Feuchte', value: fmt(point.rhPercent, 0), unit: '%' });
  return rows;
}

export function formulaText(s = {}){
  return s.mode === 'mixing'
    ? 'Mischluft: x und h aus Außenluft + Umluft über Massenstromanteile'
    : 'WRG: tZuluft = (1−β) × [tAußen + ηWRG × (tAbluft − tAußen)] + β × tAußen · tFort = tAbluft − (1−β) × ηWRG × (tAbluft − tAußen)';
}

export function buildRltDeviceRecord(currentState = {}, result = {}, items = [], id, name, existing = null){
  const isMixing = currentState.mode === 'mixing';
  const inputState = { ...currentState };
  delete inputState.activeRltDeviceId;
  delete inputState.activeRltDeviceName;
  delete inputState.expandedRltDeviceId;
  delete inputState.savedRltDevices;

  return {
    id,
    name: name || currentState.activeRltDeviceName || existing?.name || `RLT-Gerät ${items.length + 1}`,
    mode: modeLabel(currentState.mode),
    volumeFlowM3h: isMixing ? fmt(result.mixed?.volumeFlowM3h, 0) : fmt(currentState.wrgVolumeFlowM3h, 0),
    outdoor: `${fmt(isMixing ? currentState.mixingOutdoorTemp : currentState.outdoorTemp, 2)} °C / ${fmt(isMixing ? currentState.mixingOutdoorRh : currentState.outdoorRh, 0)} %`,
    extract: `${fmt(isMixing ? currentState.mixingRecircTemp : currentState.extractTemp, 2)} °C / ${fmt(isMixing ? currentState.mixingRecircRh : currentState.extractRh, 0)} %`,
    supply: isMixing ? `${fmt(result.mixed?.tempC, 2)} °C / ${fmt(result.mixed?.rhPercent, 0)} %` : `${fmt(result.supply?.tempC, 2)} °C / ${fmt(result.supply?.rhPercent, 0)} %`,
    exhaust: isMixing ? '—' : `${fmt(result.exhaust?.tempC, 2)} °C / ${fmt(result.exhaust?.rhPercent, 0)} %`,
    power: isMixing ? '—' : fmt(result.recoveredPowerKw, 2),
    condensation: result.hasCondensation ? `${fmt(result.condensateLs, 4)} l/s` : '—',
    state: inputState,
    inputState,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function rltDeviceStats(item = {}){
  return [
    { label: 'Berechnung', value: item.mode || '—' },
    { label: 'Volumenstrom', value: item.volumeFlowM3h || '—', unit: item.volumeFlowM3h && item.volumeFlowM3h !== '—' ? 'm³/h' : '' },
    { label: 'Außenluft', value: item.outdoor || '—' },
    { label: 'Abluft/Umluft', value: item.extract || '—' },
    { label: 'Zuluft/Mischluft', value: item.supply || '—' },
    { label: 'Fortluft', value: item.exhaust || '—' },
    { label: 'Leistung', value: item.power || '—', unit: item.power && item.power !== '—' ? 'kW' : '' },
    { label: 'Kondensation', value: item.condensation || '—' }
  ];
}

export function inferRltInputState(item = {}){
  const input = { ...(item.inputState || item.state || {}) };
  const label = String(item.mode || input.mode || '').toLowerCase();
  if (input.mode !== 'wrg' && input.mode !== 'mixing') {
    input.mode = label.includes('misch') || label.includes('mix') ? 'mixing' : 'wrg';
  }
  return input;
}
