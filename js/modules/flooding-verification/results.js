export function results(state = {}, result = {}) {
  return {
    primary: {
      title: 'Überflutungsnachweis',
      primary: {
        label: 'Implementierungsstatus',
        value: result.calculationAvailable ? 'Berechnung verfügbar' : 'Infrastruktur bereit',
        unit: ''
      },
      rows: [
        { label: 'Schema-Version', value: String(result.schemaVersion || state.schemaVersion || 2) },
        { label: 'Gespeicherte Flächen', value: String(result.surfaceCount || 0) },
        { label: 'Gesamtfläche', value: String(result.totalArea || 0), unit: 'm²' }
      ],
      accent: 'green'
    },
    groups: [],
    notices: [{
      title: 'Phase 47C.1',
      messages: Array.isArray(result.warnings) ? result.warnings : [],
      accent: 'green',
      emptyText: 'Modulinfrastruktur ist bereit.'
    }]
  };
}

export default results;
