const fmt = (value, digits = 1) => Number(value || 0).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const modeLabel = mode => ({
  'table-existing-pipe': 'Vorhandene Leitung prüfen',
  'table-size-pipe': 'Leitung dimensionieren',
  'manual-full-flow': 'Vollfüllungsabfluss manuell',
  'authority-discharge-limit': 'Behördliche Einleitungsbegrenzung'
}[mode] || 'Leitungsnachweis');

export function results(state = {}, result = {}) {
  const discharge = result.discharge || {};
  return {
    primary: {
      title: 'Leitungs- und Abflussnachweis',
      primary: {
        label: 'Erforderlicher Regenwasserabfluss Qᵣ',
        value: fmt(result.requiredRainFlowLs, 2),
        unit: 'l/s'
      },
      rows: [
        { label: 'Betriebsart', value: modeLabel(result.dischargeMode) },
        { label: 'Verfügbarer Abfluss', value: result.availableFlowLs > 0 ? fmt(result.availableFlowLs, 2) : '—', unit: result.availableFlowLs > 0 ? 'l/s' : '' },
        { label: 'Auslastung', value: result.availableFlowLs > 0 ? fmt(result.utilizationPercent, 1) : '—', unit: result.availableFlowLs > 0 ? '%' : '' },
        { label: 'Nachweis', value: result.dischargeAdequate ? 'ausreichend' : 'nicht ausreichend / unvollständig' },
        { label: 'Maßgebende Regendauer', value: String(result.governingDurationMinutes || 10), unit: 'min' },
        { label: 'Befestigter Flächenanteil', value: fmt((result.sealedShare || 0) * 100, 1), unit: '%' }
      ],
      accent: 'green'
    },
    groups: [
      {
        title: 'Leitungsdaten',
        rows: [
          { label: 'Nennweite', value: discharge.dn || '—' },
          { label: 'Gefälle', value: discharge.slopePermille != null ? fmt(discharge.slopePermille, 0) : '—', unit: discharge.slopePermille != null ? '‰' : '' },
          { label: 'Vollfüllungsabfluss Qvoll', value: discharge.qFullLs > 0 ? fmt(discharge.qFullLs, 2) : '—', unit: discharge.qFullLs > 0 ? 'l/s' : '' },
          { label: 'Behördliche Begrenzung', value: discharge.qLimitLs > 0 ? fmt(discharge.qLimitLs, 2) : '—', unit: discharge.qLimitLs > 0 ? 'l/s' : '' },
          { label: 'Fließgeschwindigkeit', value: discharge.velocityMs > 0 ? fmt(discharge.velocityMs, 2) : '—', unit: discharge.velocityMs > 0 ? 'm/s' : '' },
          { label: 'Quelle', value: discharge.tableReference || '—' },
          { label: 'Zuordnung', value: discharge.lookupMode === 'exact' ? 'exakter Tabellenwert' : discharge.lookupMode === 'manual' ? 'manuelle Vorgabe' : discharge.lookupMode === 'authority-limit' ? 'behördliche Vorgabe' : '—' }
        ],
        accent: 'green'
      },
      {
        title: 'Berechnungsgrundlagen',
        rows: [
          { label: `r(${result.governingDurationMinutes || 10},2)`, value: fmt(result.rain?.r2?.[result.governingDurationMinutes] || 0, 1), unit: 'l/(s·ha)' },
          { label: 'Σ(A × Cₛ)', value: fmt(result.weightedCsArea, 2), unit: 'm²' },
          { label: 'Gesamtfläche', value: fmt(result.totalArea, 1), unit: 'm²' },
          { label: 'Regendaten vollständig', value: result.rainInputValid ? 'ja' : 'nein' },
          { label: 'Schema-Version', value: String(result.schemaVersion || state.schemaVersion || 2) }
        ],
        accent: 'green'
      }
    ],
    notices: [{
      title: 'Phase 47C.4',
      messages: Array.isArray(result.warnings) ? result.warnings : [],
      accent: 'green',
      emptyText: 'Leitungs- und Abflussnachweis ist vollständig und valide.'
    }]
  };
}

export default results;