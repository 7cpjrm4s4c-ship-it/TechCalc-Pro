const formatNumber = (value, digits = 2) => {
  if (!Number.isFinite(value)) return '–';
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(value);
};

const statusLabel = status => {
  if (status === 'ready-for-assessment') return 'Eingaben vollständig';
  return 'Eingaben unvollständig';
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
        { label: 'Sicherheitsklasse', value: calculation.safetyClass?.id || '–' },
        { label: 'Füllmenge', value: formatNumber(calculation.chargeKg), unit: 'kg' },
        { label: 'Raumvolumen', value: formatNumber(calculation.roomVolumeM3), unit: 'm³' }
      ],
      accent: 'blue'
    },
    groups: [
      {
        title: 'Aufstellung',
        rows: [
          { label: 'Aufstellort', value: currentState.installationLocation || '–' },
          { label: 'Zugangsbereich', value: currentState.accessArea || '–' },
          { label: 'Nutzung', value: currentState.usageType || '–' },
          { label: 'Lüftung', value: currentState.ventilationType || '–' }
        ]
      },
      {
        title: 'Schutzmaßnahmen',
        rows: [
          { label: 'Gaswarnsystem', value: currentState.hasGasWarningSystem || '–' },
          { label: 'Maschinenraum', value: currentState.hasMachineryRoom || '–' },
          { label: 'Weitere Maßnahmen', value: currentState.additionalSafetyMeasures || '–' }
        ]
      }
    ],
    notices: calculation.notices || []
  };
}

export default buildEN378SafetyCheckResultModel;
