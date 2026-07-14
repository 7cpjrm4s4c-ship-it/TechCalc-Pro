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
  const equation20 = flooding.equation20 || {};
  const equation21 = Array.isArray(flooding.equation21ByDuration) ? flooding.equation21ByDuration : [];
  const equation21Governing = flooding.equation21Governing || {};
  const governing = flooding.governing || {};
  return {
    primary: {
      title: 'Überflutungsnachweis',
      primary: {
        label: 'Maßgebendes Rückhaltevolumen',
        value: result.floodingCalculationAvailable && governing.valueM3 != null ? fmt(governing.valueM3, 2) : '—',
        unit: result.floodingCalculationAvailable ? 'm³' : ''
      },
      rows: [
        { label: 'Maßgebende Gleichung', value: result.floodingCalculationAvailable ? floodingSourceLabel(governing.source) : 'unvollständig' },
        { label: 'Maßgebende Dauer', value: result.floodingCalculationAvailable ? String(governing.durationMinutes || '—') : '—', unit: result.floodingCalculationAvailable ? 'min' : '' },
        { label: 'Gleichung (20)', value: equation20.valid ? fmt(equation20.valueM3, 2) : '—', unit: equation20.valid ? 'm³' : '' },
        { label: 'Gleichung (21), Maximum', value: equation21Governing.valid ? fmt(equation21Governing.valueM3, 2) : '—', unit: equation21Governing.valid ? 'm³' : '' },
        { label: 'Kritischer Flächenanteil', value: fmt((result.criticalShare || 0) * 100, 1), unit: '%' }
      ],
      accent: 'green'
    },
    groups: [
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
          { label: 'Regendauer D', value: equation20.valid ? String(equation20.durationMinutes) : '—', unit: equation20.valid ? 'min' : '' },
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
          label: `${item.durationMinutes} min · r(${item.durationMinutes},30) ${fmt(item.rain30, 1)} l/(s·ha)`,
          value: item.valid ? fmt(item.valueM3, 2) : '—',
          unit: item.valid ? 'm³' : ''
        })),
        accent: 'green'
      },
      {
        title: 'Berechnungsgrundlagen',
        rows: [
          { label: 'Mittlere Geländeneigung', value: fmt(state.meanSlopePercent, 1), unit: '%' },
          { label: 'Automatische Regendauer', value: String(result.automaticDurationMinutes || '—'), unit: 'min' },
          { label: 'Verwendete Regendauer', value: String(result.governingDurationMinutes || '—'), unit: 'min' },
          { label: 'Befestigte Fläche', value: fmt(result.sealedArea, 1), unit: 'm²' },
          { label: 'Befestigter Flächenanteil', value: fmt((result.sealedShare || 0) * 100, 1), unit: '%' },
          { label: 'Kritische Fläche', value: fmt(result.criticalArea, 1), unit: 'm²' },
          { label: 'Gesamtfläche', value: fmt(result.totalArea, 1), unit: 'm²' },
          { label: 'Regendaten vollständig', value: result.rainInputValid ? 'ja' : 'nein' },
          { label: 'Schema-Version', value: String(result.schemaVersion || state.schemaVersion || 2) }
        ],
        accent: 'green'
      }
    ],
    notices: [{
      title: 'Hinweise und Diagnose',
      messages: Array.isArray(result.warnings) ? result.warnings : [],
      accent: 'green',
      emptyText: 'Überflutungsnachweis und Dauerstufenvergleich sind vollständig und valide.'
    }]
  };
}

export default results;
