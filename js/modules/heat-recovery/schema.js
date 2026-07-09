import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const heatRecoverySchema = defineFormSchema({
  fields: [
    { key: 'activeRltDeviceName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'wrgVolumeFlowM3h', label: 'Anlagenvolumenstrom V̇', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'outdoorTemp', label: 'Außenluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'outdoorRh', label: 'Außenluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'extractTemp', label: 'Abluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'extractRh', label: 'Abluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'efficiency', label: 'WRG-Wirkungsgrad', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'bypassPercent', label: 'Bypass-Anteil β', type: FIELD_TYPES.DECIMAL, unit: '%' }
  ],
  groups: [
    { title: 'WRG Eingaben', fields: ['wrgVolumeFlowM3h', 'outdoorTemp', 'outdoorRh', 'extractTemp', 'extractRh', 'efficiency', 'bypassPercent'], columns: 2 },
    { title: 'RLT-Geräte', fields: ['activeRltDeviceName'], columns: 1 }
  ]
});

export default heatRecoverySchema;
