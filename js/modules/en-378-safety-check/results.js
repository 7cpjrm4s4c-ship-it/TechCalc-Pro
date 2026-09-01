import { getPlannerGuidanceStatusLabel } from './plannerGuidance.js';

const formatNumber = (value, digits = 2) => {
  if (!Number.isFinite(value)) return '–';
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(value);
};

const statusLabel = status => {
  if (status === 'acceptable') return 'Anforderungen nach aktuellem Prüfstand erfüllt';
  if (status === 'measures-required') return 'Maßnahmen / Anpassung erforderlich';
  if (status === 'ready-for-assessment') return 'Eingaben vollständig, einzelne Prüfpunkte offen';
  if (status === 'import-rejected') return 'Snapshot abgelehnt';
  return 'Eingaben unvollständig';
};

const issueRows = calculation => (calculation.inputValidation?.issues || []).map(issue => ({
  label: 'Technische Validierung',
  value: issue
}));

const chargeLimitRows = calculation => {
  const assessment = calculation.chargeLimitAssessment || {};
  const rows = [
    { label: 'Konzentration', value: formatNumber(assessment.concentrationKgM3, 4), unit: 'kg/m³' },
    { label: 'Maximal zulässige Füllmenge', value: formatNumber(assessment.maximumAllowedChargeKg), unit: assessment.maximumAllowedChargeKg == null ? '' : 'kg' }
  ];

  for (const check of assessment.checks || []) {
    rows.push({ label: check.id, value: check.status });
    if (Number.isFinite(check.maximumChargeKg)) {
      rows.push({ label: `${check.id} – Grenzwert`, value: formatNumber(check.maximumChargeKg), unit: 'kg' });
    }
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
    { label: 'Maßnahmen / Planungspunkte', value: formatNumber(guidance.actionCount, 0) },
    { label: 'Nicht erfüllte Punkte', value: formatNumber(guidance.failedCount, 0) },
    { label: 'Offene Prüfpunkte', value: formatNumber(guidance.openPointCount, 0) }
  ];
};

const plannerGuidanceGroups = calculation => {
  const guidance = calculation.plannerGuidance || {};
  const groups = [
    {
      title: 'Planer-Leitfaden – Zusammenfassung',
      rows: plannerGuidanceSummaryRows(calculation)
    }
  ];

  for (const group of guidance.groups || []) {
    groups.push({
      title: `Planer-Leitfaden – ${group.title}`,
      rows: (group.items || []).map(item => ({
        label: item.title || item.id,
        value: `${getPlannerGuidanceStatusLabel(item.status)}: ${item.measure || item.requirement || 'prüfen'}`,
        unit: item.sourceLabel || ''
      }))
    });
  }

  if (guidance.confirmedItems?.length) {
    groups.push({
      title: 'Planer-Leitfaden – Bestätigte Prüfpunkte',
      rows: guidance.confirmedItems.map(item => ({
        label: item.title || item.id,
        value: `${getPlannerGuidanceStatusLabel(item.status)}: ${item.requirement || item.measure || 'bestätigt'}`,
        unit: item.sourceLabel || ''
      }))
    });
  }

  return groups;
};

export function buildEN378SafetyCheckResultModel(currentState = {}, calculation = {}) {
  return {
    primary: {
      title: 'Bewertung',
      primary: {
        label: 'Status',
        value: statusLabel(calculation.status)
      },
      rows: [
        { label: 'Kältemittel', value: currentState.refrigerantId || '–' },
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
          { label: 'Aufstellort', value: currentState.installationLocation || '–' },
          { label: 'Aufstellungsort-Klassifikation', value: currentState.installationClass || '–' },
          { label: 'Zugangsbereich', value: currentState.accessArea || '–' },
          { label: 'Kategorie des Zugangsbereichs', value: currentState.accessCategory || '–' },
          { label: 'Nutzung', value: currentState.usageType || '–' },
          { label: 'Anwendungsart', value: currentState.applicationType || '–' },
          { label: 'Geschoss / Lage', value: currentState.locationLevel || '–' },
          { label: 'Lüftung', value: currentState.ventilationType || '–' }
        ]
      },
      ...plannerGuidanceGroups(calculation),
      { title: 'Technische Validierung', rows: issueRows(calculation) }
    ],
    notices: calculation.notices || []
  };
}

export default buildEN378SafetyCheckResultModel;
