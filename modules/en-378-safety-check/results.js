import { checkLabel, optionLabel, statusLabel, validationIssueLabel } from './displayLabels.js';
import { esc } from '../../core/ui/renderer.js';
import { getPlannerGuidanceStatusLabel } from './plannerGuidance.js';

const formatNumber = (value, digits = 2) => {
  if (!Number.isFinite(value)) return '–';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
};

const truncate = (value, max = 140) => {
  const text = String(value ?? '').trim();
  if (!text) return '–';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

const sourceSectionOf = item => item?.source?.sourceSection || '';

// Compact display row: title, short status, shortened statement, norm reference.
// The full requirement text stays in the data model and is only shortened here.
const compactItemRow = item => {
  const title = item.title || checkLabel(item.id);
  const section = sourceSectionOf(item);
  const statement = item.status === 'passed'
    ? `${title} erfüllt alle Anforderungen`
    : truncate(item.measure || item.requirement || 'prüfen');
  // Konsistenzregel: Fordert eine Prüfung eine Eingabe (missingInputs), wird diese namentlich
  // mit ihrer deutschen Bezeichnung ausgegeben (missingInputs liegen bereits als Labels vor).
  const missing = Array.isArray(item.missingInputs) ? item.missingInputs.filter(Boolean) : [];
  const missingText = item.status !== 'passed' && missing.length ? ` Fehlend: ${missing.join(', ')}.` : '';
  return {
    label: title,
    value: `${getPlannerGuidanceStatusLabel(item.status)}: ${statement}${missingText}`,
    unit: section
  };
};

const compactRequirementRow = requirement => compactItemRow(requirement);

const issueRows = calculation => (calculation.inputValidation?.issues || []).map(issue => ({
  label: 'Technische Validierung',
  value: validationIssueLabel(issue)
}));

const chargeLimitRows = calculation => {
  const assessment = calculation.chargeLimitAssessment || {};
  const rows = [
    { label: 'Konzentration', value: formatNumber(assessment.concentrationKgM3, 4), unit: 'kg/m³' },
    { label: 'Maximal zulässige Füllmenge', value: formatNumber(assessment.maximumAllowedChargeKg), unit: assessment.maximumAllowedChargeKg == null ? '' : 'kg' }
  ];
  for (const check of assessment.checks || []) {
    rows.push({ label: checkLabel(check.id), value: statusLabel(check.status), unit: check.source?.sourceSection || '' });
    if (Number.isFinite(check.maximumChargeKg)) rows.push({ label: `${checkLabel(check.id)} – Grenzwert`, value: formatNumber(check.maximumChargeKg), unit: 'kg' });
  }
  return rows;
};

const alternativeRiskRows = calculation => {
  const assessment = calculation.alternativeRiskMeasuresAssessment || {};
  if (!assessment.status || assessment.status === 'not-applicable') return [];
  const details = assessment.details || {};
  const rows = [
    { label: 'Bewertung', value: statusLabel(assessment.status) },
    { label: 'Erforderliche Mindestanzahl', value: formatNumber(assessment.requiredMeasureCount, 0) },
    { label: 'Ausgewählte Maßnahmen', value: formatNumber(assessment.selectedMeasureCount, 0) },
    { label: 'Maximaler C.3-Grenzwert', value: formatNumber(assessment.maximumChargeKg), unit: assessment.maximumChargeKg == null ? '' : 'kg' },
    { label: 'Erforderliche freie Öffnungsfläche', value: formatNumber(details.openingAreaM2, 5), unit: details.openingAreaM2 == null ? '' : 'm²' },
    { label: 'Vereinfachter mechanischer Luftstrom', value: formatNumber(details.mechanicalVentilationFlowM3h, 1), unit: details.mechanicalVentilationFlowM3h == null ? '' : 'm³/h' }
  ];
  if (Array.isArray(details.selectedMeasures) && details.selectedMeasures.length) {
    rows.push({ label: 'Gewählte Maßnahmen', value: details.selectedMeasures.join(', ') });
  }
  for (const requirement of assessment.requirements || []) {
    rows.push(compactRequirementRow(requirement));
  }
  return rows;
};

const consistencyRows = calculation => {
  const assessment = calculation.stateConsistencyAssessment || {};
  if (!assessment.requirements?.length) return [];
  return [
    { label: 'Bewertung', value: statusLabel(assessment.status) },
    ...assessment.requirements.map(requirement => compactRequirementRow(requirement))
  ];
};

const refrigerantSafetyRows = calculation => {
  const data = calculation.refrigerantSafetyData || {};
  return [
    { label: 'Sicherheitsklasse', value: data.safetyClass || calculation.safetyClass?.id || '–' },
    { label: 'Toxizitätsklasse', value: data.toxicityClass || '–' },
    { label: 'Brennbarkeitsklasse', value: data.flammabilityClass || '–' },
    { label: 'Praktischer Grenzwert', value: formatNumber(data.practicalLimitKgM3, 4), unit: 'kg/m³' },
    { label: 'ATEL/ODL', value: formatNumber(data.atelOdlKgM3, 4), unit: 'kg/m³' },
    { label: 'LFL', value: formatNumber(data.lflKgM3, 4), unit: data.lflKgM3 == null ? '' : 'kg/m³' }
  ];
};

const plannerGuidanceSummaryRows = calculation => {
  const guidance = calculation.plannerGuidance || {};
  return [
    { label: 'Leitfadenstatus', value: guidance.headline || statusLabel(calculation.status) },
    { label: 'Zusammenfassung', value: guidance.summary || '–' },
    { label: 'Maßnahmen oder Planungspunkte', value: formatNumber(guidance.actionCount, 0) },
    { label: 'Nicht erfüllte Punkte', value: formatNumber(guidance.failedCount, 0) },
    { label: 'Offene Prüfpunkte', value: formatNumber(guidance.openPointCount, 0) }
  ];
};

const ventilationOutputRows = calculation => {
  const state = calculation.effectiveState || {};
  // Only show when machinery room gate is fulfilled
  if (state.installationLocation !== 'machinery-room' || state.machineryRoomRiskAnalysisResult !== 'yes') {
    return [];
  }
  
  const numberOrNull = value => {
    if (value === '' || value == null) return null;
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
  
  const chargeKg = numberOrNull(state.machineryRoomLargestSystemChargeKg);
  const roomVolume = numberOrNull(state.roomVolumeM3);
  const occupied = state.machineryRoomOccupied === 'yes';
  
  const rows = [];
  
  // V_formel = 0.014 * m^(2/3)
  if (chargeKg != null && chargeKg > 0) {
    const vFormelM3s = 0.014 * (chargeKg ** (2 / 3));
    const vFormelM3h = round(vFormelM3s * 3600, 1);
    rows.push({ label: 'Luftvolumenstrom Notlüftung nach Gleichung (1)', value: formatNumber(vFormelM3s, 4), unit: 'm³/s' });
    rows.push({ label: 'Luftvolumenstrom Notlüftung nach Gleichung (1)', value: formatNumber(vFormelM3h, 1), unit: 'm³/h' });
  } else {
    rows.push({ label: 'Luftvolumenstrom Notlüftung nach Gleichung (1)', value: 'nicht bestimmbar', unit: 'Fehlende Angabe: Füllmenge' });
  }
  
  // V_15 = roomVolume * 15
  if (roomVolume != null && roomVolume > 0) {
    const v15 = round(roomVolume * 15, 1);
    rows.push({ label: 'Luftvolumenstrom Notlüftung nach 15 Luftwechseln/h', value: formatNumber(v15, 1), unit: 'm³/h' });
  } else {
    rows.push({ label: 'Luftvolumenstrom Notlüftung nach 15 Luftwechseln/h', value: 'nicht bestimmbar', unit: 'Fehlende Angabe: Raumvolumen' });
  }
  
  // Governing value
  if (chargeKg != null && chargeKg > 0 && roomVolume != null && roomVolume > 0) {
    const vFormelM3s = 0.014 * (chargeKg ** (2 / 3));
    const vFormelM3h = round(vFormelM3s * 3600, 1);
    const v15 = round(roomVolume * 15, 1);
    const governing = Math.min(vFormelM3h, v15);
    const isFormulaGoverning = governing === vFormelM3h;
    rows.push({ label: 'Maßgeblicher Wert', value: formatNumber(governing, 1), unit: `m³/h (${isFormulaGoverning ? 'Gleichung (1)' : '15 Luftwechsel/h'})` });
  } else {
    rows.push({ label: 'Maßgeblicher Wert', value: 'nicht bestimmbar', unit: 'Fehlende Angaben' });
  }
  
  // 4× ventilation for occupied machinery room
  if (occupied && roomVolume != null && roomVolume > 0) {
    const v4 = round(roomVolume * 4, 1);
    rows.push({ label: 'Luftvolumenstrom mechanische Lüftung (4-facher Luftwechsel)', value: formatNumber(v4, 1), unit: 'm³/h' });
  } else if (occupied) {
    rows.push({ label: 'Luftvolumenstrom mechanische Lüftung (4-facher Luftwechsel)', value: 'nicht bestimmbar', unit: 'Fehlende Angabe: Raumvolumen' });
  }
  
  return rows;
};

// Required planner points in a deterministic order; shared by the checklist
// rendering here and the toggle action in index.js (index -> requirement id).
export const collectRequiredGuidanceItems = calculation => {
  const guidance = calculation?.plannerGuidance || {};
  return (guidance.groups || []).flatMap(group => group.items || []).filter(item => item.status === 'required');
};

// Checklist row: pure planner note ("berücksichtigt"), never a normative status.
// The toggle commits via data-checklist-index; the acknowledged map lives in
// state.en378ChecklistAcknowledged (requirement id -> timestamp) and persists
// with the project/session storage. Raw requirement ids stay out of the DOM.
const checklistItemHtml = (item, index, acknowledged) => {
  const title = item.title || checkLabel(item.id);
  const section = sourceSectionOf(item);
  const checked = Boolean(acknowledged?.[item.id]);
  const meta = `${getPlannerGuidanceStatusLabel(item.status)}: ${truncate(item.measure || item.requirement || 'prüfen')}${section ? ` · ${section}` : ''}`;
  return `<label class="tc-checklist-item${checked ? ' is-acknowledged' : ''}">`
    + `<input type="checkbox" data-tc-action="en378:checklist:toggle" data-checklist-index="${index}"${checked ? ' checked' : ''} aria-label="${esc(title)} abhaken">`
    + `<span class="tc-checklist-item__title">${esc(title)}</span>`
    + `<span class="tc-checklist-item__meta">${esc(meta)}</span>`
    + (checked ? '<span class="tc-checklist-item__ack">berücksichtigt</span>' : '')
    + '</label>';
};

const checklistGroupHtml = (calculation, acknowledged) =>
  collectRequiredGuidanceItems(calculation)
    .map((item, index) => checklistItemHtml(item, index, acknowledged))
    .join('');

// Status-oriented compact overview: open points first, then failures, then the
// required checklist, then passed. The former "Sicherheitskomponenten" card is
// integrated into the planner guidance via these groups.
const statusOverviewGroups = (calculation, displayState) => {
  const guidance = calculation.plannerGuidance || {};
  const actionItems = (guidance.groups || []).flatMap(group => group.items || []);
  const openItems = actionItems.filter(item => item.status === 'not-assessed');
  const failedItems = actionItems.filter(item => item.status === 'failed');
  const passedItems = guidance.confirmedItems || [];
  const acknowledged = displayState?.en378ChecklistAcknowledged || {};
  return [
    { title: 'Offen', rows: openItems.map(item => compactItemRow(item)) },
    { title: 'Nicht erfüllt', rows: failedItems.map(item => compactItemRow(item)) },
    { title: 'Erforderlich', html: checklistGroupHtml(calculation, acknowledged) },
    { title: 'Erfüllt', rows: passedItems.map(item => compactItemRow(item)) }
  ];
};

const plannerGuidanceGroups = (calculation, displayState) => {
  const guidance = calculation.plannerGuidance || {};
  const groups = [{ title: 'Planer-Leitfaden – Zusammenfassung', rows: plannerGuidanceSummaryRows(calculation) }];
  groups.push({ title: 'Planer-Leitfaden – Statusübersicht', groups: statusOverviewGroups(calculation, displayState) });
  for (const group of guidance.groups || []) {
    if (group.id === 'openPoints') continue; // open points are shown in the "Offen" status group
    const rows = (group.items || []).filter(item => item.status !== 'passed').map(item => compactItemRow(item));
    if (!rows.length) continue;
    groups.push({ title: `Planer-Leitfaden – ${group.title}`, rows });
  }
  return groups;
};

export function buildEN378SafetyCheckResultModel(currentState = {}, calculation = {}) {
  const displayState = calculation.effectiveState || currentState;
  return {
    primary: {
      title: 'Bewertung',
      primary: { label: 'Status', value: statusLabel(calculation.status) },
      rows: [
        { label: 'Kältemittel', value: displayState.refrigerantId || '–' },
        { label: 'Sicherheitsklasse', value: calculation.refrigerantSafetyData?.safetyClass || calculation.safetyClass?.id || '–' },
        { label: 'Füllmenge', value: formatNumber(calculation.chargeKg), unit: 'kg' },
        { label: 'Raumvolumen', value: formatNumber(calculation.roomVolumeM3), unit: 'm³' }
      ],
      accent: 'blue'
    },
    groups: [
      { title: 'Kältemittel-Sicherheitsdaten', rows: refrigerantSafetyRows(calculation) },
      { title: 'Füllmengenbewertung nach EN 378-1 Anhang C', rows: chargeLimitRows(calculation) },
      { title: 'Alternative Vorkehrungen nach EN 378-1 C.3', rows: alternativeRiskRows(calculation) },
      { title: 'Plausibilitätsprüfung der Eingaben', rows: consistencyRows(calculation) },
      { title: 'Lüftungsauslegung Maschinenraum', rows: ventilationOutputRows(calculation) },
      {
        title: 'Aufstellung',
        rows: [
          { label: 'Aufstellort', value: optionLabel(displayState.installationLocation) },
          { label: 'Aufstellungsort-Klassifikation', value: optionLabel(displayState.installationClass) },
          { label: 'Zugangsbereich', value: optionLabel(displayState.accessArea) },
          { label: 'Kategorie des Zugangsbereichs', value: optionLabel(displayState.accessCategory) },
          { label: 'Nutzung', value: optionLabel(displayState.usageType) },
          { label: 'Anwendungsart', value: optionLabel(displayState.applicationType) },
          { label: 'Geschoss oder Lage', value: optionLabel(displayState.locationLevel) },
          { label: 'Lüftung', value: optionLabel(displayState.ventilationType) }
        ]
      },
      ...plannerGuidanceGroups(calculation, displayState),
      { title: 'Technische Validierung', rows: issueRows(calculation) }
    ].filter(group => (Array.isArray(group.rows) && group.rows.length > 0) || (Array.isArray(group.groups) && group.groups.length > 0)),
    notices: calculation.notices || []
  };
}

export default buildEN378SafetyCheckResultModel;
