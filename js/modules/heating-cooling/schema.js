import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const heatingCoolingSchema = defineFormSchema({
  fields: [
    { key: 'mode', label: 'Betriebsart', type: FIELD_TYPES.SEGMENT, options: [{ value: 'heating', label: 'Heizung' }, { value: 'cooling', label: 'Kälte' }] },
    { key: 'mediumId', label: 'Medium', type: FIELD_TYPES.TEXT },
    { key: 'pipeSystemId', label: 'Rohrsystem', type: FIELD_TYPES.TEXT },
    { key: 'heatingPowerW', label: 'Heizleistung', type: FIELD_TYPES.DECIMAL, unit: 'W' },
    { key: 'heatingMassFlowKgh', label: 'Massenstrom Heizung', type: FIELD_TYPES.DECIMAL, unit: 'kg/h' },
    { key: 'heatingDeltaT', label: 'ΔT Heizung', type: FIELD_TYPES.DECIMAL, unit: 'K' },
    { key: 'coolingPowerW', label: 'Kälteleistung', type: FIELD_TYPES.DECIMAL, unit: 'W' },
    { key: 'coolingMassFlowKgh', label: 'Massenstrom Kälte', type: FIELD_TYPES.DECIMAL, unit: 'kg/h' },
    { key: 'coolingDeltaT', label: 'ΔT Kälte', type: FIELD_TYPES.DECIMAL, unit: 'K' }
  ],
  groups: [
    { title: 'System', fields: ['mode', 'mediumId', 'pipeSystemId'], columns: 2 },
    { title: 'Heizung', fields: ['heatingPowerW', 'heatingMassFlowKgh', 'heatingDeltaT'], columns: 2 },
    { title: 'Kälte', fields: ['coolingPowerW', 'coolingMassFlowKgh', 'coolingDeltaT'], columns: 2 }
  ]
});

export default heatingCoolingSchema;
