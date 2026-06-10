import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const pipeSizingSchema = defineFormSchema({
  fields: [
    { key: 'pipeName', label: 'Abschnitt', type: FIELD_TYPES.TEXT },
    { key: 'systemId', label: 'Rohrsystem', type: FIELD_TYPES.TEXT },
    { key: 'flowValue', label: 'Volumen-/Massenstrom', type: FIELD_TYPES.DECIMAL },
    { key: 'flowUnit', label: 'Einheit', type: FIELD_TYPES.SELECT, options: [{ value: 'kg/h', label: 'kg/h' }, { value: 'm³/h', label: 'm³/h' }, { value: 'l/s', label: 'l/s' }] },
    { key: 'maxPressurePam', label: 'Max. Druckverlust', type: FIELD_TYPES.DECIMAL, unit: 'Pa/m' }
  ],
  groups: [
    { title: 'Abschnitt', fields: ['pipeName', 'systemId'], columns: 2 },
    { title: 'Bemessung', fields: ['flowValue', 'flowUnit', 'maxPressurePam'], columns: 2 }
  ]
});

export default pipeSizingSchema;
