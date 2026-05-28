import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { MEDIA } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';

export const heatingCoolingSchema = defineFormSchema({
  fields: [
    { key: 'mode', label: 'Betriebsart', type: FIELD_TYPES.SEGMENT, options: [{ value: 'heating', label: 'Heizung' }, { value: 'cooling', label: 'Kälte' }] },
    { key: 'mediumId', label: 'Medium', type: FIELD_TYPES.SELECT, options: MEDIA.map(item => ({ value: item.id, label: item.label })), lookup: true, commit: 'immediate' },
    { key: 'pipeSystemId', label: 'Rohrsystem', type: FIELD_TYPES.SELECT, options: pipeSystems.map(item => ({ value: item.id, label: item.label })), lookup: true, commit: 'immediate' },
    { key: 'heatingCalcTarget', label: 'Berechnung Heizung', type: FIELD_TYPES.SEGMENT, options: [{ value: 'power', label: 'Leistung' }, { value: 'massFlow', label: 'Massenstrom' }, { value: 'deltaT', label: 'Temperatur' }] },
    { key: 'heatingPowerW', label: 'Heizleistung', type: FIELD_TYPES.DECIMAL, unit: 'W' },
    { key: 'heatingMassFlowKgh', label: 'Massenstrom Heizung', type: FIELD_TYPES.DECIMAL, unit: 'kg/h' },
    { key: 'heatingDeltaT', label: 'ΔT Heizung', type: FIELD_TYPES.DECIMAL, unit: 'K' },
    { key: 'coolingCalcTarget', label: 'Berechnung Kälte', type: FIELD_TYPES.SEGMENT, options: [{ value: 'power', label: 'Leistung' }, { value: 'massFlow', label: 'Massenstrom' }, { value: 'deltaT', label: 'Temperatur' }] },
    { key: 'coolingPowerW', label: 'Kälteleistung', type: FIELD_TYPES.DECIMAL, unit: 'W' },
    { key: 'coolingMassFlowKgh', label: 'Massenstrom Kälte', type: FIELD_TYPES.DECIMAL, unit: 'kg/h' },
    { key: 'coolingDeltaT', label: 'ΔT Kälte', type: FIELD_TYPES.DECIMAL, unit: 'K' }
  ],
  groups: [
    { title: 'System', fields: ['mode', 'mediumId', 'pipeSystemId'], columns: 2 },
    { title: 'Heizung', fields: ['heatingCalcTarget', 'heatingPowerW', 'heatingMassFlowKgh', 'heatingDeltaT'], columns: 2 },
    { title: 'Kälte', fields: ['coolingCalcTarget', 'coolingPowerW', 'coolingMassFlowKgh', 'coolingDeltaT'], columns: 2 }
  ]
});

export default heatingCoolingSchema;
