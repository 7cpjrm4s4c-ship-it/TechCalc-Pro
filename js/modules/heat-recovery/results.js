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

export function buildHeatRecoveryResultModel(s = {}, r = {}, accent = 'cyan'){
  const isMixing = s.mode === 'mixing';
  const hasCondensation = Boolean(r?.hasCondensation);

  if (isMixing) {
    return {
      primary: {
        title: 'Ergebnis Mischluft',
        primary: {
          label: 'Mischluft / Zuluft',
          value: fmt(r?.mixed?.tempC, 2),
          unit: '°C'
        },
        rows: [
          { label: 'rel. Feuchte', value: fmt(r?.mixed?.rhPercent, 0), unit: '%' },
          { label: 'Volumenstrom', value: fmt(r?.mixed?.volumeFlowM3h, 0), unit: 'm³/h' },
          { label: 'Massenstrom', value: fmt(r?.mixed?.massFlowKgh, 2), unit: 'kg/h' },
          { label: 'x', value: fmt(r?.mixed?.humidityRatioGkg, 2), unit: 'g/kg' }
        ],
        accent
      },
      groups: [
        {
          title: 'Mischungsverhältnis',
          rows: [
            { label: 'Außenluftanteil', value: fmt(r?.outdoorShare, 0), unit: '%' },
            { label: 'Umluftanteil', value: fmt(r?.recircShare, 0), unit: '%' }
          ],
          accent
        },
        {
          title: 'Außenluft',
          rows: formatAirPoint(r?.outdoor, { includeVolume: true, includeMass: true }),
          accent
        },
        {
          title: 'Umluft / Raumluft',
          rows: formatAirPoint(r?.recirc, { includeVolume: true, includeMass: true }),
          accent
        },
        {
          title: 'Formel',
          html: `<div class="formula tc-formula">${formulaText(s)}</div>`,
          accent
        }
      ],
      notices: hasCondensation ? [{
        title: 'Kondensation',
        messages: [
          `Kondensat: ${fmt(r?.condensateKgh, 2)} kg/h`,
          `Kondensationsleistung: ${fmt(r?.condensateLs, 4)} l/s`,
          `Latente Leistung: ${fmt(r?.condensationPowerKw, 2)} kW`,
          '100%-Enthalpielinie überschritten'
        ],
        accent,
        prefix: 'Hinweis'
      }] : []
    };
  }

  return {
    primary: {
      title: 'WRG-Leistung',
      primary: {
        label: 'Rückgewonnene Leistung',
        value: fmt(r?.recoveredPowerKw, 2),
        unit: 'kW'
      },
      rows: [
        { label: 'Wirkungsgrad', value: fmt(r?.efficiency, 0), unit: '%' },
        { label: 'Bypass', value: fmt(r?.bypassPercent, 0), unit: '%' },
        { label: 'WTX-Wirksam', value: fmt(r?.effectiveVolumeFlowM3h, 0), unit: 'm³/h' },
        { label: 'ρ × cₚ / 3,6', value: fmt(r?.factor, 3), unit: 'Wh/(m³·K)' }
      ],
      accent
    },
    groups: [
      {
        title: 'Zuluft',
        rows: formatAirPoint(r?.supply, { includeMass: true }),
        accent
      },
      {
        title: 'Fortluft',
        rows: formatAirPoint(r?.exhaust, { includeMass: true }),
        accent
      },
      {
        title: 'Außenluft',
        rows: formatAirPoint(r?.outdoor, { includeVolume: true, includeMass: true }),
        accent
      },
      {
        title: 'Abluft',
        rows: formatAirPoint(r?.extract, { includeVolume: true, includeMass: true }),
        accent
      },
      {
        title: 'Formel',
        html: `<div class="formula tc-formula">${formulaText(s)}</div>`,
        accent
      }
    ],
    notices: hasCondensation ? [{
      title: 'Kondensation',
      messages: [
        `Kondensat: ${fmt(r?.condensateKgh, 2)} kg/h`,
        `Kondensationsleistung: ${fmt(r?.condensateLs, 4)} l/s`,
        `Latente Leistung: ${fmt(r?.condensationPowerKw, 2)} kW`,
        '100%-Enthalpielinie überschritten'
      ],
      accent,
      prefix: 'Hinweis'
    }] : []
  };
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

export default buildHeatRecoveryResultModel;
