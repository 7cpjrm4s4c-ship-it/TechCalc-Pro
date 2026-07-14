import { evaluateDwa117Applicability } from './retentionApplicability.js';
import { buildRetentionDurationComparison } from './retentionDurationComparison.js';

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
  const equation20 = flooding.equation20 || {};
  const equation21 = Array.isArray(flooding.equation21ByDuration) ? flooding.equation21ByDuration : [];
  const equation21Governing = flooding.equation21Governing || {};
  const governing = flooding.governing || {};
  const applicability = evaluateDwa117Applicability({
    enabled: retention.active,
    dischargeMode: result.dischargeMode,
    catchmentAreaHa: Number(result.totalArea || 0) / 10000,
    flowTimeMinutes: state.retentionFlowTimeMinutes,
    recurrenceFrequencyPerYear: state.retentionRecurrenceFrequencyPerYear,
    throttleRainShareLsHa: retention.throttleRainShareLsHa,
    surchargeFactorFz: state.retentionSurchargeFactorFz,
    reductionFactorFa: state.retentionReductionFactorFa
  });
  const retentionComparison = buildRetentionDurationComparison(retention.durationResults || []);

  const groups = [
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
      rows: [
        { label: 'Status', value: applicability.statusLabel },
        { label: 'Berechnung durchgeführt', value: retention.calculated ? 'ja' : 'nein' },
        { label: 'Uneingeschränkt anwendbar', value: applicability.unrestricted ? 'ja' : 'nein' },
        { label: 'Einzugsgebietsfläche', value: applicability.catchmentAreaHa != null ? fmt(applicability.catchmentAreaHa, 3) : '—', unit: applicability.catchmentAreaHa != null ? 'ha' : '' },
        { label: 'Fließzeit', value: applicability.flowTimeMinutes != null ? fmt(applicability.flowTimeMinutes, 1) : '—', unit: applicability.flowTimeMinutes != null ? 'min' : '' },
        { label: 'Überschreitungshäufigkeit n', value: applicability.recurrenceFrequencyPerYear != null ? fmt(applicability.recurrenceFrequencyPerYear, 2) : '—', unit: applicability.recurrenceFrequencyPerYear != null ? '1/a' : '' },
        { label: 'qDr,R,u', value: applicability.throttleRainShareLsHa != null ? fmt(applicability.throttleRainShareLsHa, 2) : '—', unit: applicability.throttleRainShareLsHa != null ? 'l/(s·ha)' : '' },
        ...applicability.checks.map(check => ({ label: check.label, value: check.passed ? 'erfüllt' : 'nicht erfüllt' }))
      ],
      accent: 'green'
    });
  }

  if (retention.active) {
    groups.push({
      title: 'DWA-A 117 – Dauerstufenvergleich',
      rows: retentionComparison.rows.length ? retentionComparison.rows.map(item => ({
        label: `${item.durationMinutes} min · r ${fmt(item.rainIntensityLsHa, 1)} l/(s·ha)${item.isGoverning ? ' · maßgebend' : ''}`,
        value: item.valid ? fmt(item.volumeM3, 2) : '—',
        unit: item.valid ? 'm³' : ''
      })) : [{ label: 'Status', value: 'Pflichtwerte oder Regenspenden fehlen' }],
      accent: 'green'
    });
    groups.push({
      title: 'DWA-A 117 – Maßgebende Dauerstufe',
      rows: [
        { label: 'Dauerstufen geprüft', value: String(retentionComparison.durationCount) },
        { label: 'Dauerstufen gültig', value: String(retentionComparison.validDurationCount) },
        { label: 'Maßgebende Dauer', value: retentionComparison.governing ? String(retentionComparison.governing.durationMinutes) : '—', unit: retentionComparison.governing ? 'min' : '' },
        { label: 'Regenspende r(D,n)', value: retentionComparison.governing ? fmt(retentionComparison.governing.rainIntensityLsHa, 1) : '—', unit: retentionComparison.governing ? 'l/(s·ha)' : '' },
        { label: 'qDr,R,u', value: retentionComparison.governing ? fmt(retentionComparison.governing.throttleRainShareLsHa, 2) : '—', unit: retentionComparison.governing ? 'l/(s·ha)' : '' },
        { label: 'Zuschlagsfaktor fz', value: retentionComparison.governing ? fmt(retentionComparison.governing.surchargeFactorFz, 3) : '—' },
        { label: 'Abminderungsfaktor fA', value: retentionComparison.governing ? fmt(retentionComparison.governing.reductionFactorFa, 3) : '—' },
        { label: 'Spezifisches Speichervolumen Vs,u', value: retentionComparison.governing ? fmt(retentionComparison.governing.specificStorageM3Ha, 2) : '—', unit: retentionComparison.governing ? 'm³/ha' : '' },
        { label: 'Maßgebendes Rückhaltevolumen', value: retentionComparison.governing ? fmt(retentionComparison.governing.volumeM3, 2) : '—', unit: retentionComparison.governing ? 'm³' : '' }
      ],
      accent: 'green'
    });
  }

  const diagnosticMessages = [
    ...(Array.isArray(result.warnings) ? result.warnings : []),
    ...applicability.messages,
    ...retentionComparison.messages
  ];

  return {
    primary: {
      title: 'Überflutungsnachweis',
      primary: {
        label: 'Maßgebendes Rückhaltevolumen nach DIN-Vergleich',
        value: result.floodingCalculationAvailable && governing.valueM3 != null ? fmt(governing.valueM3, 2) : '—',
        unit: result.floodingCalculationAvailable ? 'm³' : ''
      },
      rows: [
        { label: 'Maßgebende Gleichung', value: result.floodingCalculationAvailable ? floodingSourceLabel(governing.source) : 'unvollständig' },
        { label: 'Regendauer Gleichung (20)', value: equation20.valid ? String(equation20.durationMinutes) : '—', unit: equation20.valid ? 'min' : '' },
        { label: 'Maßgebende Dauer Gleichung (21)', value: equation21Governing.valid ? String(equation21Governing.durationMinutes) : '—', unit: equation21Governing.valid ? 'min' : '' },
        { label: 'Gleichung (20)', value: equation20.valid ? fmt(equation20.valueM3, 2) : '—', unit: equation20.valid ? 'm³' : '' },
        { label: 'Gleichung (21), Maximum', value: equation21Governing.valid ? fmt(equation21Governing.valueM3, 2) : '—', unit: equation21Governing.valid ? 'm³' : '' },
        { label: 'DWA-A 117', value: retention.active ? (retention.calculated ? `${fmt(retention.governing?.volumeM3 || 0, 2)} m³` : 'unvollständig') : 'nicht erforderlich' },
        { label: 'Kritischer Flächenanteil', value: fmt((result.criticalShare || 0) * 100, 1), unit: '%' }
      ],
      accent: 'green'
    },
    groups,
    notices: [{
      title: 'Hinweise und Diagnose',
      messages: diagnosticMessages,
      accent: 'green',
      emptyText: 'Überflutungsnachweis, DWA-A-117-Berechnung und Dauerstufenvergleich sind vollständig und valide.'
    }]
  };
}

export default results;
