import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const ventilationSchema = defineFormSchema({
  fields: [
    { key: 'mode', label: 'Betriebsart', type: FIELD_TYPES.SEGMENT, options: [{ value: 'heating', label: 'Heizung' }, { value: 'cooling', label: 'Kälte' }] },
    { key: 'heatingSupplyTemp', label: 'Zuluft Heizung', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'heatingRoomTemp', label: 'Raum Heizung', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'heatingPowerW', label: 'Heizleistung', type: FIELD_TYPES.DECIMAL, unit: 'W' },
    { key: 'heatingVolumeFlowM3h', label: 'Volumenstrom Heizung', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'heatingDeltaT', label: 'ΔT Heizung', type: FIELD_TYPES.DECIMAL, unit: 'K' },
    { key: 'coolingSupplyTemp', label: 'Zuluft Kälte', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'coolingRoomTemp', label: 'Raum Kälte', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'coolingPowerW', label: 'Kälteleistung', type: FIELD_TYPES.DECIMAL, unit: 'W' },
    { key: 'coolingVolumeFlowM3h', label: 'Volumenstrom Kälte', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'coolingDeltaT', label: 'ΔT Kälte', type: FIELD_TYPES.DECIMAL, unit: 'K' }
  ],
  groups: [
    { title: 'System', fields: ['mode'], columns: 1 },
    { title: 'Heizung', fields: ['heatingSupplyTemp', 'heatingRoomTemp', 'heatingPowerW', 'heatingVolumeFlowM3h', 'heatingDeltaT'], columns: 2 },
    { title: 'Kälte', fields: ['coolingSupplyTemp', 'coolingRoomTemp', 'coolingPowerW', 'coolingVolumeFlowM3h', 'coolingDeltaT'], columns: 2 }
  ]
});

export default ventilationSchema;
