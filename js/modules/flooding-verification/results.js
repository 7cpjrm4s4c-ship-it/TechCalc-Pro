const fmt = (value, digits = 1) => Number(value || 0).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function results(state = {}, result = {}) {
  return {
    primary: {
      title: 'Regendauer und Flächenübersicht',
      primary: {
        label: 'Maßgebende Regendauer',
        value: String(result.governingDurationMinutes || 10),
        unit: 'min'
      },
      rows: [
        { label: 'Automatisch ermittelt', value: String(result.automaticDurationMinutes || 10), unit: 'min' },
        { label: 'Verwendete Quelle', value: result.durationSource === 'manual' ? 'manueller Override' : 'automatische DIN-Zuordnung' },
        { label: 'Befestigter Flächenanteil', value: fmt((result.sealedShare || 0) * 100, 1), unit: '%' },
        { label: 'Gesamtfläche', value: fmt(result.totalArea, 1), unit: 'm²' },
        { label: 'Dachflächen', value: fmt(result.roofArea, 1), unit: 'm²' },
        { label: 'Grundstücksflächen', value: fmt(result.propertyArea, 1), unit: 'm²' }
      ],
      accent: 'green'
    },
    groups: [
      {
        title: 'Regenspenden der verwendeten Dauer',
        rows: [
          { label: `r(${result.governingDurationMinutes || 10},2)`, value: fmt(result.rain?.r2?.[result.governingDurationMinutes] || 0, 1), unit: 'l/(s·ha)' },
          { label: `r(${result.governingDurationMinutes || 10},30)`, value: fmt(result.rain?.r30?.[result.governingDurationMinutes] || 0, 1), unit: 'l/(s·ha)' },
          { label: 'r(5,100) optional', value: result.rain?.r100Duration5 > 0 ? fmt(result.rain.r100Duration5, 1) : '—', unit: result.rain?.r100Duration5 > 0 ? 'l/(s·ha)' : '' },
          { label: 'Regendaten vollständig', value: result.rainInputValid ? 'ja' : 'nein' }
        ],
        accent: 'green'
      },
      {
        title: 'Summen für die spätere Berechnung',
        rows: [
          { label: 'Σ(A × Cₛ)', value: fmt(result.weightedCsArea, 2), unit: 'm²' },
          { label: 'Σ(A × Cₘ)', value: fmt(result.weightedCmArea, 2), unit: 'm²' },
          { label: 'gewichteter Cₛ', value: fmt(result.averageCs, 2) },
          { label: 'gewichteter Cₘ', value: fmt(result.averageCm, 2) },
          { label: 'Schema-Version', value: String(result.schemaVersion || state.schemaVersion || 2) }
        ],
        accent: 'green'
      }
    ],
    notices: [{
      title: 'Phase 47C.3',
      messages: Array.isArray(result.warnings) ? result.warnings : [],
      accent: 'green',
      emptyText: 'Regenspenden und Regendauer sind vollständig und valide.'
    }]
  };
}

export default results;
