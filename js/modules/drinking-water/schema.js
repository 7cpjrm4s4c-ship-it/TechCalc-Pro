import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { BUILDING_TYPES, CONSUMERS } from './logic.js';

export const drinkingWaterSchema = defineFormSchema({
  fields: [
    { key: 'buildingType', label: 'Gebäudetyp', type: FIELD_TYPES.SELECT, options: BUILDING_TYPES.map(item => ({ value: item.id, label: item.label })) },
    { key: 'waterHeatingMode', label: 'Warmwasserbereitung', type: FIELD_TYPES.SEGMENT, options: [{ value: 'central', label: 'Zentral' }, { value: 'decentral', label: 'Dezentral' }] },
    { key: 'unitName', label: 'Nutzungseinheit', type: FIELD_TYPES.TEXT },
    { key: 'unitConsumerType', label: 'Verbraucher', type: FIELD_TYPES.SELECT, options: CONSUMERS.map(item => ({ value: item.id, label: item.label })) },
    { key: 'unitCount', label: 'Anzahl', type: FIELD_TYPES.INTEGER },
    { key: 'unitSimultaneityFactor', label: 'Gleichzeitigkeitsfaktor', type: FIELD_TYPES.DECIMAL },
    { key: 'singleName', label: 'Einzelverbraucher-Gruppe', type: FIELD_TYPES.TEXT },
    { key: 'singleConsumerType', label: 'Einzelverbraucher', type: FIELD_TYPES.SELECT, options: CONSUMERS.map(item => ({ value: item.id, label: item.label })) },
    { key: 'singleCount', label: 'Anzahl', type: FIELD_TYPES.INTEGER }
  ],
  groups: [
    { title: 'Gebäude', fields: ['buildingType', 'waterHeatingMode'], columns: 2 },
    { title: 'Nutzungseinheiten', fields: ['unitName', 'unitConsumerType', 'unitCount', 'unitSimultaneityFactor'], columns: 2 },
    { title: 'Einzelverbraucher', fields: ['singleName', 'singleConsumerType', 'singleCount'], columns: 2 }
  ]
});

export default drinkingWaterSchema;
