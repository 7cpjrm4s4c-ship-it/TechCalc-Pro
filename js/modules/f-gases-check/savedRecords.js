import { createFGasesSystemSnapshot } from '../../shared/fGasesSystemSnapshot.js';
import { formatFGasesStatus } from './results.js';

const CONTROL_KEYS = new Set(['savedSystems', 'activeSavedSystemId', 'expandedSavedSystemId', 'savedSystemName']);
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

function inputStateFrom(current = {}) {
  return Object.fromEntries(Object.entries(current).filter(([key]) => !CONTROL_KEYS.has(key)).map(([key, value]) => [key, clone(value)]));
}

export function buildFGasesSavedRecord(current = {}, result = {}, existing = null) {
  const name = String(current.savedSystemName || current.systemName || existing?.name || 'F-Gase-Anlage').trim() || 'F-Gase-Anlage';
  return {
    name, title: name, inputState: inputStateFrom(current), systemSnapshot: createFGasesSystemSnapshot(current),
    resultSummary: { refrigerantId: current.refrigerantId || '', refrigerantName: result.refrigerant?.name || '', chargeKg: result.chargeKg ?? null, gwp: result.gwp ?? null, co2EquivalentTonnes: result.co2EquivalentTonnes ?? null, checks: clone(result.checks || {}), dataVersions: clone(result.dataVersions || current.dataVersions || {}) }
  };
}

export function hydrateFGasesSavedRecord(item = {}) {
  const inputState = clone(item.inputState) || {};
  if (!inputState.commissioningDate && inputState.installedAtSiteDate) inputState.commissioningDate = inputState.installedAtSiteDate;
  if (!inputState.stockAssessmentDate && inputState.assessmentDate) inputState.stockAssessmentDate = inputState.assessmentDate;
  if (!inputState.plannedActivity) inputState.plannedActivity = 'installation';
  delete inputState.installedAtSiteDate;
  delete inputState.assessmentDate;
  return { ...inputState, schemaVersion: Math.max(Number(inputState.schemaVersion) || 0, 5), savedSystemName: item.name || item.title || '' };
}

export function buildFGasesSavedRecordsModel(state = {}) {
  const items = Array.isArray(state.savedSystems) ? state.savedSystems : [];
  return {
    enabled: true, title: 'Gespeicherte Anlagen-Snapshots', nameFieldId: 'savedSystemName', nameLabel: 'Snapshot-Bezeichnung', nameValue: state.savedSystemName || '', namePlaceholder: state.systemName || 'z. B. WP Dachzentrale',
    activeId: state.activeSavedSystemId, expandedId: state.expandedSavedSystemId, loadAttr: 'data-saved-load', toggleAttr: 'data-saved-toggle', deleteAttr: 'data-saved-delete', emptyText: 'Noch kein Anlagen-Snapshot gespeichert.',
    items: items.map(item => ({ ...item, title: item.name || item.title || 'F-Gase-Anlage', subtitle: [item.resultSummary?.refrigerantName || item.resultSummary?.refrigerantId, item.resultSummary?.chargeKg != null ? `${item.resultSummary.chargeKg} kg` : ''].filter(Boolean).join(' · '), stats: [{ label: 'Inverkehrbringen', value: formatFGasesStatus(item.resultSummary?.checks?.placingOnMarket) }, { label: 'Wartung / Instandhaltung', value: formatFGasesStatus(item.resultSummary?.checks?.service) }] }))
  };
}

export default { buildFGasesSavedRecord, hydrateFGasesSavedRecord, buildFGasesSavedRecordsModel };
