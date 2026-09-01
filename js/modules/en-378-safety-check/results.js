import { checkLabel, optionLabel, statusLabel, validationIssueLabel } from './displayLabels.js';
import { getPlannerGuidanceStatusLabel } from './plannerGuidance.js';

const formatNumber = (value, digits = 2) => {
  if (!Number.isFinite(value)) return '–';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
};

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

const plannerGuidanceGroups = calculation => {
  const guidance = calculation.plannerGuidance || {};
  const groups = [{ title: 'Planer-Leitfaden – Zusammenfassung', rows: plannerGuidanceSummaryRows(calculation) }];
  for (const group of guidance.groups || []) {
    groups.push({
      title: `Planer-Leitfaden – ${group.title}`,
      rows: (group.items || []).map(item => ({
        label: item.title || checkLabel(item.id),
        value: `${getPlannerGuidanceStatusLabel(item.status)}: ${item.measure || item.requirement || 'prüfen'}`,
        unit: item.sourceLabel || ''
      }))
    });
  }
  if (guidance.confirmedItems?.length) {
    groups.push({
      title: 'Planer-Leitfaden – Bestätigte Prüfpunkte',
      rows: guidance.confirmedItems.map(item => ({
        label: item.title || checkLabel(item.id),
        value: `${getPlannerGuidanceStatusLabel(item.status)}: ${item.requirement || item.measure || 'bestätigt'}`,
        unit: item.sourceLabel || ''
      }))
    });
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
      ...plannerGuidanceGroups(calculation),
      { title: 'Technische Validierung', rows: issueRows(calculation) }
    ],
    notices: calculation.notices || []
  };
}

export default buildEN378SafetyCheckResultModel;
