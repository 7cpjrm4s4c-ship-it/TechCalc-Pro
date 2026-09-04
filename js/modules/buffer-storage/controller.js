import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { fmt } from '../../utils/calculations.js';
import { parseNumber } from '../../core/numberService.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { mediumLabel, modeLabel } from './results.js';

function normalizeBufferStorageState(s = {}){
  const calculationMode = ['runtime', 'defrost', 'reserve'].includes(s.calculationMode) ? s.calculationMode : 'runtime';
  return { ...s, calculationMode };
}

function reportNumber(value){
  if (value === '' || value === null || value === undefined) return NaN;
  const numeric = typeof value === 'number' ? value : parseNumber(value, { fallback: NaN });
  return Number.isFinite(numeric) ? numeric : NaN;
}

function formatReportNumber(value, unit = '', digits = 2){
  const numeric = reportNumber(value);
  if (!Number.isFinite(numeric)) return value ?? '—';
  const text = fmt(numeric, digits);
  if (unit === 'l' && Math.abs(numeric) >= 1000 && !String(text).includes(',')) {
    return `${text},0`;
  }
  return text;
}

function valueRow(label, value, unit = '', digits = 2){
  const text = formatReportNumber(value, unit, digits);
  return [label, text || '—', unit];
}

function positiveRow(label, value, unit = '', digits = 2){
  return reportNumber(value) > 0 ? valueRow(label, value, unit, digits) : null;
}

function rowsForCalculationParameters(snapshot = {}){
  const s = normalizeBufferStorageState(snapshot);
  const rows = [
    ['Berechnungsart', modeLabel(s.calculationMode), ''],
    ['Medium', mediumLabel(s), '']
  ];

  if (s.mediumMode !== 'water') {
    rows.push(
      ['Glykolart', s.glycolType === 'propylene' ? 'Propylenglykol' : 'Ethylenglykol', ''],
      valueRow('Glykolanteil', s.glycolConcentration, '%', 2)
    );
  }

  if (s.calculationMode === 'runtime') {
    rows.push(
      valueRow('Maximale Leistung', s.qMaxKw, 'kW', 2),
      valueRow('Teillastfaktor', s.partLoadFactor, '%', 2),
      valueRow('Konstante Lastabnahme', s.qLoadKw, 'kW', 2),
      valueRow('Mindestlaufzeit', s.compressorRunTimeMin, 'min', 2),
      valueRow('Regelband', s.controllerDeltaT, 'K', 2),
      valueRow('Vorhandenes Anlagenvolumen', s.existingSystemVolumeL, 'l', 2)
    );
  }

  if (s.calculationMode === 'defrost') {
    rows.push(
      valueRow('Heizleistung aktive Verbraucher', s.qConsumerKw, 'kW', 2),
      valueRow('Kälteleistung bei Abtauung', s.qDefrostKw, 'kW', 2),
      valueRow('Heizleistung verbleibender Kreis', s.qHeatingCircuitKw, 'kW', 2),
      valueRow('Maximale Abtauzeit', s.maxDefrostTimeMin, 'min', 2),
      valueRow('Hydraulische Temperaturdifferenz', s.hydraulicDeltaT, 'K', 2),
      valueRow('Vorhandenes Anlagenvolumen', s.existingSystemVolumeL, 'l', 2)
    );
  }

  if (s.calculationMode === 'reserve') {
    rows.push(
      valueRow('Volumenstrom Verbraucher', s.consumerFlowM3h, 'm³/h', 2),
      valueRow('Überbrückungszeit', s.bridgeTimeMin, 'min', 2)
    );
  }

  return rows.filter(Boolean);
}

function rowsForCalculationResults(result = {}){
  return [
    valueRow('Berechnungsfaktor', result.factor, '', 2),
    positiveRow('Leistungsanteil Mindestlaufzeit', result.runtimePower, 'kW', 2),
    positiveRow('Systeminhalt Mindestlaufzeit', result.runtimeSystemVolume, 'l', 1),
    positiveRow('Puffervolumen Mindestlaufzeit', result.runtimeBufferVolume, 'l', 1),
    positiveRow('Leistungsbilanz Abtauung', result.defrostPower, 'kW', 2),
    positiveRow('Systeminhalt Abtauung', result.defrostSystemVolume, 'l', 1),
    positiveRow('Puffervolumen Abtauung', result.defrostBufferVolume, 'l', 1),
    positiveRow('Wasservorlage', result.reserveVolume, 'l', 1),
    positiveRow('Abgezogenes Anlagenvolumen', result.existingSystemVolume, 'l', 1),
    valueRow('Erforderliches Pufferspeichervolumen', result.decisiveVolume, 'l', 1),
    valueRow('Nächstes Normvolumen', result.nextStandardVolume, 'l', 0)
  ].filter(Boolean);
}

export function savedBufferStats(item = {}){
  const res = item.result || {};
  return [
    { label: 'Berechnungsart', value: modeLabel(res.mode) },
    { label: 'Normvolumen', value: res.standard ? fmt(res.standard, 0) : '—', unit: res.standard ? 'Liter' : '' },
    { label: 'Volumen', value: res.volume ? fmt(res.volume, 1) : '—', unit: res.volume ? 'Liter' : '' },
    { label: 'Medium', value: res.medium || '—' }
  ];
}

export function buildBufferRecord(currentState, result, items, id, name, existing = null){
  const normalizedState = normalizeBufferStorageState(currentState);
  const copy = { ...normalizedState };
  delete copy.savedBuffers;
  delete copy.savedCalculations;
  delete copy.activeBufferId;
  delete copy.activeCalculationId;
  delete copy.expandedBufferId;

  return {
    id,
    name: name || currentState.plantName?.trim() || existing?.name || `Pufferspeicher ${items.length + 1}`,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    rows: [
      ...rowsForCalculationParameters(copy),
      ...rowsForCalculationResults(result || {})
    ],
    result: {
      mode: normalizedState.calculationMode,
      volume: result?.decisiveVolume,
      standard: result?.nextStandardVolume,
      medium: mediumLabel(normalizedState)
    }
  };
}

export function savedBufferPatch(item, currentState = {}){
  const legacy = Array.isArray(currentState.savedCalculations) ? currentState.savedCalculations : [];
  const saved = Array.isArray(currentState.savedBuffers) && currentState.savedBuffers.length ? currentState.savedBuffers : legacy;
  return item?.state ? {
    ...normalizeBufferStorageState(item.state),
    savedBuffers: saved,
    activeBufferId: item.id,
    expandedBufferId: currentState.expandedBufferId || null,
    plantName: item.name || item.state?.plantName || ''
  } : {};
}

export const bufferStorageSavedController = createLineSectionController({
  state,
  listKey: 'savedBuffers',
  activeIdKey: 'activeBufferId',
  nameKey: 'plantName',
  expandedIdKey: 'expandedBufferId',
  recordPrefix: 'buffer',
  cardTitle: 'Berechnung speichern',
  nameLabel: 'Bezeichnung',
  nameInputId: 'plantName',
  namePlaceholder: 'z. B. Kaltwassersatz BT A',
  emptyText: 'Noch keine Pufferspeicher-Berechnungen gespeichert.',
  accent: 'blue',
  dynamicAttr: 'saved-records',
  dynamicDataAttr: 'data-buffer-dynamic',
  title: item => item.name || 'Pufferspeicher',
  stats: savedBufferStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildBufferRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => savedBufferPatch(item, currentState)
});

function normalizeBufferSnapshot(snapshot = {}){
  const legacy = Array.isArray(snapshot.savedCalculations) ? snapshot.savedCalculations : [];
  const saved = Array.isArray(snapshot.savedBuffers) && snapshot.savedBuffers.length ? snapshot.savedBuffers : legacy;
  return normalizeBufferStorageState({ ...snapshot, savedBuffers: saved });
}

export function bufferSaveCard(s){
  return bufferStorageSavedController.renderCard(normalizeBufferSnapshot(s));
}

export function bindBufferStorageActions(root){
  const current = state.get();
  if ((!Array.isArray(current.savedBuffers) || !current.savedBuffers.length) && Array.isArray(current.savedCalculations) && current.savedCalculations.length) {
    state.set({ savedBuffers: current.savedCalculations }, { action: 'buffer:migrate-saved-records', notify: false });
  }
  bufferStorageSavedController.bind(root);
}
