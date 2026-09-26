import { statusLabel } from './displayLabels.js';

const CONTROL_KEYS = new Set([
  'savedAssessments',
  'activeSavedAssessmentId',
  'expandedSavedAssessmentId',
  'savedAssessmentName'
]);

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const text = value => String(value ?? '').trim();

function inputStateFrom(current = {}) {
  return Object.fromEntries(Object.entries(current)
    .filter(([key]) => !CONTROL_KEYS.has(key))
    .map(([key, value]) => [key, clone(value)]));
}

function defaultAssessmentName(current = {}, existing = null) {
  const importedName = text(current.importedSystemName);
  const refrigerant = text(current.refrigerantId);
  const location = text(current.installationLocation);
  const fallback = [refrigerant, location].filter(Boolean).join(' · ');
  return text(current.savedAssessmentName)
    || importedName
    || text(existing?.name)
    || fallback
    || 'EN-378-Bewertung';
}

export function buildEN378SavedRecord(current = {}, result = {}, existing = null) {
  const name = defaultAssessmentName(current, existing);
  return {
    name,
    title: name,
    inputState: inputStateFrom(current),
    resultSummary: {
      status: result.status || 'incomplete',
      statusLabel: statusLabel(result.status || 'incomplete'),
      refrigerantId: current.refrigerantId || '',
      safetyClass: result.refrigerantSafetyData?.safetyClass || result.safetyClass?.id || '',
      chargeKg: result.chargeKg ?? null,
      roomVolumeM3: result.roomVolumeM3 ?? null,
      requiredMeasureCount: Array.isArray(result.requiredMeasures) ? result.requiredMeasures.length : 0,
      dataVersions: clone(result.dataVersions || current.dataVersions || {})
    }
  };
}

export function hydrateEN378SavedRecord(item = {}) {
  const inputState = clone(item.inputState) || {};
  return {
    ...inputState,
    savedAssessmentName: item.name || item.title || ''
  };
}

function subtitleFor(item = {}) {
  const summary = item.resultSummary || {};
  return [
    summary.refrigerantId,
    summary.chargeKg != null ? `${summary.chargeKg} kg` : '',
    summary.statusLabel || statusLabel(summary.status)
  ].filter(Boolean).join(' · ');
}

function statsFor(item = {}) {
  const summary = item.resultSummary || {};
  return [
    { label: 'Status', value: summary.statusLabel || statusLabel(summary.status) },
    { label: 'Kältemittel', value: summary.refrigerantId || '–' },
    { label: 'Füllmenge', value: summary.chargeKg != null ? `${summary.chargeKg} kg` : '–' },
    { label: 'Maßnahmen', value: String(summary.requiredMeasureCount ?? 0) }
  ];
}

export function buildEN378SavedRecordsModel(state = {}) {
  const items = Array.isArray(state.savedAssessments) ? state.savedAssessments : [];
  return {
    enabled: true,
    title: 'Gespeicherte EN-378-Bewertungen',
    nameFieldId: 'savedAssessmentName',
    nameLabel: 'Bewertungsbezeichnung',
    nameValue: state.savedAssessmentName || '',
    namePlaceholder: state.importedSystemName || 'z. B. Wärmepumpe Dachzentrale – Technikraum',
    activeId: state.activeSavedAssessmentId,
    expandedId: state.expandedSavedAssessmentId,
    loadAttr: 'data-saved-load',
    toggleAttr: 'data-saved-toggle',
    deleteAttr: 'data-saved-delete',
    emptyText: 'Noch keine EN-378-Bewertung gespeichert.',
    items: items.map(item => ({
      ...item,
      title: item.name || item.title || 'EN-378-Bewertung',
      subtitle: subtitleFor(item),
      stats: statsFor(item)
    }))
  };
}

export default Object.freeze({
  buildEN378SavedRecord,
  hydrateEN378SavedRecord,
  buildEN378SavedRecordsModel
});
