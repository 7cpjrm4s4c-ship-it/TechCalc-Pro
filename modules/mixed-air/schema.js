import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const mixedAirSchema = defineFormSchema({
  fields: [
    { key: 'mixingOutdoorVolumeFlowM3h', label: 'Außenluft Volumenstrom V̇', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'mixingOutdoorTemp', label: 'Außenluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'mixingOutdoorRh', label: 'Außenluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'mixingRecircVolumeFlowM3h', label: 'Umluft Volumenstrom V̇', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'mixingRecircTemp', label: 'Umluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'mixingRecircRh', label: 'Umluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' }
  ],
  groups: [
    { title: 'Außenluft', fields: ['mixingOutdoorVolumeFlowM3h', 'mixingOutdoorTemp', 'mixingOutdoorRh'], columns: 2 },
    { title: 'Umluft / Raumluft', fields: ['mixingRecircVolumeFlowM3h', 'mixingRecircTemp', 'mixingRecircRh'], columns: 2 }
  ]
});

export default mixedAirSchema;
