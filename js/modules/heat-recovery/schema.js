import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const heatRecoverySchema = defineFormSchema({
  fields: [
    { key: 'mode', label: 'Berechnungsart', type: FIELD_TYPES.SEGMENT, options: [{ value: 'wrg', label: 'WRG' }, { value: 'mixing', label: 'Mischluft' }] },
    { key: 'activeRltDeviceName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'wrgVolumeFlowM3h', label: 'Anlagenvolumenstrom V̇', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'outdoorTemp', label: 'Außenluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'outdoorRh', label: 'Außenluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'extractTemp', label: 'Abluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'extractRh', label: 'Abluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'efficiency', label: 'WRG-Wirkungsgrad', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'bypassPercent', label: 'Bypass-Anteil β', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'mixingOutdoorVolumeFlowM3h', label: 'Außenluft Volumenstrom V̇', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'mixingOutdoorTemp', label: 'Außenluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'mixingOutdoorRh', label: 'Außenluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'mixingRecircVolumeFlowM3h', label: 'Umluft Volumenstrom V̇', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'mixingRecircTemp', label: 'Umluft Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'mixingRecircRh', label: 'Umluft Feuchte', type: FIELD_TYPES.DECIMAL, unit: '%' }
  ],
  groups: [
    { title: 'Berechnungsart', fields: ['mode'], columns: 1 },
    { title: 'WRG Eingaben', fields: ['wrgVolumeFlowM3h', 'outdoorTemp', 'outdoorRh', 'extractTemp', 'extractRh', 'efficiency', 'bypassPercent'], columns: 2 },
    { title: 'Mischluft Eingaben', fields: ['mixingOutdoorVolumeFlowM3h', 'mixingOutdoorTemp', 'mixingOutdoorRh', 'mixingRecircVolumeFlowM3h', 'mixingRecircTemp', 'mixingRecircRh'], columns: 2 },
    { title: 'RLT-Geräte', fields: ['activeRltDeviceName'], columns: 1 }
  ]
});

export default heatRecoverySchema;
