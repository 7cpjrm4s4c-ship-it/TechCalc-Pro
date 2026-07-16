import { evaluateDwa117Applicability } from './retentionApplicability.js';
import { buildRetentionDurationComparison } from './retentionDurationComparison.js';
import { buildFloodingDiagnosticModel } from './diagnosticModel.js';
import { buildFloodingInterpretationModel } from './interpretationModel.js';

const fmt = (value, digits = 1) => Number(value || 0).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const modeLabel = mode => ({
  'table-existing-pipe': 'Vorhandene Leitung prüfen',
  'table-size-pipe': 'Leitung dimensionieren',
  'manual-full-flow': 'Vollfüllungsabfluss manuell',
  'authority-discharge-limit': 'Behördliche Einleitungsbegrenzung'
}[mode] || 'Leitungsnachweis');

const floodingSourceLabel = source => ({
  'equation-20': 'Gleichung (20)',
  'equation-21': 'Gleichung (21)'
}[source] || '—');

export function results(state = {}, result = {}) {
  const discharge = result.discharge || {};
  const flooding = result.flooding || {};
  const retention = result.retention || {};
  const combinedStorage = result.combinedStorage || {};
  const equation20 = flooding.equation20 || {};
  const equation21 = Array.isArray(flooding.equation21ByDuration) ? flooding.equation21ByDuration : [];
  const equation21Governing = flooding.equation21Governing || {};
  const governing = flooding.governing || {};
  const applicability = evaluateDwa117Applicability({
    enabled: retention.active,
    dischargeMode: result.dischargeMode,
    catchmentAreaHa: Number(result.totalArea || 0) / 10000,
    flowTimeMinutes: state.retentionFlowTimeMinutes,
    recurrenceFrequencyPerYear: retention.effectiveRecurrenceFrequencyPerYear ?? state.retentionRecurrenceFrequencyPerYear,
    throttleRainShareLsHa: retention.throttleRainShareLsHa,
    surchargeFactorFz: retention.surchargeFactorFz,
    reductionFactorFa: retention.reductionFactorFa
  });
  const retentionComparison = buildRetentionDurationComparison(retention.durationResults || []);
  const diagnostic = buildFloodingDiagnosticModel({ result, applicability, retentionComparison });
  const interpretation = buildFloodingInterpretationModel({ result, applicability });
  const applicationChecks = applicability.checks.filter(check => check.group === 'application-domain');
  const faChecks = applicability.checks.filter(check => check.group === 'fa-validity');

  const groups = [
    {
      title: 'Planerische Interpretation',
      rows: [
        { label: 'Planerische Zusammenfassung', value: interpretation.summary },
        { label: 'Leitungsnachweis', value: interpretation.discharge },
        { label: 'DWA-A 117', value: interpretation.dwa },
        { label: 'Normative Aussage', value: interpretation.normative },
        { label: 'Handlungsempfehlung', value: interpretation.recommendation }
      ],
      accent: 'green'
    },
    {
      title: 'Nachweisstatus',
      rows: [
        { label: 'Status', value: diagnostic.statusLabel },
        { label: 'Bewertung', value: diagnostic.statusReason },
        { label: 'Fehler', value: String(diagnostic.counts.errors) },
        { label: 'Warnungen', value: String(diagnostic.counts.warnings) },
        { label: 'Empfehlungen', value: String(diagnostic.counts.recommendations) },
        { label: 'Hinweise', value: String(diagnostic.counts.hints) }
      ],
      accent: 'green'
    },
    {
      title: 'Leitungs- und Abflussnachweis',
      rows: [
        { label: 'Erforderlicher Regenwasserabfluss Qᵣ', value: fmt(result.requiredRainFlowLs, 2), unit: 'l/s' },
        { label: 'Betriebsart', value: modeLabel(result.dischargeMode) },
        { label: 'Verfügbarer Abfluss Qab', value: result.availableFlowLs > 0 ? fmt(result.availableFlowLs, 2) : '—', unit: result.availableFlowLs > 0 ? 'l/s' : '' },
        { label: 'Auslastung', value: result.availableFlowLs > 0 ? fmt(result.utilizationPercent, 1) : '—', unit: result.availableFlowLs > 0 ? '%' : '' },
        { label: 'Nachweis', value: result.dischargeAdequate ? 'ausreichend' : 'nicht ausreichend / unvollständig' },
        { label: 'Nennweite', value: discharge.dn || '—' },
        { label: 'Gefälle', value: discharge.slopePercent != null ? fmt(discharge.slopePercent, 1) : '—', unit: discharge.slopePercent != null ? '%' : '' },
        { label: 'Quelle Qab', value: discharge.tableReference || '—' }
      ],
      accent: 'green'
    },
    {
      title: 'Gleichung (20)',
      rows: [
        { label: 'Regendauer D der Gleichung (20)', value: equation20.valid ? String(equation20.durationMinutes) : '—', unit: equation20.valid ? 'min' : '' },
        { label: `r(${equation20.durationMinutes || result.governingDurationMinutes || 'D'},30)`, value: equation20.valid ? fmt(equation20.rain30, 1) : '—', unit: equation20.valid ? 'l/(s·ha)' : '' },
        { label: `r(${equation20.durationMinutes || result.governingDurationMinutes || 'D'},2)`, value: equation20.valid ? fmt(equation20.rain2, 1) : '—', unit: equation20.valid ? 'l/(s·ha)' : '' },
        { label: 'Gesamtfläche Ages', value: fmt(equation20.totalAreaM2 || result.totalArea, 1), unit: 'm²' },
        { label: 'Σ(A × Cₛ)', value: fmt(equation20.weightedCsAreaM2 || result.weightedCsArea, 2), unit: 'm²' },
        { label: 'Rohwert', value: equation20.rawValueM3 != null ? fmt(equation20.rawValueM3, 3) : '—', unit: equation20.rawValueM3 != null ? 'm³' : '' },
        { label: 'Anzusetzendes Volumen', value: equation20.valid ? fmt(equation20.valueM3, 2) : '—', unit: equation20.valid ? 'm³' : '' }
      ],
      accent: 'green'
    },
    {
      title: 'Gleichung (21) – Dauerstufenvergleich',
      rows: equation21.map(item => ({
        label: `${item.durationMinutes} min · r(${item.durationMinutes},30) ${fmt(item.rain30, 1)} l/(s·ha)${item.durationMinutes === equation21Governing.durationMinutes ? ' · maßgebend' : ''}`,
        value: item.valid ? fmt(item.valueM3, 2) : '—',
        unit: item.valid ? 'm³' : ''
      })),
      accent: 'green'
    },
    {
      title: 'Berechnungsgrundlagen',
      rows: [
        { label: 'Mittlere Geländeneigung', value: fmt(state.meanSlopePercent, 1), unit: '%' },
        { label: 'Automatische Regendauer für Gleichung (20)', value: String(result.automaticDurationMinutes || '—'), unit: 'min' },
        { label: 'Verwendete Regendauer für Gleichung (20)', value: String(result.governingDurationMinutes || '—'), unit: 'min' },
        { label: 'Maßgebende Dauerstufe Gleichung (21)', value: equation21Governing.valid ? String(equation21Governing.durationMinutes) : '—', unit: equation21Governing.valid ? 'min' : '' },
        { label: 'Befestigte Fläche', value: fmt(result.sealedArea, 1), unit: 'm²' },
        { label: 'Befestigter Flächenanteil', value: fmt((result.sealedShare || 0) * 100, 1), unit: '%' },
        { label: 'Kritische Fläche', value: fmt(result.criticalArea, 1), unit: 'm²' },
        { label: 'Gesamtfläche', value: fmt(result.totalArea, 1), unit: 'm²' },
        { label: 'Regendaten vollständig', value: result.rainInputValid ? 'ja' : 'nein' },
        { label: 'Schema-Version', value: String(result.schemaVersion || state.schemaVersion || 2) }
      ],
      accent: 'green'
    }
  ];

  if (applicability.active) {
    groups.push({
      title: 'DWA-A 117 – Anwendungsprüfung',
      groups: [
        {
          title: 'Anwendungsbereich',
          rows: [
            { label: 'Status', value: applicability.statusLabel },
            { label: 'Einzugsgebietsfläche', value: applicability.catchmentAreaHa != null ? fmt(applicability.catchmentAreaHa, 3) : '—', unit: applicability.catchmentAreaHa != null ? 'ha' : '' },
            { label: 'Fließzeit', value: applicability.flowTimeMinutes != null ? fmt(applicability.flowTimeMinutes, 1) : '—', unit: applicability.flowTimeMinutes != null ? 'min' : '' },
            { label: 'Überschreitungshäufigkeit n', value: applicability.recurrenceFrequencyPerYear != null ? fmt(applicability.recurrenceFrequencyPerYear, 2) : '—', unit: applicability.recurrenceFrequencyPerYear != null ? '1/a' : '' },
            { label: 'qDr,R,u', value: applicability.throttleRainShareLsHa != null ? fmt(applicability.throttleRainShareLsHa, 2) : '—', unit: applicability.throttleRainShareLsHa != null ? 'l/(s·ha)' : '' },
            ...applicationChecks.map(check => ({ label: check.label, value: check.passed ? 'erfüllt' : 'nicht erfüllt' }))
          ]
        },
        {
          title: 'Gültigkeit fA',
          rows: [
            { label: 'Abminderungsfaktor fA', value: retention.reductionFactorFa > 0 ? fmt(retention.reductionFactorFa, 3) : '—' },
            ...faChecks.map(check => ({ label: check.label, value: check.passed ? 'erfüllt' : 'nicht erfüllt' }))
          ]
        },
        {
          title: 'Berechnung',
          rows: [
            { label: 'Berechnung durchgeführt', value: retention.calculated ? 'ja' : 'nein' },
            { label: 'Uneingeschränkt anwendbar', value: applicability.unrestricted ? 'ja' : 'nein' },
            { label: 'Zuschlagsfaktor fz', value: retention.surchargeFactorFz > 0 ? fmt(retention.surchargeFactorFz, 2) : '—' }
          ]
        }
      ],
      accent: 'green'
    });
  }

  if (retention.active) {
    groups.push({
      title: 'DWA-A 117 – Dauerstufenvergleich',
      rows: retentionComparison.rows.length ? retentionComparison.rows.map(item => ({
        label: `${item.durationMinutes} min · r ${item.rainIntensityLsHa != null ? fmt(item.rainIntensityLsHa, 1) : '—'} l/(s·ha) · Vs,u ${item.specificStorageM3Ha != null ? fmt(item.specificStorageM3Ha, 2) : '—'} m³/ha · ${item.statusLabel}`,
        value: item.valid ? fmt(item.volumeM3, 2) : '—',
        unit: item.valid ? 'm³' : ''
      })) : [{ label: 'Status', value: 'Dauerstufenvergleich unvollständig' }],
      accent: 'green'
    });
    groups.push({
      title: 'DWA-A 117 – Maßgebende Dauerstufe',
      rows: [
        { label: 'Maßgebende Dauer', value: retentionComparison.governing ? String(retentionComparison.governing.durationMinutes) : '—', unit: retentionComparison.governing ? 'min' : '' },
        { label: 'Regenspende r(D,n)', value: retentionComparison.governing ? fmt(retentionComparison.governing.rainIntensityLsHa, 1) : '—', unit: retentionComparison.governing ? 'l/(s·ha)' : '' },
        { label: 'Spezifisches Speichervolumen Vs,u', value: retentionComparison.governing ? fmt(retentionComparison.governing.specificStorageM3Ha, 2) : '—', unit: retentionComparison.governing ? 'm³/ha' : '' },
        { label: 'Maßgebendes Rückhaltevolumen', value: retentionComparison.governing ? fmt(retentionComparison.governing.volumeM3, 2) : '—', unit: retentionComparison.governing ? 'm³' : '' },
        { label: 'Status', value: retentionComparison.governing?.statusLabel || 'unvollständig' }
      ],
      accent: 'green'
    });
  }

  const dwaDuration = retentionComparison.governing?.durationMinutes;
  return {
    diagnostic,
    interpretation,
    primary: {
      title: 'Bemessungsvolumen',
      primary: {
        label: 'Planerisch anzusetzendes Speichervolumen',
        value: combinedStorage.planningVolumeM3 != null ? fmt(combinedStorage.planningVolumeM3, 2) : '—',
        unit: combinedStorage.planningVolumeM3 != null ? 'm³' : ''
      },
      rows: [
        { label: 'Maßgebender Nachweis', value: combinedStorage.governingLabel || 'Nachweis unvollständig' },
        { label: 'DIN 1986-100', value: combinedStorage.dinVolumeM3 != null ? fmt(combinedStorage.dinVolumeM3, 2) : '—', unit: combinedStorage.dinVolumeM3 != null ? 'm³' : '' },
        { label: 'DWA-A 117', value: combinedStorage.dwaVolumeM3 != null ? fmt(combinedStorage.dwaVolumeM3, 2) : (retention.active ? 'unvollständig' : 'nicht erforderlich'), unit: combinedStorage.dwaVolumeM3 != null ? 'm³' : '' },
        { label: 'Maßgebende Gleichung DIN', value: floodingSourceLabel(governing.source) },
        { label: 'Maßgebende Regendauer DIN', value: equation20.valid ? String(equation20.durationMinutes) : '—', unit: equation20.valid ? 'min' : '' },
        { label: 'Maßgebende Dauer DWA', value: dwaDuration != null ? String(dwaDuration) : '—', unit: dwaDuration != null ? 'min' : '' },
        { label: 'Kritischer Flächenanteil', value: fmt((result.criticalShare || 0) * 100, 1), unit: '%' },
        { label: 'Begründung', value: combinedStorage.governingReason || 'Die Nachweise sind noch nicht vollständig.', span: 3 }
      ],
      accent: 'green'
    },
    groups,
    notices: diagnostic.notices
  };
}

export default results;
