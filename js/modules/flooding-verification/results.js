const fmt = (value, digits = 1) => Number(value || 0).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function results(state = {}, result = {}) {
  return {
    primary: {
      title: 'Flächenübersicht',
      primary: {
        label: 'Gesamtfläche',
        value: fmt(result.totalArea, 1),
        unit: 'm²'
      },
      rows: [
        { label: 'Dachflächen', value: fmt(result.roofArea, 1), unit: 'm²' },
        { label: 'Grundstücksflächen', value: fmt(result.propertyArea, 1), unit: 'm²' },
        { label: 'Flächen gesamt', value: String(result.surfaceCount || 0) },
        { label: 'davon gültig', value: String(result.validSurfaceCount || 0) },
        { label: 'gewichteter Cₛ', value: fmt(result.averageCs, 2) },
        { label: 'gewichteter Cₘ', value: fmt(result.averageCm, 2) }
      ],
      accent: 'green'
    },
    groups: [{
      title: 'Summen für die spätere Berechnung',
      rows: [
        { label: 'Σ(A × Cₛ)', value: fmt(result.weightedCsArea, 2), unit: 'm²' },
        { label: 'Σ(A × Cₘ)', value: fmt(result.weightedCmArea, 2), unit: 'm²' },
        { label: 'Schema-Version', value: String(result.schemaVersion || state.schemaVersion || 2) }
      ],
      accent: 'green'
    }],
    notices: [{
      title: 'Phase 47C.2',
      messages: Array.isArray(result.warnings) ? result.warnings : [],
      accent: 'green',
      emptyText: 'Flächenverwaltung ist vollständig und valide.'
    }]
  };
}

export default results;
