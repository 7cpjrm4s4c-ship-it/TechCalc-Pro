import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const heatRecoverySchema = defineFormSchema({
  fields: [
    { key: 'mode', label: 'Berechnungsart', type: FIELD_TYPES.SEGMENT, options: [{ value: 'wrg', label: 'WRG' }, { value: 'mixing', label: 'Mischluft' }] },
    { key: 'wrgVolumeFlowM3h', label: 'Volumenstrom', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'outdoorTemp', label: 'Außenluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'outdoorRh', label: 'Außenluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'extractTemp', label: 'Abluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'extractRh', label: 'Abluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'efficiency', label: 'Rückwärmzahl', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'bypassPercent', label: 'Bypass', type: FIELD_TYPES.DECIMAL, unit: '%' }
  ],
  groups: [
    { title: 'Berechnungsart', fields: ['mode'], columns: 1 },
    { title: 'WRG Eingaben', fields: ['wrgVolumeFlowM3h', 'outdoorTemp', 'outdoorRh', 'extractTemp', 'extractRh', 'efficiency', 'bypassPercent'], columns: 2 }
  ]
});

export default heatRecoverySchema;
